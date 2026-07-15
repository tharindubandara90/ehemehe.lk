/* Optional one-time cleanup for old ads that stored Base64 images in the ads table.
 * Run locally after copying Vercel environment variables into .env.local:
 *   node scripts/migrate-base64-ad-images.js
 */
const fs = require('fs');
const path = require('path');

for (const file of ['.env.local', '.env']) {
  const filename = path.join(__dirname, '..', file);
  if (!fs.existsSync(filename)) continue;
  for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith('#') || !value.includes('=')) continue;
    const index = value.indexOf('=');
    const key = value.slice(0, index).trim();
    let content = value.slice(index + 1).trim();
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) content = content.slice(1, -1);
    if (!process.env[key]) process.env[key] = content;
  }
}

const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = { apikey: key, Authorization: `Bearer ${key}` };

function parse(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) {}
  }
  return fallback;
}

function decode(value) {
  const match = String(value || '').match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) return null;
  const mime = match[1];
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  return { mime, ext, buffer: Buffer.from(match[2], 'base64') };
}

async function ensureBucket() {
  const response = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'ad-images', name: 'ad-images', public: true })
  });
  if (!response.ok && ![400,409].includes(response.status)) {
    throw new Error(`Could not create storage bucket: HTTP ${response.status}`);
  }
}

async function upload(adId, index, image) {
  if (/^https?:\/\//i.test(image)) return image;
  const decoded = decode(image);
  if (!decoded) return '';
  const objectPath = `migrated/${adId}/${Date.now()}-${index}.${decoded.ext}`;
  const response = await fetch(`${url}/storage/v1/object/ad-images/${objectPath}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': decoded.mime, 'x-upsert': 'true' },
    body: decoded.buffer
  });
  if (!response.ok) throw new Error(`Upload failed for ad ${adId}, image ${index + 1}: HTTP ${response.status}`);
  return `${url}/storage/v1/object/public/ad-images/${objectPath}`;
}

async function updateAd(id, images) {
  const response = await fetch(`${url}/rest/v1/ads?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ image_url: images[0] || null, images, updated_at: new Date().toISOString() })
  });
  if (!response.ok) throw new Error(`Could not update ad ${id}: HTTP ${response.status}`);
}

(async () => {
  await ensureBucket();
  const response = await fetch(`${url}/rest/v1/ads?select=id,image_url,images&order=created_at.asc&limit=1000`, { headers });
  if (!response.ok) throw new Error(`Could not read ads: HTTP ${response.status}`);
  const rows = await response.json();
  let migrated = 0;

  for (const row of rows) {
    const current = parse(row.images, []);
    const values = (current.length ? current : [row.image_url]).filter(Boolean);
    if (!values.some((value) => String(value).startsWith('data:image/'))) continue;
    const uploaded = [];
    for (let index = 0; index < values.length; index += 1) {
      const urlValue = await upload(row.id, index, values[index]);
      if (urlValue) uploaded.push(urlValue);
    }
    await updateAd(row.id, uploaded);
    migrated += 1;
    console.log(`Migrated ad ${row.id} (${uploaded.length} images)`);
  }

  console.log(`Finished. Migrated ${migrated} ads.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
