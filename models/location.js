'use strict';
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;

const schema = mongoose.Schema({
  name: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  active: Boolean,
  group: ObjectId,
});

module.exports = mongoose.model('Location', schema);
