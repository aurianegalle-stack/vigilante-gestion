const mongoose = require('mongoose');

const gymnastSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  group: { type: String, default: 'Général' },
  category: { type: String, default: 'Général' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Gymnast', gymnastSchema);