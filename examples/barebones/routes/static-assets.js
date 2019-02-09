const express = require('express');
const npath = require('path');

module.exports = function(router) {
  router.use('/css', express.static(npath.resolve(__dirname, '../css'), {
    etag: false
  }));
};
