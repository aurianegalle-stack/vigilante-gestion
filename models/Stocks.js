const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Boissons' },
  quantity: { type: Number, required: true, default: 0 },
  minAlert: { type: Number, default: 10 },
  unitPrice: { type: Number, default: 1.50 }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);