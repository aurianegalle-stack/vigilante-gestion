const mongoose = require('mongoose');

const leotardSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  size: { type: String, required: true },
  status: { type: String, enum: ['Disponible', 'Loué', 'En réparation'], default: 'Disponible' },
  assignedTo: { type: String, default: '' },
  depositReceived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Leotard', leotardSchema);