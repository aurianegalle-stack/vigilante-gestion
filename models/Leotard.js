const mongoose = require('mongoose');

const leotardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '' },
  size: { type: String, required: true, default: '8A' },
  status: { type: String, enum: ['Disponible', 'Loué', 'En réparation'], default: 'Disponible' },
  gymnast: { type: String, default: '-' },
  cautionAmount: { type: Number, default: 45 }
}, { timestamps: true });

module.exports = mongoose.model('Leotard', leotardSchema);