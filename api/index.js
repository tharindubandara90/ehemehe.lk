'use strict';

const { dispatchApi } = require('../lib/api-dispatcher');

module.exports = async function handler(req, res) {
  return dispatchApi(req, res);
};
