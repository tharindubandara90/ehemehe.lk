(() => {
  'use strict';

  const STORAGE_KEY = 'ehemehe:postAdForm:v4';
  const SELECTION_KEY = 'ehemehe:postAdSelection:v1';
  const LEGACY_FIELDS_KEY = 'ehemehePostAdExtraFields';

  const DISTRICT_CITIES = {
    Colombo: [
      'Colombo', 'Colombo 01', 'Colombo 02', 'Colombo 03', 'Colombo 04',
      'Colombo 05', 'Colombo 06', 'Colombo 07', 'Colombo 08', 'Colombo 09',
      'Colombo 10', 'Colombo 11', 'Colombo 12', 'Colombo 13', 'Colombo 14',
      'Colombo 15', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Sri Jayawardenepura Kotte',
      'Nugegoda', 'Maharagama', 'Kaduwela', 'Homagama', 'Padukka', 'Avissawella', 'Hanwella'
    ],
    Gampaha: [
      'Gampaha', 'Negombo', 'Wattala', 'Ja-Ela', 'Katana', 'Minuwangoda',
      'Divulapitiya', 'Mirigama', 'Veyangoda', 'Nittambuwa', 'Kiribathgoda',
      'Kelaniya', 'Kadawatha', 'Ragama', 'Ganemulla'
    ],
    Kalutara: [
      'Kalutara', 'Panadura', 'Horana', 'Bandaragama', 'Beruwala', 'Aluthgama',
      'Matugama', 'Agalawatta', 'Ingiriya', 'Wadduwa', 'Bulathsinhala'
    ],
    Kandy: [
      'Kandy', 'Peradeniya', 'Katugastota', 'Gampola', 'Nawalapitiya',
      'Kundasale', 'Digana', 'Kadugannawa', 'Akurana', 'Pallekele',
      'Wattegama', 'Galagedara'
    ],
    Matale: [
      'Matale', 'Dambulla', 'Galewela', 'Naula', 'Rattota', 'Ukuwela',
      'Sigiriya', 'Laggala', 'Yatawatta', 'Pallepola'
    ],
    'Nuwara Eliya': [
      'Nuwara Eliya', 'Hatton', 'Talawakele', 'Nanu Oya', 'Ginigathhena',
      'Maskeliya', 'Ragala', 'Walapane', 'Hanguranketha', 'Kotagala'
    ],
    Galle: [
      'Galle', 'Ambalangoda', 'Hikkaduwa', 'Baddegama', 'Elpitiya', 'Bentota',
      'Karapitiya', 'Ahangama', 'Balapitiya', 'Koggala', 'Neluwa'
    ],
    Matara: [
      'Matara', 'Weligama', 'Akuressa', 'Dikwella', 'Hakmana', 'Kamburupitiya',
      'Deniyaya', 'Devinuwara', 'Mirissa', 'Pitabeddara'
    ],
    Hambantota: [
      'Hambantota', 'Tangalle', 'Tissamaharama', 'Ambalantota', 'Beliatta',
      'Weeraketiya', 'Sooriyawewa', 'Lunugamvehera'
    ],
    Jaffna: [
      'Jaffna', 'Nallur', 'Chavakachcheri', 'Point Pedro', 'Karainagar',
      'Kayts', 'Kopay', 'Tellippalai', 'Chankanai'
    ],
    Kilinochchi: ['Kilinochchi', 'Paranthan', 'Poonakary', 'Pallai', 'Kandavalai'],
    Mullaitivu: ['Mullaitivu', 'Puthukudiyiruppu', 'Oddusuddan', 'Mankulam', 'Maritimepattu'],
    Vavuniya: ['Vavuniya', 'Cheddikulam', 'Nedunkeni', 'Omanthai', 'Vavuniya South'],
    Mannar: ['Mannar', 'Madhu', 'Murunkan', 'Pesalai', 'Talaimannar', 'Nanattan'],
    Trincomalee: [
      'Trincomalee', 'Kinniya', 'Kantale', 'Muttur', 'Nilaveli',
      'Seruwila', 'Kuchchaveli', 'Thampalakamam'
    ],
    Batticaloa: [
      'Batticaloa', 'Kattankudy', 'Eravur', 'Valaichchenai', 'Kaluwanchikudy',
      'Oddamavadi', 'Vakarai', 'Chenkalady'
    ],
    Ampara: [
      'Ampara', 'Kalmunai', 'Akkaraipattu', 'Sammanthurai', 'Pottuvil',
      'Sainthamaruthu', 'Dehiattakandiya', 'Maha Oya', 'Uhana', 'Nintavur'
    ],
    Kurunegala: [
      'Kurunegala', 'Kuliyapitiya', 'Narammala', 'Pannala', 'Polgahawela',
      'Wariyapola', 'Nikaweratiya', 'Maho', 'Bingiriya', 'Ibbagamuwa',
      'Alawwa', 'Galgamuwa'
    ],
    Puttalam: [
      'Puttalam', 'Chilaw', 'Wennappuwa', 'Marawila', 'Nattandiya',
      'Dankotuwa', 'Kalpitiya', 'Anamaduwa', 'Madampe', 'Nawagattegama'
    ],
    Anuradhapura: [
      'Anuradhapura', 'Kekirawa', 'Medawachchiya', 'Mihintale', 'Tambuttegama',
      'Eppawala', 'Galenbindunuwewa', 'Horowpothana', 'Nochchiyagama',
      'Kebithigollewa'
    ],
    Polonnaruwa: [
      'Polonnaruwa', 'Kaduruwela', 'Hingurakgoda', 'Medirigiriya',
      'Minneriya', 'Welikanda', 'Aralaganwila', 'Bakamuna'
    ],
    Badulla: [
      'Badulla', 'Bandarawela', 'Haputale', 'Welimada', 'Mahiyanganaya',
      'Ella', 'Hali-Ela', 'Passara', 'Diyatalawa', 'Lunugala', 'Kandaketiya'
    ],
    Monaragala: [
      'Monaragala', 'Wellawaya', 'Buttala', 'Bibile', 'Kataragama',
      'Siyambalanduwa', 'Medagama', 'Thanamalwila', 'Badalkumbura'
    ],
    Ratnapura: [
      'Ratnapura', 'Balangoda', 'Embilipitiya', 'Pelmadulla', 'Eheliyagoda',
      'Kuruwita', 'Kahawatta', 'Kalawana', 'Rakwana', 'Godakawela'
    ],
    Kegalle: [
      'Kegalle', 'Mawanella', 'Warakapola', 'Rambukkana', 'Ruwanwella',
      'Yatiyantota', 'Deraniyagala', 'Dehiowita', 'Aranayake', 'Hemmathagama'
    ]
  };

  const VEHICLE_BODY_TYPES = {
    cars: {
      label: 'Car Body Type',
      options: ['Sedan / Saloon', 'Hatchback', 'Station Wagon', 'Coupe / Sports', 'Convertible', 'MPV / Minivan', 'Crossover', 'Other']
    },
    suvs: {
      label: 'SUV / Jeep Type',
      options: ['Compact SUV', 'Mid-size SUV', 'Full-size SUV', 'Crossover SUV', '4x4 / Off-road', 'Other']
    },
    motorbikes: {
      label: 'Motorbike Type',
      options: ['Scooter', 'Standard / Commuter', 'Sports Bike', 'Naked Bike', 'Cruiser', 'Touring', 'Adventure / Dual Sport', 'Off-road / Dirt Bike', 'Moped', 'Electric Motorbike', 'Other']
    },
    'three-wheelers': {
      label: 'Three Wheeler Type',
      options: ['Passenger Three Wheeler', 'Cargo Three Wheeler', 'Electric Three Wheeler', 'Other']
    },
    vans: {
      label: 'Van Type',
      options: ['Mini Van', 'Passenger Van', 'Cargo / Panel Van', 'High-roof Van', 'Camper Van', 'Other']
    },
    buses: {
      label: 'Bus Type',
      options: ['Mini Bus', 'School Bus', 'Staff / Office Bus', 'City Bus', 'Coach / Luxury Bus', 'Double-decker Bus', 'Other']
    },
    lorries: {
      label: 'Lorry Type',
      options: ['Light Truck', 'Medium Truck', 'Heavy Truck', 'Tipper / Dump Truck', 'Box Truck', 'Flatbed Truck', 'Refrigerated Truck', 'Tanker', 'Tractor Head / Prime Mover', 'Other']
    }
  };

  const f = (key, label, type = 'text', options = {}) => ({
    key, label, type, ...options
  });

  const COMMON_VEHICLE = [
    f('vehicle_brand', 'Brand / Make', 'select', {
      required: true,
      options: ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'Mitsubishi', 'Mazda', 'Mercedes-Benz', 'BMW', 'Audi', 'Hyundai', 'Kia', 'Bajaj', 'TVS', 'Yamaha', 'Isuzu', 'Tata', 'Mahindra', 'Other']
    }),
    f('vehicle_model', 'Model', 'text', {
      required: true,
      placeholder: 'Axio, Premio, Vitz, Alto...'
    }),
    f('year_manufacture', 'Year of Manufacture', 'number', { placeholder: '2015' }),
    f('year_registered', 'Year of Registration', 'number', { placeholder: '2016' }),
    f('mileage_km', 'Mileage (km)', 'number', { required: true, placeholder: '85000' }),
    f('fuel_type', 'Fuel Type', 'select', {
      required: true,
      options: ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'CNG', 'Other']
    }),
    f('transmission', 'Gear / Transmission', 'select', {
      required: true,
      options: ['Automatic', 'Manual', 'Tiptronic', 'CVT', 'DCT', 'Other']
    }),
    f('engine_capacity', 'Engine Capacity / CC', 'number', { placeholder: '1500' }),
    f('ownership', 'Ownership', 'select', {
      options: ['1st owner', '2nd owner', '3rd owner', '4th owner or more', 'Unregistered']
    }),
    f('condition_notes', 'Vehicle Condition Notes', 'textarea', {
      placeholder: 'Accident history, service records, tyre condition, documents...'
    })
  ];

  const GENERIC_ITEM = [
    f('brand', 'Brand', 'text'),
    f('model', 'Model', 'text'),
    f('warranty', 'Warranty', 'select', {
      options: ['No warranty', 'Shop warranty', 'Company warranty', 'International warranty']
    }),
    f('extra_details', 'Item Details', 'textarea', {
      placeholder: 'Specifications, included accessories, defects, purchase details...'
    })
  ];

  const SCHEMAS = {
    property: {
      land: [
        f('listing_type', 'Listing Type', 'select', {
          required: true, options: ['For Sale', 'For Rent', 'Lease']
        }),
        f('land_size', 'Land Size', 'number', { required: true, placeholder: '10' }),
        f('land_unit', 'Land Unit', 'select', {
          required: true, options: ['Perches', 'Acres', 'Hectares']
        }),
        f('deed_type', 'Deed / Title', 'select', {
          required: true, options: ['Clear deed', 'Permit', 'Grant', 'Lease agreement', 'Other']
        }),
        f('road_access', 'Road Access / Road Width', 'text', { placeholder: '20 ft carpet road' }),
        f('land_shape', 'Land Shape / Terrain', 'select', {
          options: ['Flat', 'Slight slope', 'Sloping', 'Irregular', 'Other']
        }),
        f('utilities', 'Utilities & Nearby Facilities', 'textarea', {
          placeholder: 'Water, electricity, schools, town distance, boundary wall...'
        })
      ],
      houses: [
        f('listing_type', 'Listing Type', 'select', {
          required: true, options: ['For Sale', 'For Rent', 'Lease']
        }),
        f('bedrooms', 'Bedrooms', 'number', { required: true }),
        f('bathrooms', 'Bathrooms', 'number', { required: true }),
        f('floor_area_sqft', 'Floor Area (sq.ft)', 'number'),
        f('land_size', 'Land Size', 'text', { placeholder: '10 perches / 1 acre' }),
        f('floors', 'Number of Floors', 'number'),
        f('parking', 'Parking', 'select', {
          options: ['No parking', '1 vehicle', '2 vehicles', '3+ vehicles']
        }),
        f('furnished', 'Furnished', 'select', {
          options: ['Unfurnished', 'Semi furnished', 'Fully furnished']
        }),
        f('deed_type', 'Deed / Title', 'select', {
          options: ['Clear deed', 'Permit', 'Grant', 'Lease agreement', 'Other']
        }),
        f('property_features', 'Property Features', 'textarea', {
          placeholder: 'Garden, boundary wall, water, electricity, road access...'
        })
      ],
      apartments: [
        f('listing_type', 'Listing Type', 'select', {
          required: true, options: ['For Sale', 'For Rent', 'Lease']
        }),
        f('bedrooms', 'Bedrooms', 'number', { required: true }),
        f('bathrooms', 'Bathrooms', 'number', { required: true }),
        f('floor_area_sqft', 'Floor Area (sq.ft)', 'number', { required: true }),
        f('floor_number', 'Floor Number', 'number'),
        f('parking', 'Parking', 'select', {
          options: ['No parking', '1 vehicle', '2 vehicles', '3+ vehicles']
        }),
        f('furnished', 'Furnished', 'select', {
          options: ['Unfurnished', 'Semi furnished', 'Fully furnished']
        }),
        f('maintenance_fee', 'Monthly Maintenance Fee', 'text'),
        f('apartment_features', 'Apartment Features', 'textarea', {
          placeholder: 'Lift, security, pool, gym, generator, view...'
        })
      ],
      'rooms-rent': [
        f('rental_type', 'Rental Type', 'select', {
          required: true, options: ['Room', 'Annex', 'Boarding', 'Shared room', 'Hostel']
        }),
        f('occupancy', 'Preferred Occupancy', 'select', {
          options: ['Single person', 'Couple', 'Family', 'Students', 'Any']
        }),
        f('bathroom_type', 'Bathroom', 'select', {
          options: ['Attached', 'Shared']
        }),
        f('furnished', 'Furnished', 'select', {
          options: ['Unfurnished', 'Semi furnished', 'Fully furnished']
        }),
        f('monthly_rent', 'Monthly Rent Details', 'text', {
          placeholder: 'Advance, key money, utilities included...'
        }),
        f('room_features', 'Room / Annex Details', 'textarea', {
          placeholder: 'Kitchen, parking, meals, transport, rules...'
        })
      ],
      'commercial-property': [
        f('listing_type', 'Listing Type', 'select', {
          required: true, options: ['For Sale', 'For Rent', 'Lease']
        }),
        f('commercial_use', 'Suitable For', 'select', {
          required: true,
          options: ['Shop', 'Office', 'Warehouse', 'Factory', 'Restaurant', 'Hotel', 'Other']
        }),
        f('floor_area_sqft', 'Floor Area (sq.ft)', 'number'),
        f('land_size', 'Land Size', 'text'),
        f('parking', 'Parking', 'select', {
          options: ['No parking', '1-5 vehicles', '6-10 vehicles', '10+ vehicles']
        }),
        f('commercial_features', 'Commercial Property Details', 'textarea', {
          placeholder: 'Road frontage, loading access, power supply, approvals...'
        })
      ],
      'property-rent': [
        f('property_type', 'Property Type', 'select', {
          required: true,
          options: ['House', 'Apartment', 'Annex', 'Room', 'Commercial Property', 'Villa', 'Other']
        }),
        f('bedrooms', 'Bedrooms', 'number'),
        f('bathrooms', 'Bathrooms', 'number'),
        f('floor_area_sqft', 'Floor Area (sq.ft)', 'number'),
        f('furnished', 'Furnished', 'select', {
          options: ['Unfurnished', 'Semi furnished', 'Fully furnished']
        }),
        f('parking', 'Parking', 'select', {
          options: ['No parking', '1 vehicle', '2 vehicles', '3+ vehicles']
        }),
        f('minimum_lease', 'Minimum Rental Period', 'text'),
        f('advance_payment', 'Advance / Key Money', 'text'),
        f('property_features', 'Amenities, Rules & Property Details', 'textarea')
      ],
      'property-sale': [
        f('property_type', 'Property Type', 'select', {
          required: true,
          options: ['House', 'Apartment', 'Land', 'Commercial Property', 'Villa', 'Other']
        }),
        f('bedrooms', 'Bedrooms', 'number'),
        f('bathrooms', 'Bathrooms', 'number'),
        f('floor_area_sqft', 'Floor Area (sq.ft)', 'number'),
        f('land_size', 'Land Size', 'text'),
        f('parking', 'Parking', 'select', {
          options: ['No parking', '1 vehicle', '2 vehicles', '3+ vehicles']
        }),
        f('deed_type', 'Deed / Title', 'select', {
          required: true, options: ['Clear deed', 'Permit', 'Grant', 'Lease agreement', 'Other']
        }),
        f('property_features', 'Road Access, Utilities & Property Details', 'textarea')
      ],
      default: [
        f('property_type', 'Property Type', 'select', {
          required: true,
          options: ['House', 'Apartment', 'Land', 'Commercial Property', 'Room / Annex', 'Villa', 'Other']
        }),
        f('listing_type', 'Listing Type', 'select', {
          required: true, options: ['For Sale', 'For Rent', 'Lease']
        }),
        f('bedrooms', 'Bedrooms', 'number'),
        f('bathrooms', 'Bathrooms', 'number'),
        f('floor_area_sqft', 'Floor Area (sq.ft)', 'number'),
        f('land_size', 'Land Size', 'text'),
        f('deed_type', 'Deed / Title', 'select', {
          options: ['Clear deed', 'Permit', 'Grant', 'Lease agreement', 'Other']
        }),
        f('property_features', 'Property Details', 'textarea')
      ]
    },
    vehicles: {
      boats: [
        f('boat_type', 'Boat Type', 'select', {
          required: true,
          options: ['Fishing Boat', 'Speed Boat', 'Yacht', 'Sail Boat', 'Passenger Boat', 'Other']
        }),
        f('vehicle_brand', 'Brand / Make', 'text', { required: true }),
        f('vehicle_model', 'Model', 'text'),
        f('year_manufacture', 'Year of Manufacture', 'number'),
        f('boat_length', 'Length', 'text', { placeholder: '25 ft' }),
        f('engine_details', 'Engine Details', 'text'),
        f('fuel_type', 'Fuel Type', 'select', {
          options: ['Petrol', 'Diesel', 'Electric', 'Other']
        }),
        f('registration_details', 'Registration / Documents', 'textarea'),
        f('condition_notes', 'Boat Condition Notes', 'textarea')
      ],
      'heavy-equipment': [
        f('equipment_type', 'Equipment Type', 'select', {
          required: true,
          options: ['Excavator', 'Backhoe Loader', 'Wheel Loader', 'Bulldozer', 'Road Roller', 'Crane', 'Forklift', 'Motor Grader', 'Other']
        }),
        f('vehicle_brand', 'Brand / Make', 'text', { required: true }),
        f('vehicle_model', 'Model', 'text'),
        f('year_manufacture', 'Year of Manufacture', 'number'),
        f('operating_hours', 'Operating Hours', 'number'),
        f('fuel_type', 'Fuel Type', 'select', {
          options: ['Diesel', 'Petrol', 'Electric', 'Other']
        }),
        f('capacity', 'Capacity / Tonnage', 'text'),
        f('condition_notes', 'Service & Condition Notes', 'textarea')
      ],
      'vehicle-parts': [
        f('part_category', 'Part Category', 'select', {
          required: true,
          options: ['Engine Parts', 'Body Parts', 'Electrical', 'Suspension', 'Tyres & Wheels', 'Interior', 'Accessories', 'Other']
        }),
        f('compatible_make', 'Compatible Make', 'text', { required: true }),
        f('compatible_model', 'Compatible Model / Year', 'text'),
        f('part_number', 'Part Number', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('condition_notes', 'Part Condition & Details', 'textarea', {
          placeholder: 'Original/reconditioned, defects, included items...'
        })
      ],
      default: COMMON_VEHICLE
    },
    'mobile-phones': {
      phones: [
        f('phone_brand', 'Brand', 'select', {
          required: true,
          options: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Vivo', 'Nokia', 'Google', 'OnePlus', 'Realme', 'Other']
        }),
        f('phone_model', 'Model', 'text', {
          required: true, placeholder: 'iPhone 15 Pro Max, Galaxy S23...'
        }),
        f('storage', 'Storage', 'select', {
          options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB']
        }),
        f('ram', 'RAM', 'select', {
          options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB+']
        }),
        f('battery_health', 'Battery Health (%)', 'number', { min: 0, max: 100, placeholder: '88' }),
        f('network', 'Network / SIM', 'select', {
          options: ['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM + eSIM', 'Other']
        }),
        f('color', 'Colour', 'text'),
        f('warranty', 'Warranty', 'select', {
          options: ['No warranty', 'Shop warranty', 'Company warranty', 'AppleCare / official warranty']
        }),
        f('box_accessories', 'Box / Accessories & Notes', 'textarea', {
          placeholder: 'Box, charger, cable, bill, cover, repairs, defects...'
        })
      ],
      tablets: [
        f('phone_brand', 'Brand', 'select', {
          required: true,
          options: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Lenovo', 'Amazon', 'Microsoft', 'Other']
        }),
        f('phone_model', 'Model', 'text', { required: true }),
        f('screen_size', 'Screen Size', 'text', { placeholder: '10.9 inches' }),
        f('storage', 'Storage', 'select', {
          options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB']
        }),
        f('ram', 'RAM', 'select', {
          options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB+']
        }),
        f('network', 'Connectivity', 'select', {
          options: ['Wi-Fi only', 'Wi-Fi + Cellular', 'Single SIM', 'Dual SIM', 'eSIM', 'Other']
        }),
        f('battery_health', 'Battery Health (%)', 'number', { min: 0, max: 100 }),
        f('warranty', 'Warranty', 'text'),
        f('box_accessories', 'Box / Accessories & Notes', 'textarea')
      ],
      'phone-accessories': [
        f('accessory_type', 'Accessory Type', 'select', {
          required: true,
          options: ['Charger', 'Cable', 'Earphones / Headset', 'Case / Cover', 'Screen Protector', 'Power Bank', 'Smart Watch', 'Spare Part', 'Other']
        }),
        f('brand', 'Brand', 'text'),
        f('compatible_models', 'Compatible Phone Models', 'text'),
        f('connectivity', 'Connectivity / Connector', 'text', { placeholder: 'USB-C, Lightning, Bluetooth...' }),
        f('warranty', 'Warranty', 'text'),
        f('accessory_details', 'Accessory Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    electronics: {
      tvs: [
        f('electronics_brand', 'Brand', 'text', { required: true }),
        f('electronics_model', 'Model', 'text'),
        f('screen_size', 'Screen Size', 'text', { required: true, placeholder: '55 inches' }),
        f('display_type', 'Display Type', 'select', {
          options: ['LED', 'QLED', 'OLED', 'Mini LED', 'LCD', 'Plasma', 'Other']
        }),
        f('resolution', 'Resolution', 'select', {
          options: ['HD', 'Full HD', '4K UHD', '8K', 'Other']
        }),
        f('smart_tv', 'Smart TV', 'select', { options: ['Yes', 'No'] }),
        f('warranty', 'Warranty', 'text'),
        f('specifications', 'Accessories / Repairs / Other Details', 'textarea')
      ],
      'audio-video': [
        f('item_type', 'Audio / Video Item Type', 'select', {
          required: true,
          options: ['Speaker', 'Soundbar', 'Home Theatre', 'Amplifier', 'Receiver', 'Projector', 'Media Player', 'Microphone', 'Other']
        }),
        f('electronics_brand', 'Brand', 'text'),
        f('electronics_model', 'Model', 'text'),
        f('connectivity', 'Connectivity', 'text', { placeholder: 'Bluetooth, HDMI, AUX, Wi-Fi...' }),
        f('power_output', 'Power Output / Rating', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('specifications', 'Specifications & Included Items', 'textarea')
      ],
      cameras: [
        f('camera_type', 'Camera Type', 'select', {
          required: true,
          options: ['DSLR', 'Mirrorless', 'Compact', 'Action Camera', 'Video Camera', 'CCTV Camera', 'Drone Camera', 'Lens', 'Other']
        }),
        f('electronics_brand', 'Brand', 'text', { required: true }),
        f('electronics_model', 'Model', 'text'),
        f('megapixels', 'Megapixels / Sensor', 'text'),
        f('lens_details', 'Lens Included / Mount', 'text'),
        f('shutter_count', 'Shutter Count / Usage', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('specifications', 'Accessories, Repairs & Other Details', 'textarea')
      ],
      'computers-tablets': [
        f('device_type', 'Device Type', 'select', {
          required: true,
          options: ['Laptop', 'Desktop', 'All-in-One', 'Tablet', 'Server', 'Mini PC', 'Other']
        }),
        f('electronics_brand', 'Brand', 'text', { required: true }),
        f('electronics_model', 'Model', 'text'),
        f('processor', 'Processor', 'text'),
        f('ram', 'RAM', 'text'),
        f('storage', 'Storage', 'text'),
        f('graphics', 'Graphics', 'text'),
        f('screen_size', 'Screen Size', 'text'),
        f('operating_system', 'Operating System', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('specifications', 'Specifications, Battery & Accessories', 'textarea')
      ],
      'computer-accessories': [
        f('accessory_type', 'Accessory Type', 'select', {
          required: true,
          options: ['Monitor', 'Keyboard', 'Mouse', 'Printer', 'Scanner', 'UPS', 'Storage Drive', 'RAM', 'Graphics Card', 'Motherboard', 'Networking', 'Other']
        }),
        f('electronics_brand', 'Brand', 'text'),
        f('electronics_model', 'Model', 'text'),
        f('compatibility', 'Compatibility', 'text'),
        f('connectivity', 'Connectivity / Interface', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('specifications', 'Specifications & Included Items', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    'home-garden': {
      furniture: [
        f('furniture_type', 'Furniture Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('material', 'Material', 'text'),
        f('dimensions', 'Dimensions / Size', 'text'),
        f('pieces', 'Number of Pieces', 'text'),
        f('assembly', 'Assembly / Delivery', 'text'),
        f('item_details', 'Condition, Style & Other Details', 'textarea')
      ],
      'kitchen-appliances': [
        f('appliance_type', 'Appliance Type', 'text', { required: true }),
        f('brand', 'Brand', 'text', { required: true }),
        f('model', 'Model', 'text'),
        f('capacity', 'Capacity / Size', 'text'),
        f('power_details', 'Power / Voltage', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('item_details', 'Accessories, Repairs & Other Details', 'textarea')
      ],
      'home-decor': [
        f('decor_type', 'Decor Item Type', 'text', { required: true }),
        f('brand', 'Brand / Artist', 'text'),
        f('material', 'Material', 'text'),
        f('dimensions', 'Dimensions / Size', 'text'),
        f('colour_style', 'Colour / Style', 'text'),
        f('item_details', 'Item Details', 'textarea')
      ],
      'garden-tools': [
        f('tool_type', 'Garden Tool / Equipment Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('model', 'Model', 'text'),
        f('power_source', 'Power Source', 'select', {
          options: ['Manual', 'Electric', 'Battery', 'Petrol', 'Diesel', 'Other']
        }),
        f('power_capacity', 'Power / Engine / Capacity', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('item_details', 'Accessories & Service Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    'health-beauty': {
      'beauty-products': [
        f('product_type', 'Beauty Product Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('shade_variant', 'Shade / Variant', 'text'),
        f('size_volume', 'Size / Volume', 'text'),
        f('expiry_date', 'Expiry Date', 'text', { placeholder: 'MM/YYYY' }),
        f('sealed_status', 'Package Status', 'select', {
          required: true, options: ['Factory sealed', 'Opened but unused']
        }),
        f('product_details', 'Ingredients / Authenticity / Other Details', 'textarea')
      ],
      'health-personal-care': [
        f('product_type', 'Personal Care Item Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('size_volume', 'Size / Volume', 'text'),
        f('expiry_date', 'Expiry Date', 'text', { placeholder: 'MM/YYYY' }),
        f('sealed_status', 'Package Status', 'select', {
          required: true, options: ['Factory sealed', 'Opened but unused']
        }),
        f('product_details', 'Product Specifications & Other Details', 'textarea')
      ],
      'fitness-equipment': [
        f('equipment_type', 'Equipment Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('model', 'Model', 'text'),
        f('maximum_capacity', 'Maximum Capacity', 'text'),
        f('dimensions', 'Dimensions / Size', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('equipment_details', 'Accessories, Service & Condition Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    'sports-hobbies-kids': {
      'sports-equipment': [
        f('sport_type', 'Sport / Activity', 'text', { required: true }),
        f('item_type', 'Equipment Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('model', 'Model', 'text'),
        f('size', 'Size', 'text'),
        f('skill_level', 'Skill Level', 'select', {
          options: ['Beginner', 'Intermediate', 'Advanced', 'Professional', 'All levels']
        }),
        f('included_items', 'Included Items & Details', 'textarea')
      ],
      'musical-instruments': [
        f('instrument_type', 'Instrument Type', 'text', { required: true }),
        f('brand', 'Brand / Maker', 'text'),
        f('model', 'Model', 'text'),
        f('instrument_size', 'Size / Key / Range', 'text'),
        f('electric_acoustic', 'Instrument Format', 'select', {
          options: ['Acoustic', 'Electric', 'Electronic / Digital', 'Other']
        }),
        f('included_items', 'Case, Accessories, Repairs & Details', 'textarea')
      ],
      books: [
        f('book_title', 'Book Title', 'text', { required: true }),
        f('author', 'Author', 'text'),
        f('genre', 'Genre / Subject', 'text'),
        f('language', 'Language', 'text'),
        f('edition', 'Edition / Publication Year', 'text'),
        f('isbn', 'ISBN', 'text'),
        f('book_details', 'Book Condition & Other Details', 'textarea')
      ],
      toys: [
        f('toy_type', 'Toy Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('age_group', 'Recommended Age', 'text'),
        f('material', 'Material', 'text'),
        f('battery_required', 'Battery Required', 'select', { options: ['Yes', 'No'] }),
        f('included_items', 'Included Parts & Details', 'textarea')
      ],
      'baby-kids': [
        f('item_type', 'Baby / Kids Item Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('age_group', 'Age Group', 'text'),
        f('size', 'Size', 'text'),
        f('safety_standard', 'Safety / Expiry Information', 'text'),
        f('included_items', 'Included Items & Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    education: {
      'tuition-classes': [
        f('subject', 'Subject', 'text', { required: true }),
        f('grade_level', 'Grade / Level', 'text', { required: true }),
        f('medium', 'Medium', 'select', {
          options: ['Sinhala', 'English', 'Tamil', 'Other']
        }),
        f('class_type', 'Class Type', 'select', {
          options: ['Online', 'Physical', 'Home visit', 'Group class', 'Individual']
        }),
        f('teacher_qualification', 'Teacher / Tutor Qualification', 'text'),
        f('schedule', 'Schedule', 'text'),
        f('fee', 'Fee Details', 'text')
      ],
      courses: [
        f('course_name', 'Course Name', 'text', { required: true }),
        f('institution', 'Institute / Lecturer', 'text'),
        f('delivery_method', 'Delivery Method', 'select', {
          options: ['Online', 'Physical', 'Hybrid']
        }),
        f('duration', 'Course Duration', 'text'),
        f('qualification', 'Certificate / Qualification', 'text'),
        f('entry_requirements', 'Entry Requirements', 'textarea'),
        f('fee', 'Course Fee', 'text')
      ],
      'edu-books': [
        f('book_title', 'Book Title', 'text', { required: true }),
        f('author', 'Author', 'text'),
        f('subject', 'Subject / Grade', 'text'),
        f('medium', 'Medium', 'select', {
          options: ['Sinhala', 'English', 'Tamil', 'Other']
        }),
        f('edition', 'Edition / Year', 'text'),
        f('book_details', 'Book Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    'animals-pets': {
      dogs: [
        f('breed', 'Breed', 'text', { required: true }),
        f('age', 'Age', 'text', { required: true }),
        f('gender', 'Gender', 'select', { required: true, options: ['Male', 'Female', 'Pair', 'Not sure'] }),
        f('vaccinated', 'Vaccinated', 'select', { options: ['Yes', 'No', 'Partially'] }),
        f('microchipped', 'Microchipped', 'select', { options: ['Yes', 'No', 'Not sure'] }),
        f('health_status', 'Health / Veterinary Status', 'text'),
        f('parent_details', 'Parent / Pedigree Details', 'text'),
        f('pet_notes', 'Temperament, Food & Other Details', 'textarea')
      ],
      cats: [
        f('breed', 'Breed', 'text', { required: true }),
        f('age', 'Age', 'text', { required: true }),
        f('gender', 'Gender', 'select', { required: true, options: ['Male', 'Female', 'Pair', 'Not sure'] }),
        f('vaccinated', 'Vaccinated', 'select', { options: ['Yes', 'No', 'Partially'] }),
        f('litter_trained', 'Litter Trained', 'select', { options: ['Yes', 'No', 'Partially'] }),
        f('health_status', 'Health / Veterinary Status', 'text'),
        f('parent_details', 'Parent / Pedigree Details', 'text'),
        f('pet_notes', 'Temperament, Food & Other Details', 'textarea')
      ],
      birds: [
        f('breed', 'Bird Species / Breed', 'text', { required: true }),
        f('age', 'Age', 'text'),
        f('gender', 'Gender', 'select', { options: ['Male', 'Female', 'Pair', 'Not sure'] }),
        f('hand_tamed', 'Hand Tamed', 'select', { options: ['Yes', 'No', 'Partially'] }),
        f('ringed', 'Ringed / Documented', 'select', { options: ['Yes', 'No', 'Not applicable'] }),
        f('cage_included', 'Cage Included', 'select', { options: ['Yes', 'No'] }),
        f('health_status', 'Health Status', 'text'),
        f('pet_notes', 'Food, Behaviour & Other Details', 'textarea')
      ],
      fish: [
        f('species', 'Fish Species / Variety', 'text', { required: true }),
        f('quantity', 'Quantity', 'number', { required: true, min: 1 }),
        f('size', 'Approximate Size', 'text'),
        f('water_type', 'Water Type', 'select', {
          options: ['Freshwater', 'Saltwater / Marine', 'Brackish', 'Pond', 'Other']
        }),
        f('origin', 'Origin', 'select', { options: ['Locally bred', 'Imported', 'Not sure'] }),
        f('health_status', 'Health / Quarantine Status', 'text'),
        f('pet_notes', 'Food, Tank Requirements & Other Details', 'textarea')
      ],
      'pet-accessories': [
        f('accessory_type', 'Accessory Type', 'text', { required: true }),
        f('suitable_for', 'Suitable For', 'select', {
          options: ['Dogs', 'Cats', 'Birds', 'Fish', 'Other']
        }),
        f('brand', 'Brand', 'text'),
        f('size', 'Size', 'text'),
        f('accessory_details', 'Accessory Details', 'textarea')
      ],
      default: [
        f('species', 'Animal / Pet Type', 'text', { required: true }),
        f('breed', 'Breed / Variety', 'text'),
        f('age', 'Age', 'text'),
        f('gender', 'Gender', 'select', { options: ['Male', 'Female', 'Pair', 'Not sure'] }),
        f('health_status', 'Health / Veterinary Status', 'text'),
        f('pet_notes', 'Animal / Pet Details', 'textarea')
      ]
    },
    jobs: {
      vacancies: [
        f('job_title', 'Job Title / Position', 'text', { required: true }),
        f('company_name', 'Company Name', 'text', { required: true }),
        f('job_type', 'Job Type', 'select', {
          required: true, options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
        }),
        f('work_location', 'Work Arrangement', 'select', { options: ['On-site', 'Remote', 'Hybrid'] }),
        f('salary', 'Salary / Pay Range', 'text'),
        f('experience', 'Experience Required', 'text'),
        f('education', 'Education / Qualification', 'text'),
        f('deadline', 'Application Deadline', 'text'),
        f('application_details', 'Responsibilities & How to Apply', 'textarea')
      ],
      'job-wanted': [
        f('desired_position', 'Desired Position / Work Type', 'text', { required: true }),
        f('job_type', 'Preferred Job Type', 'select', {
          options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
        }),
        f('work_location', 'Preferred Work Arrangement', 'select', { options: ['On-site', 'Remote', 'Hybrid', 'Any'] }),
        f('experience', 'Experience', 'text'),
        f('education', 'Education / Qualification', 'text'),
        f('skills', 'Skills', 'textarea'),
        f('availability', 'Availability', 'text'),
        f('application_details', 'Profile / Work Preference Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    'business-industry-agriculture': {
      'office-equipment': [
        f('equipment_type', 'Equipment Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('model', 'Model', 'text'),
        f('capacity', 'Capacity / Size', 'text'),
        f('warranty', 'Warranty', 'text'),
        f('equipment_details', 'Equipment Details', 'textarea')
      ],
      'industrial-machinery': [
        f('machine_type', 'Machine Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('model', 'Model', 'text'),
        f('year_manufacture', 'Year of Manufacture', 'number'),
        f('capacity', 'Capacity / Output', 'text'),
        f('power_type', 'Power / Fuel Type', 'text'),
        f('service_history', 'Service & Condition Details', 'textarea')
      ],
      agriculture: [
        f('agriculture_type', 'Agriculture Item Type', 'select', {
          required: true,
          options: ['Seeds / Plants', 'Fertilizer / Inputs', 'Harvest / Produce', 'Farm Equipment', 'Irrigation', 'Other']
        }),
        f('variety', 'Variety / Model', 'text'),
        f('quantity', 'Quantity / Capacity', 'text'),
        f('grade', 'Grade / Quality', 'text'),
        f('harvest_manufacture_date', 'Harvest / Manufacture Date', 'text'),
        f('delivery', 'Delivery / Collection', 'text'),
        f('agriculture_details', 'Agriculture Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    services: {
      repair: [
        f('service_type', 'Repair Service Type', 'text', { required: true }),
        f('items_serviced', 'Items / Brands Serviced', 'text'),
        f('service_area', 'Service Area', 'text', { required: true }),
        f('experience_years', 'Experience', 'text'),
        f('onsite_service', 'On-site Service', 'select', { options: ['Available', 'Not available', 'Depends on location'] }),
        f('availability', 'Availability', 'text'),
        f('pricing', 'Inspection / Labour Pricing', 'text'),
        f('service_details', 'Warranty & Service Details', 'textarea')
      ],
      cleaning: [
        f('service_type', 'Cleaning Service Type', 'text', { required: true }),
        f('property_type', 'Property / Item Type', 'text'),
        f('service_area', 'Service Area', 'text', { required: true }),
        f('team_size', 'Team Size', 'text'),
        f('equipment_included', 'Equipment / Chemicals Included', 'select', { options: ['Yes', 'No', 'Depends on job'] }),
        f('availability', 'Availability', 'text'),
        f('pricing', 'Pricing Method', 'text'),
        f('service_details', 'Service Details', 'textarea')
      ],
      event: [
        f('service_type', 'Event Service Type', 'text', { required: true }),
        f('event_types', 'Events Covered', 'text'),
        f('service_area', 'Service Area', 'text', { required: true }),
        f('package_details', 'Packages / Capacity', 'text'),
        f('availability', 'Availability / Booking Notice', 'text'),
        f('pricing', 'Starting Price / Package Price', 'text'),
        f('service_details', 'Equipment, Team & Service Details', 'textarea')
      ],
      'it-services': [
        f('service_type', 'IT Service Type', 'text', { required: true }),
        f('technologies', 'Technologies / Platforms', 'text'),
        f('service_area', 'Service Area', 'text', { required: true, placeholder: 'Remote / Colombo / islandwide' }),
        f('experience_years', 'Experience', 'text'),
        f('delivery_time', 'Typical Delivery Time', 'text'),
        f('pricing', 'Pricing / Hourly Rate', 'text'),
        f('service_details', 'Scope, Support & Portfolio Details', 'textarea')
      ],
      construction: [
        f('service_type', 'Construction Service Type', 'text', { required: true }),
        f('specialization', 'Specialization', 'text'),
        f('service_area', 'Service Area', 'text', { required: true }),
        f('license_registration', 'Registration / Qualification', 'text'),
        f('experience_years', 'Experience', 'text'),
        f('pricing', 'Estimate / Pricing Method', 'text'),
        f('service_details', 'Team, Materials & Project Details', 'textarea')
      ],
      'beauty-services': [
        f('service_type', 'Beauty Service Type', 'text', { required: true }),
        f('client_type', 'Client Type', 'select', { options: ['Women', 'Men', 'Kids', 'All'] }),
        f('service_area', 'Salon / Service Area', 'text', { required: true }),
        f('home_visit', 'Home Visit', 'select', { options: ['Available', 'Not available', 'Depends on location'] }),
        f('availability', 'Availability / Appointment', 'text'),
        f('pricing', 'Starting Price / Packages', 'text'),
        f('service_details', 'Products, Qualifications & Service Details', 'textarea')
      ],
      'other-services': [
        f('service_type', 'Service Type', 'text', { required: true }),
        f('service_area', 'Service Area', 'text', { required: true, placeholder: 'Colombo, Kandy, islandwide...' }),
        f('experience_years', 'Experience', 'text'),
        f('availability', 'Availability', 'text'),
        f('pricing', 'Pricing Details', 'text'),
        f('service_details', 'Service Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    fashion: {
      clothing: [
        f('clothing_type', 'Clothing Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('size', 'Size', 'text', { required: true }),
        f('gender', 'Gender', 'select', { options: ['Men', 'Women', 'Kids', 'Unisex'] }),
        f('material', 'Material', 'text'),
        f('colour', 'Colour', 'text'),
        f('originality', 'Originality', 'select', { options: ['Original', 'Replica', 'Not sure'] }),
        f('fashion_details', 'Measurements & Item Details', 'textarea')
      ],
      shoes: [
        f('shoe_type', 'Shoe Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('size', 'Shoe Size', 'text', { required: true }),
        f('gender', 'Gender', 'select', { options: ['Men', 'Women', 'Kids', 'Unisex'] }),
        f('colour', 'Colour', 'text'),
        f('material', 'Material', 'text'),
        f('originality', 'Originality', 'select', { options: ['Original', 'Replica', 'Not sure'] }),
        f('fashion_details', 'Box, Usage & Item Details', 'textarea')
      ],
      watches: [
        f('watch_type', 'Watch Type', 'select', {
          required: true,
          options: ['Analog', 'Digital', 'Smart Watch', 'Automatic', 'Quartz', 'Mechanical', 'Other']
        }),
        f('brand', 'Brand', 'text', { required: true }),
        f('model', 'Model / Reference', 'text'),
        f('case_size', 'Case Size', 'text'),
        f('strap_material', 'Strap / Bracelet Material', 'text'),
        f('box_papers', 'Box / Papers', 'select', { options: ['Both included', 'Box only', 'Papers only', 'Not included'] }),
        f('originality', 'Originality', 'select', { options: ['Original', 'Replica', 'Not sure'] }),
        f('fashion_details', 'Service History & Item Details', 'textarea')
      ],
      bags: [
        f('bag_type', 'Bag Type', 'text', { required: true }),
        f('brand', 'Brand', 'text'),
        f('dimensions', 'Dimensions / Size', 'text'),
        f('material', 'Material', 'text'),
        f('colour', 'Colour', 'text'),
        f('originality', 'Originality', 'select', { options: ['Original', 'Replica', 'Not sure'] }),
        f('fashion_details', 'Accessories & Item Details', 'textarea')
      ],
      'jewelry-accessories': [
        f('jewelry_type', 'Jewelry / Accessory Type', 'text', { required: true }),
        f('brand', 'Brand / Maker', 'text'),
        f('material', 'Material / Metal', 'text'),
        f('weight', 'Weight', 'text'),
        f('size', 'Size / Length', 'text'),
        f('gemstone', 'Gemstone / Details', 'text'),
        f('certificate', 'Certificate / Hallmark', 'text'),
        f('fashion_details', 'Item Details', 'textarea')
      ],
      default: GENERIC_ITEM
    },
    general: {
      default: GENERIC_ITEM
    }
  };

  function slug(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const CATEGORY_ALIASES = {
    'mobile-phones-and-tablets': 'mobile-phones',
    'mobile-phones-tablets': 'mobile-phones',
    'home-and-garden': 'home-garden',
    'health-and-beauty': 'health-beauty',
    'sports-hobbies-and-kids': 'sports-hobbies-kids',
    'sports-hobbies-kids': 'sports-hobbies-kids',
    'animals-and-pets': 'animals-pets',
    'business-industry-and-agriculture': 'business-industry-agriculture',
    'business-industry-agriculture': 'business-industry-agriculture'
  };

  const SUBCATEGORY_ALIASES = {
    vehicles: {
      'vehicle-parts-and-accessories': 'vehicle-parts'
    },
    property: {
      'rooms-for-rent': 'rooms-rent',
      'property-for-rent': 'property-rent',
      'property-for-sale': 'property-sale'
    },
    electronics: {
      'audio-and-video': 'audio-video',
      'computers-and-tablets': 'computers-tablets',
      'laptops-and-computers': 'computers-tablets',
      'laptops-computers': 'computers-tablets'
    },
    'mobile-phones': {
      'mobile-phones': 'phones',
      accessories: 'phone-accessories',
      'mobile-phone-accessories': 'phone-accessories'
    },
    'home-garden': {
      'kitchen-and-appliances': 'kitchen-appliances'
    },
    'health-beauty': {
      'health-and-personal-care': 'health-personal-care'
    },
    'sports-hobbies-kids': {
      'baby-and-kids-items': 'baby-kids'
    },
    education: {
      books: 'edu-books',
      'education-books': 'edu-books'
    },
    jobs: {
      'job-vacancies': 'vacancies',
      'jobs-wanted': 'job-wanted'
    },
    services: {
      'repair-services': 'repair',
      'cleaning-services': 'cleaning',
      'event-services': 'event'
    },
    fashion: {
      'mens-clothing': 'clothing',
      'men-s-clothing': 'clothing',
      'womens-clothing': 'clothing',
      'women-s-clothing': 'clothing',
      'jewelry-and-accessories': 'jewelry-accessories'
    }
  };

  function normalizeCategoryKey(value) {
    const key = slug(value);
    return CATEGORY_ALIASES[key] || key;
  }

  function normalizeSubcategoryKey(value, category) {
    const key = slug(value);
    const categoryId = normalizeCategoryKey(category);
    return SUBCATEGORY_ALIASES[categoryId]?.[key] || key;
  }

  function selectedOptionName(select) {
    if (!select) return '';
    const option = select.selectedOptions?.[0] || select.options?.[select.selectedIndex];
    const text = String(option?.textContent || '').trim();
    if (!select.value || /^select\b/i.test(text)) return '';
    return text;
  }

  function isKnownCategory(category) {
    const categoryId = normalizeCategoryKey(category);
    return categoryId !== 'general' && Object.prototype.hasOwnProperty.call(SCHEMAS, categoryId);
  }

  function isKnownSubcategory(category, subcategory) {
    const categoryId = normalizeCategoryKey(category);
    const subcategoryId = normalizeSubcategoryKey(subcategory, categoryId);
    if (categoryId === 'vehicles' && Object.prototype.hasOwnProperty.call(VEHICLE_BODY_TYPES, subcategoryId)) {
      return true;
    }
    const categorySchema = SCHEMAS[categoryId];
    return Boolean(categorySchema && subcategoryId && Object.prototype.hasOwnProperty.call(categorySchema, subcategoryId));
  }

  function categoryKeyFromSelect(select) {
    const fromValue = normalizeCategoryKey(select?.value);
    if (isKnownCategory(fromValue)) return fromValue;
    const fromName = normalizeCategoryKey(selectedOptionName(select));
    return isKnownCategory(fromName) ? fromName : fromValue;
  }

  function subcategoryKeyFromSelect(select, category) {
    const categoryId = normalizeCategoryKey(category);
    const fromValue = normalizeSubcategoryKey(select?.value, categoryId);
    if (isKnownSubcategory(categoryId, fromValue)) return fromValue;
    const fromName = normalizeSubcategoryKey(selectedOptionName(select), categoryId);
    return isKnownSubcategory(categoryId, fromName) ? fromName : fromValue;
  }

  function cleanLabel(value) {
    return String(value || '')
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
  }

  function cloneFields(fields) {
    return (fields || []).map((field) => ({
      ...field,
      options: Array.isArray(field.options) ? [...field.options] : field.options
    }));
  }

  function vehicleFields(subcategory) {
    const sub = slug(subcategory);

    if (SCHEMAS.vehicles[sub]) {
      return cloneFields(SCHEMAS.vehicles[sub]);
    }

    const bodyConfig = VEHICLE_BODY_TYPES[sub] || VEHICLE_BODY_TYPES.cars;
    const common = cloneFields(COMMON_VEHICLE);
    const bodyField = f('body_type', bodyConfig.label, 'select', {
      options: [...bodyConfig.options]
    });

    const insertAt = common.findIndex((field) => field.key === 'ownership');
    common.splice(insertAt < 0 ? common.length : insertAt, 0, bodyField);
    return common;
  }

  function fieldsFor(category, subcategory) {
    const categoryId = normalizeCategoryKey(category);
    const subcategoryId = normalizeSubcategoryKey(subcategory, categoryId);

    if (categoryId === 'vehicles') return vehicleFields(subcategoryId);

    const categorySchema = SCHEMAS[categoryId] || SCHEMAS.general;
    const fields = categorySchema[subcategoryId] || categorySchema.default || SCHEMAS.general.default;
    return cloneFields(fields);
  }

  function conditionApplies(category, subcategory) {
    const categoryId = normalizeCategoryKey(category);
    const subcategoryId = normalizeSubcategoryKey(subcategory, categoryId);

    if (['property', 'jobs', 'services'].includes(categoryId)) return false;
    if (categoryId === 'education') return subcategoryId === 'edu-books';
    if (categoryId === 'animals-pets') return subcategoryId === 'pet-accessories';
    if (categoryId === 'health-beauty') return subcategoryId === 'fitness-equipment';
    if (categoryId === 'business-industry-agriculture') {
      return ['office-equipment', 'industrial-machinery'].includes(subcategoryId);
    }
    return true;
  }

  function priceLabelFor(category, subcategory) {
    const categoryId = normalizeCategoryKey(category);
    const subcategoryId = normalizeSubcategoryKey(subcategory, categoryId);

    if (categoryId === 'jobs') return 'Salary / Pay (LKR) *';
    if (categoryId === 'services') return 'Service Price / Starting Price (LKR) *';
    if (categoryId === 'education') {
      return subcategoryId === 'edu-books' ? 'Price (LKR) *' : 'Course / Class Fee (LKR) *';
    }
    if (categoryId === 'property') {
      if (['rooms-rent', 'property-rent'].includes(subcategoryId)) return 'Monthly Rent (LKR) *';
      return 'Price / Rent (LKR) *';
    }
    return 'Price (LKR) *';
  }

  const PUBLIC_API = {
    DISTRICT_CITIES,
    fieldsFor,
    conditionApplies,
    priceLabelFor,
    normalizeCategoryKey,
    normalizeSubcategoryKey,
    slug
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PUBLIC_API;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.EHM_POST_AD_FORM = PUBLIC_API;

  function isPostRoute() {
    const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
    return ['/post', '/post-ad'].includes(normalizedPath);
  }

  function installRouteChangeEvents() {
    if (window.__ehmRouteChangeEventsInstalled) return;
    window.__ehmRouteChangeEventsInstalled = true;

    const emit = () => window.dispatchEvent(new Event('ehemehe:routechange'));
    for (const method of ['pushState', 'replaceState']) {
      const original = history[method];
      if (typeof original !== 'function') continue;
      history[method] = function ehmHistoryRouteChange(...args) {
        const result = original.apply(this, args);
        emit();
        return result;
      };
    }
    window.addEventListener('popstate', emit);
  }

  const state = {
    category: '',
    subcategory: '',
    fieldsByKey: {},
    location: { district: '', city: '' },
    ticking: false,
    restoringDistrict: false
  };

  function stateKey() {
    const categoryId = normalizeCategoryKey(state.category);
    const subcategoryId = normalizeSubcategoryKey(state.subcategory, categoryId);
    return `${categoryId || 'general'}:${subcategoryId || 'all'}`;
  }

  function availableFormStorages() {
    const targets = [];
    try { if (window.sessionStorage) targets.push(window.sessionStorage); } catch (_) {}
    try { if (window.localStorage) targets.push(window.localStorage); } catch (_) {}
    return targets;
  }

  function readSelectionSnapshot() {
    for (const storageTarget of availableFormStorages()) {
      try {
        const snapshot = JSON.parse(storageTarget.getItem(SELECTION_KEY) || 'null');
        if (snapshot && typeof snapshot === 'object') {
          const category = normalizeCategoryKey(snapshot.category);
          const subcategory = normalizeSubcategoryKey(snapshot.subcategory, category);
          if (category || subcategory) return { category, subcategory };
        }
      } catch (_) {}
    }
    return { category: '', subcategory: '' };
  }

  function saveSelectionSnapshot() {
    const payload = JSON.stringify({
      category: state.category,
      subcategory: state.subcategory,
      savedAt: Date.now()
    });
    for (const storageTarget of availableFormStorages()) {
      try { storageTarget.setItem(SELECTION_KEY, payload); }
      catch (_) {}
    }
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored && typeof stored === 'object') {
        state.category = normalizeCategoryKey(stored.category);
        state.subcategory = normalizeSubcategoryKey(stored.subcategory, state.category);
        state.fieldsByKey = stored.fieldsByKey && typeof stored.fieldsByKey === 'object'
          ? stored.fieldsByKey
          : {};
        state.location = stored.location && typeof stored.location === 'object'
          ? {
              district: String(stored.location.district || ''),
              city: String(stored.location.city || '')
            }
          : { district: '', city: '' };
      }

      const selection = readSelectionSnapshot();
      if (!state.category && selection.category) state.category = selection.category;
      if (!state.subcategory && selection.subcategory) state.subcategory = selection.subcategory;

      if (!Object.keys(state.fieldsByKey).length) {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_FIELDS_KEY) || 'null');
        if (legacy?.fields && typeof legacy.fields === 'object') {
          const legacyCategory = normalizeCategoryKey(legacy.category);
          const legacySubcategory = normalizeSubcategoryKey(legacy.subcategory, legacyCategory);
          const legacyKey = `${legacyCategory || 'general'}:${legacySubcategory || 'all'}`;
          state.fieldsByKey[legacyKey] = { ...legacy.fields };
        }
      }
    } catch (_) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        category: state.category,
        subcategory: state.subcategory,
        fieldsByKey: state.fieldsByKey,
        location: state.location,
        savedAt: Date.now()
      }));
    } catch (_) {}
    saveSelectionSnapshot();
  }

  function heading(text) {
    const wanted = cleanLabel(text);
    return Array.from(document.querySelectorAll('h1,h2,h3'))
      .find((node) => cleanLabel(node.textContent) === wanted) || null;
  }

  function labeledControl(container, labelText, selector = 'select,input,textarea') {
    if (!container) return null;
    const wanted = cleanLabel(labelText);

    for (const label of container.querySelectorAll('label')) {
      if (cleanLabel(label.textContent) !== wanted) continue;
      const direct = label.parentElement?.querySelector(selector);
      if (direct) return direct;
      if (label.htmlFor) {
        const associated = document.getElementById(label.htmlFor);
        if (associated?.matches(selector)) return associated;
      }
    }
    return null;
  }

  function labeledField(container, labelText) {
    const control = labeledControl(container, labelText);
    return control?.closest('div') || null;
  }

  function categoryStepContainer() {
    return document.querySelector('[data-ehm-post-step="category"]') ||
      heading('Select Category')?.parentElement ||
      null;
  }

  function categoryControls() {
    const container = categoryStepContainer();
    if (!container) return { categorySelect: null, subcategorySelect: null };
    return {
      categorySelect: container.querySelector('[data-ehm-category-select]') ||
        labeledControl(container, 'Category', 'select'),
      subcategorySelect: container.querySelector('[data-ehm-subcategory-select]') ||
        labeledControl(container, 'Subcategory', 'select')
    };
  }

  function rememberCategorySelection() {
    const { categorySelect, subcategorySelect } = categoryControls();
    if (!categorySelect) return false;

    const category = categoryKeyFromSelect(categorySelect);
    const subcategory = subcategoryKeyFromSelect(subcategorySelect, category);
    if (!category && !subcategory) return false;

    const changed = category !== state.category || subcategory !== state.subcategory;
    if (changed) {
      state.category = category;
      state.subcategory = subcategory;
      saveState();
    }
    return changed;
  }

  function captureChangedCategoryControl(select) {
    if (!select || select.tagName !== 'SELECT') return false;

    const label = select.closest('div')?.querySelector(':scope > label');
    const labelName = cleanLabel(label?.textContent);
    const isCategory = select.matches('[data-ehm-category-select]') || labelName === 'category';
    const isSubcategory = select.matches('[data-ehm-subcategory-select]') || labelName === 'subcategory';
    if (!isCategory && !isSubcategory) return false;

    if (isCategory) {
      const category = categoryKeyFromSelect(select);
      if (category !== state.category) {
        state.category = category;
        // React resets the subcategory when the main category changes. Reset it
        // here in the capture phase as well, before the old select is unmounted.
        state.subcategory = '';
      }
    } else {
      state.subcategory = subcategoryKeyFromSelect(select, state.category);
    }

    saveState();
    return true;
  }

  function scheduleStepTransitionTicks() {
    [0, 40, 120, 300].forEach((delay) => {
      window.setTimeout(scheduleTick, delay);
    });
  }

  function readCurrentFields() {
    const key = stateKey();
    const values = { ...(state.fieldsByKey[key] || {}) };

    document.querySelectorAll('#ehm-category-fields-panel [data-ehm-field]').forEach((control) => {
      values[control.dataset.ehmField] = control.value;
    });

    state.fieldsByKey[key] = values;
    saveState();
    return values;
  }

  function inputHtml(field, value) {
    const attributes = [
      `data-ehm-field="${escapeHtml(field.key)}"`,
      'class="ehm-extra-input input-field"',
      field.required ? 'required' : '',
      field.min !== undefined ? `min="${escapeHtml(field.min)}"` : '',
      field.max !== undefined ? `max="${escapeHtml(field.max)}"` : ''
    ].filter(Boolean).join(' ');

    if (field.type === 'select') {
      const options = (field.options || [])
        .map((option) => `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(option)}</option>`)
        .join('');
      return `<select ${attributes}><option value="">Select ${escapeHtml(field.label)}</option>${options}</select>`;
    }

    if (field.type === 'textarea') {
      return `<textarea ${attributes} rows="3" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value || '')}</textarea>`;
    }

    return `<input ${attributes} type="${escapeHtml(field.type || 'text')}" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(field.placeholder || '')}">`;
  }

  function updatePriceLabel(container) {
    if (!container) return;

    let label = container.querySelector('[data-ehm-price-label]');
    if (!label) {
      label = Array.from(container.querySelectorAll('label')).find((candidate) => {
        const text = cleanLabel(candidate.textContent);
        return text === 'price (lkr)' ||
          text.startsWith('price / rent (lkr)') ||
          text.startsWith('monthly rent (lkr)') ||
          text.startsWith('salary / pay (lkr)') ||
          text.startsWith('service price / starting price (lkr)') ||
          text.startsWith('course / class fee (lkr)');
      });
      if (label) label.dataset.ehmPriceLabel = '1';
    }

    if (label) label.textContent = priceLabelFor(state.category, state.subcategory);
  }

  function applyConditionVisibility(container) {
    if (!container) return;

    const conditionField = labeledField(container, 'Condition');
    if (!conditionField) return;

    const showCondition = conditionApplies(state.category, state.subcategory);
    const baseGrid = conditionField.parentElement;
    const priceField = labeledField(container, 'Price (LKR)') ||
      labeledField(container, 'Price / Rent (LKR)') ||
      labeledField(container, 'Monthly Rent (LKR)') ||
      labeledField(container, 'Salary / Pay (LKR)') ||
      labeledField(container, 'Service Price / Starting Price (LKR)') ||
      labeledField(container, 'Course / Class Fee (LKR)');

    conditionField.hidden = !showCondition;
    conditionField.setAttribute('aria-hidden', String(!showCondition));

    const conditionSelect = conditionField.querySelector('select');
    if (conditionSelect) {
      conditionSelect.required = showCondition;
      conditionSelect.tabIndex = showCondition ? 0 : -1;
    }

    baseGrid?.classList.toggle('ehm-condition-not-applicable', !showCondition);
    priceField?.classList.toggle('ehm-price-full-width', !showCondition);
  }

  function injectDetailsFields() {
    const detailsHost = document.querySelector('[data-ehm-post-step="details"]') ||
      heading('Ad Details')?.parentElement ||
      null;
    if (!detailsHost) return;

    // The category step may have unmounted before a deferred change handler ran.
    // Reload the synchronously saved selection before deciding there is no schema.
    if (!state.category || !state.subcategory) {
      const selection = readSelectionSnapshot();
      if (!state.category) state.category = selection.category;
      if (!state.subcategory) state.subcategory = selection.subcategory;
    }
    if (!state.category || !state.subcategory) return;

    updatePriceLabel(detailsHost);
    applyConditionVisibility(detailsHost);

    const key = stateKey();
    const fields = fieldsFor(state.category, state.subcategory);
    const savedValues = state.fieldsByKey[key] || {};
    const mount = detailsHost.querySelector('#ehm-category-fields-host') || detailsHost;

    let panel = mount.querySelector('#ehm-category-fields-panel') ||
      detailsHost.querySelector('#ehm-category-fields-panel');
    const expectedFieldCount = String(fields.length);
    if (
      panel?.dataset.key === key &&
      panel.dataset.fieldCount === expectedFieldCount &&
      panel.querySelectorAll('[data-ehm-field]').length === fields.length
    ) {
      return;
    }

    if (panel) {
      readCurrentFields();
      panel.remove();
    }

    panel = document.createElement('section');
    panel.id = 'ehm-category-fields-panel';
    panel.dataset.key = key;
    panel.dataset.fieldCount = expectedFieldCount;
    panel.className = 'ehm-extra-fields';
    panel.innerHTML = `
      <div class="ehm-extra-fields-heading">
        <div>
          <h3>Category Details</h3>
          <p>Fill the details buyers usually check before contacting you.</p>
        </div>
        <span>${escapeHtml(state.subcategory.replace(/-/g, ' '))}</span>
      </div>
      <div class="ehm-extra-fields-grid">
        ${fields.map((field) => `
          <div class="ehm-extra-field ${field.type === 'textarea' ? 'ehm-extra-field-wide' : ''}">
            <label>${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>
            ${inputHtml(field, savedValues[field.key] || '')}
          </div>
        `).join('')}
      </div>
      <div id="ehm-category-fields-error" class="ehm-inline-error" aria-live="polite"></div>
    `;

    if (mount.id === 'ehm-category-fields-host') {
      mount.replaceChildren(panel);
    } else {
      const detailsHeading = heading('Ad Details');
      const baseFields = detailsHeading?.nextElementSibling;
      if (baseFields?.parentElement === detailsHost) {
        baseFields.insertAdjacentElement('afterend', panel);
      } else {
        detailsHost.appendChild(panel);
      }
    }

    panel.addEventListener('input', readCurrentFields);
    panel.addEventListener('change', readCurrentFields);
    window.dispatchEvent(new CustomEvent('ehemehe:category-fields-ready', {
      detail: { category: state.category, subcategory: state.subcategory, count: fields.length }
    }));
  }

  function cityOptions(district) {
    const cities = DISTRICT_CITIES[district] || [];
    return [...cities, 'Other / Not listed'];
  }

  function populateCitySelect(select, district, preferredCity = '') {
    if (!select) return;

    const cities = district ? cityOptions(district) : [];
    select.disabled = !district;
    select.innerHTML = [
      `<option value="">${district ? 'Select city / town' : 'Select district first'}</option>`,
      ...cities.map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`)
    ].join('');

    if (preferredCity && cities.includes(preferredCity)) {
      select.value = preferredCity;
    }
  }

  function setReactSelectValue(select, value) {
    if (!select || select.value === value) return;
    const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    descriptor?.set?.call(select, value);
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function injectCityField() {
    if (document.querySelector('[data-ehm-native-city]')) return;
    const contactHeading = heading('Contact & Location');
    if (!contactHeading) return;

    const container = contactHeading.parentElement;
    const districtSelect = labeledControl(container, 'District');
    if (!districtSelect) return;

    districtSelect.dataset.ehmDistrictSelect = '1';
    const districtField = districtSelect.closest('div');
    if (!districtField) return;

    if (!districtSelect.dataset.ehmLocationBound) {
      districtSelect.dataset.ehmLocationBound = '1';
      districtSelect.addEventListener('change', () => {
        if (state.restoringDistrict) return;

        const district = districtSelect.value;
        if (district !== state.location.district) {
          state.location = { district, city: '' };
        }

        const citySelect = document.getElementById('ehm-city-select');
        populateCitySelect(citySelect, district, state.location.city);
        saveState();
        clearLocationError();
      });
    }

    if (!districtSelect.value && state.location.district && !state.restoringDistrict) {
      const hasOption = Array.from(districtSelect.options).some((option) => option.value === state.location.district);
      if (hasOption) {
        state.restoringDistrict = true;
        setReactSelectValue(districtSelect, state.location.district);
        setTimeout(() => { state.restoringDistrict = false; }, 0);
      }
    }

    const liveDistrict = districtSelect.value || state.location.district;
    if (liveDistrict && liveDistrict !== state.location.district) {
      state.location = { district: liveDistrict, city: '' };
      saveState();
    }

    let cityField = container.querySelector('#ehm-city-field');
    if (!cityField) {
      cityField = document.createElement('div');
      cityField.id = 'ehm-city-field';
      cityField.className = 'ehm-location-city-field';
      cityField.innerHTML = `
        <label class="block text-sm font-medium text-surface-700 mb-2">City / Town *</label>
        <select id="ehm-city-select" class="input-field" required></select>
        <div id="ehm-location-error" class="ehm-inline-error" aria-live="polite"></div>
      `;
      districtField.insertAdjacentElement('afterend', cityField);

      const citySelect = cityField.querySelector('select');
      citySelect.addEventListener('change', () => {
        state.location.district = districtSelect.value || state.location.district;
        state.location.city = citySelect.value;
        saveState();
        clearLocationError();
      });
    }

    const citySelect = cityField.querySelector('select');
    const currentOptionsDistrict = citySelect.dataset.district || '';
    if (currentOptionsDistrict !== liveDistrict) {
      citySelect.dataset.district = liveDistrict;
      populateCitySelect(
        citySelect,
        liveDistrict,
        liveDistrict === state.location.district ? state.location.city : ''
      );
    } else if (state.location.city && citySelect.value !== state.location.city) {
      const hasCity = Array.from(citySelect.options).some((option) => option.value === state.location.city);
      if (hasCity) citySelect.value = state.location.city;
    }
  }

  function clearLocationError() {
    const error = document.getElementById('ehm-location-error');
    if (error) error.textContent = '';
  }

  function showLocationError(message) {
    const error = document.getElementById('ehm-location-error');
    if (error) error.textContent = message;
  }

  function validateLocation() {
    const contactHeading = heading('Contact & Location');
    const reviewHeading = heading('Review Your Ad');
    if (!contactHeading && !reviewHeading) return true;

    const districtSelect = document.querySelector('[data-ehm-native-district]') ||
      document.querySelector('[data-ehm-district-select]');
    const citySelect = document.querySelector('[data-ehm-native-city] select') ||
      document.getElementById('ehm-city-select');
    const district = districtSelect?.value || state.location.district;
    const city = citySelect?.value || state.location.city;

    if (!district) {
      showLocationError('Select a district.');
      districtSelect?.focus();
      return false;
    }
    if (!city) {
      showLocationError('Select a city or town.');
      citySelect?.focus();
      return false;
    }

    state.location = { district, city };
    saveState();
    clearLocationError();
    return true;
  }

  function validateCategoryFields() {
    const panel = document.getElementById('ehm-category-fields-panel');
    if (!panel) return true;

    readCurrentFields();
    const requiredControls = Array.from(panel.querySelectorAll('[required]'));
    const invalid = requiredControls.find((control) => !String(control.value || '').trim());
    const error = panel.querySelector('#ehm-category-fields-error');

    panel.querySelectorAll('.ehm-invalid').forEach((control) => control.classList.remove('ehm-invalid'));
    if (error) error.textContent = '';

    if (!invalid) return true;

    invalid.classList.add('ehm-invalid');
    if (error) error.textContent = 'Complete all required category details before continuing.';
    invalid.focus();
    return false;
  }

  function reviewCard(container, titleText) {
    const wanted = cleanLabel(titleText);
    const title = Array.from(container.querySelectorAll('div'))
      .find((node) => cleanLabel(node.textContent) === wanted &&
        /uppercase|tracking-wider|text-surface-400/.test(node.className || ''));

    return title?.parentElement || null;
  }

  function injectReviewSummary() {
    const reviewHeading = heading('Review Your Ad');
    if (!reviewHeading) return;

    const container = reviewHeading.parentElement;
    if (!container) return;

    readCurrentFields();

    const applies = conditionApplies(state.category, state.subcategory);
    const conditionCard = reviewCard(container, 'Condition');
    if (conditionCard) {
      conditionCard.hidden = !applies;
      conditionCard.parentElement?.classList.toggle('ehm-review-condition-hidden', !applies);
    }

    const locationCard = reviewCard(container, 'Location');
    if (locationCard && state.location.district && state.location.city) {
      const valueNode = Array.from(locationCard.children)
        .find((child) => cleanLabel(child.textContent) !== 'location');
      if (valueNode) valueNode.textContent = `${state.location.city}, ${state.location.district}`;
    }

    const key = stateKey();
    const values = state.fieldsByKey[key] || {};
    const fields = fieldsFor(state.category, state.subcategory);
    const rows = fields
      .map((field) => ({ label: field.label, value: values[field.key] }))
      .filter((row) => String(row.value || '').trim());

    let panel = container.querySelector('#ehm-review-fields-panel');
    const signature = JSON.stringify(rows);
    if (panel?.dataset.signature === signature) return;
    panel?.remove();

    if (!rows.length) return;

    panel = document.createElement('section');
    panel.id = 'ehm-review-fields-panel';
    panel.dataset.signature = signature;
    panel.className = 'ehm-review-fields';
    panel.innerHTML = `
      <div class="ehm-review-fields-title">Category Details</div>
      <div class="ehm-review-fields-grid">
        ${rows.map((row) => `
          <div>
            <span>${escapeHtml(row.label)}</span>
            <strong>${escapeHtml(row.value)}</strong>
          </div>
        `).join('')}
      </div>
    `;

    const list = container.querySelector('.space-y-4') || container;
    list.appendChild(panel);
  }

  function handleNavigationValidation(event) {
    if (!isPostRoute()) return;
    const button = event.target?.closest?.('button');
    if (!button) return;

    const buttonText = cleanLabel(button.textContent);
    if (!['continue', 'post ad', 'back'].includes(buttonText)) return;

    // Capture Category/Subcategory synchronously, before React unmounts step 1.
    if (heading('Select Category')) rememberCategorySelection();

    if (buttonText === 'continue' && heading('Ad Details') && !validateCategoryFields()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    if (
      ['continue', 'post ad'].includes(buttonText) &&
      (heading('Contact & Location') || heading('Review Your Ad')) &&
      !validateLocation()
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    scheduleStepTransitionTicks();
  }

  function handleSelectChange(event) {
    if (!isPostRoute()) return;
    const select = event.target;
    if (!select || select.tagName !== 'SELECT') return;

    if (captureChangedCategoryControl(select)) {
      // Read again after React has applied its controlled-select update, but the
      // important values have already been saved synchronously above.
      window.setTimeout(() => {
        rememberCategorySelection();
        scheduleTick();
      }, 0);
    }
  }

  function tick() {
    state.ticking = false;
    if (!isPostRoute()) return;

    rememberCategorySelection();
    if (!state.category || !state.subcategory) {
      const selection = readSelectionSnapshot();
      if (!state.category) state.category = selection.category;
      if (!state.subcategory) state.subcategory = selection.subcategory;
    }

    if (heading('Ad Details')) {
      injectDetailsFields();
      const container = heading('Ad Details')?.parentElement;
      updatePriceLabel(container);
      applyConditionVisibility(container);
    }

    if (heading('Contact & Location')) injectCityField();
    if (heading('Review Your Ad')) injectReviewSummary();
  }

  function scheduleTick() {
    if (state.ticking) return;
    state.ticking = true;
    requestAnimationFrame(tick);
  }

  loadState();
  installRouteChangeEvents();

  document.addEventListener('click', handleNavigationValidation, true);
  document.addEventListener('change', handleSelectChange, true);

  const observer = new MutationObserver(scheduleTick);
  let observingPostRoute = false;

  function updateRouteLifecycle() {
    if (isPostRoute()) {
      if (!observingPostRoute) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
        observingPostRoute = true;
      }
      scheduleTick();
      return;
    }

    if (observingPostRoute) {
      observer.disconnect();
      observingPostRoute = false;
    }
  }

  document.addEventListener('DOMContentLoaded', updateRouteLifecycle);
  window.addEventListener('ehemehe:routechange', updateRouteLifecycle);
  updateRouteLifecycle();
})();
