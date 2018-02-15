'use strict';
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;

const schema = mongoose.Schema({
  name: String,
  dayOfWeek: Number,
  time: String,
  nextDate: Date,
  nextLocation: {
    type: ObjectId,
    ref: 'Location'
  },
  locations: [{
    type: ObjectId,
    ref: 'Location'
  }],
});

module.exports = mongoose.model('Group', schema);
