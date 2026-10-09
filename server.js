const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Middlewares & Désactivation du cache HTTP
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Service des fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI || (!MONGO_URI.startsWith('mongodb://') && !MONGO_URI.startsWith('mongodb+srv://'))) {
  console.error('❌ ERREUR : MONGO_URI manquant ou mal configuré.');
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connecté avec succès à MongoDB Atlas'))
    .catch(err => console.error('❌ Erreur de connexion MongoDB :', err.message));
}

// --- SCHÉMAS MONGOOSE ---

// Gymnastes
const gymnastSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  group: { type: String, default: 'Général' },
  category: { type: String, default: 'Général' },
  birthDate: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' }
}, { timestamps: true });

const Gymnast = mongoose.models.Gymnast || mongoose.model('Gymnast', gymnastSchema);

// Justaucorps
const leotardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String },
  category: { type: String, default: 'Général' },
  size: { type: String, default: '8A' },
  status: { type: String, default: 'Disponible' },
  assignedTo: { type: String, default: '' },
  gymnast: { type: String, default: '-' },
  cautionAmount: { type: Number, default: 45 }
}, { timestamps: true });

const Leotard = mongoose.models.Leotard || mongoose.model('Leotard', leotardSchema);

// Locations
const rentalSchema = new mongoose.Schema({
  leotard: { type: mongoose.Schema.Types.ObjectId, ref: 'Leotard', required: true },
  gymnast: { type: mongoose.Schema.Types.ObjectId, ref: 'Gymnast', required: true },
  depositAmount: { type: Number, default: 45 },
  status: { type: String, default: 'En cours' }
}, { timestamps: true });

const Rental = mongoose.models.Rental || mongoose.model('Rental', rentalSchema);

// Stock Buvette
const stockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 }
}, { timestamps: true });

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

// Compétitions avec résultats & récompenses
const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, default: '' },
  location: { type: String, default: 'Lieu non spécifié' },
  results: [{
    gymnast: { type: mongoose.Schema.Types.ObjectId, ref: 'Gymnast', required: true },
    rank: { type: String, default: '' },
    reward: { type: String, enum: ['Médaille d\'or', 'Médaille d\'argent', 'Médaille de bronze', 'Coupe 1ère place', 'Coupe 2ème place', 'Coupe 3ème place', 'Participation', 'Autre'], default: 'Participation' },
    notes: { type: String, default: '' }
  }]
}, { timestamps: true });

const Competition = mongoose.models.Competition || mongoose.model('Competition', competitionSchema);


// --- ROUTES API ---

// Gymnastes
app.get('/api/gymnasts', async (req, res) => {
  try {
    const list = await Gymnast.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Erreur lecture gymnastes", error: err.message });
  }
});

app.post('/api/gymnasts', async (req, res) => {
  try {
    const { firstName, lastName, group, category, birthDate, phone, email } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "Prénom et Nom sont obligatoires." });
    }
    const newGymnast = new Gymnast({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      group: group ? group.trim() : 'Général',
      category: category ? category.trim() : 'Général',
      birthDate: birthDate ? birthDate.trim() : '',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : ''
    });
    await newGymnast.save();
    res.status(201).json(newGymnast);
  } catch (err) {
    res.status(400).json({ message: "Erreur sauvegarde gymnaste", error: err.message });
  }
});

app.put('/api/gymnasts/:id', async (req, res) => {
  try {
    const { firstName, lastName, category, group } = req.body;
    const updated = await Gymnast.findByIdAndUpdate(
      req.params.id,
      { 
        firstName: firstName ? firstName.trim() : undefined,
        lastName: lastName ? lastName.trim() : undefined,
        category: category ? category.trim() : 'Général',
        group: group ? group.trim() : (category ? category.trim() : 'Général')
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Gymnaste introuvable." });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Erreur lors de la modification", error: err.message });
  }
});

app.delete('/api/gymnasts/:id', async (req, res) => {
  try {
    const deleted = await Gymnast.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Gymnaste introuvable." });
    res.json({ message: "Gymnaste supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
});

// Justaucorps
app.get('/api/leotards', async (req, res) => {
  try {
    const list = await Leotard.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Erreur lecture justaucorps", error: err.message });
  }
});

app.post('/api/leotards', async (req, res) => {
  try {
    const { name, size, status, gymnast, code, category } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Le nom est obligatoire." });

    const uniqueCode = code && code.trim() ? code.trim() : `JST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newLeotard = new Leotard({
      name: name.trim(),
      code: uniqueCode,
      category: category || 'Général',
      size: size ? size.trim() : '8A',
      status: status || 'Disponible',
      assignedTo: gymnast || '',
      gymnast: gymnast || '-'
    });

    const saved = await newLeotard.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Erreur enregistrement : " + err.message });
  }
});

app.delete('/api/leotards/:id', async (req, res) => {
  try {
    const deleted = await Leotard.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Justaucorps introuvable." });
    res.json({ message: "Justaucorps supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression justaucorps", error: err.message });
  }
});

// Locations
app.get('/api/rentals', async (req, res) => {
  try {
    const list = await Rental.find().populate('leotard').populate('gymnast').sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Erreur lecture locations", error: err.message });
  }
});

app.post('/api/rentals', async (req, res) => {
  try {
    const { leotardId, gymnastId, depositAmount } = req.body;
    if (!leotardId || !gymnastId) return res.status(400).json({ message: "Justaucorps et gymnaste requis." });

    const gymnastObj = await Gymnast.findById(gymnastId);
    if (!gymnastObj) return res.status(404).json({ message: "Gymnaste introuvable." });

    const newRental = new Rental({
      leotard: leotardId,
      gymnast: gymnastId,
      depositAmount: Number(depositAmount) || 45
    });
    await newRental.save();

    const gymnastFullName = `${gymnastObj.firstName} ${gymnastObj.lastName}`;
    await Leotard.findByIdAndUpdate(leotardId, {
      status: 'Loué',
      assignedTo: gymnastId,
      gymnast: gymnastFullName,
      cautionAmount: Number(depositAmount) || 45
    });

    res.status(201).json(newRental);
  } catch (err) {
    res.status(400).json({ message: "Erreur validation location : " + err.message });
  }
});

// Stocks
app.get('/api/stocks', async (req, res) => {
  try {
    const list = await Stock.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Erreur lecture stock", error: err.message });
  }
});

app.post('/api/stocks', async (req, res) => {
  try {
    const { name, quantity, unitPrice } = req.body;
    if (!name) return res.status(400).json({ message: "Le nom est obligatoire." });
    const newStock = new Stock({ name, quantity, unitPrice });
    await newStock.save();
    res.status(201).json(newStock);
  } catch (err) {
    res.status(400).json({ message: "Erreur sauvegarde stock", error: err.message });
  }
});

// Compétitions & Résultats
app.get('/api/competitions', async (req, res) => {
  try {
    const list = await Competition.find().populate('results.gymnast').sort({ startDate: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Erreur lecture compétitions", error: err.message });
  }
});

app.post('/api/competitions', async (req, res) => {
  try {
    const { name, startDate, endDate, date, location } = req.body;
    const sDate = startDate || date;

    if (!name || !sDate) return res.status(400).json({ message: "Le nom et la date de début sont obligatoires." });

    const newCompetition = new Competition({
      name: name.trim(),
      startDate: sDate.trim(),
      endDate: endDate ? endDate.trim() : '',
      location: location ? location.trim() : 'Lieu non spécifié',
      results: []
    });
    await newCompetition.save();
    res.status(201).json(newCompetition);
  } catch (err) {
    res.status(400).json({ message: "Erreur sauvegarde compétition", error: err.message });
  }
});

// Ajouter / Modifier les résultats d'une compétition
app.put('/api/competitions/:id/results', async (req, res) => {
  try {
    const { results } = req.body; // Tableau d'objets { gymnast, rank, reward, notes }
    const updatedComp = await Competition.findByIdAndUpdate(
      req.params.id,
      { results },
      { new: true, runValidators: true }
    ).populate('results.gymnast');

    if (!updatedComp) return res.status(404).json({ message: "Compétition introuvable." });
    res.json(updatedComp);
  } catch (err) {
    res.status(400).json({ message: "Erreur mise à jour résultats", error: err.message });
  }
});

app.delete('/api/competitions/:id', async (req, res) => {
  try {
    const deleted = await Competition.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Compétition introuvable." });
    res.json({ message: "Compétition supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression compétition", error: err.message });
  }
});

// Fallback HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur le port ${PORT}`);
});