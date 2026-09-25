const mongoose = require('mongoose');

const gymnastSchema = new mongoose.Schema({
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  category: { type: String },
  group: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Gymnast', gymnastSchema);