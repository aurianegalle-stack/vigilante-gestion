const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Middlewares essentiels
app.use(cors()); // Désactive les blocages CORS
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. Connexion MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'TA_CONNEXION_MONGODB_ATLAS_ICI';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB Atlas'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

// 3. Schéma et Modèle Gymnaste
const gymnastSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  group: { type: String, default: 'Général' },
  category: { type: String, default: 'Général' }
}, { timestamps: true });

const Gymnast = mongoose.models.Gymnast || mongoose.model('Gymnast', gymnastSchema);

// 4. Routes API Gymnastes
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
    const { firstName, lastName, group, category } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "Prénom et Nom sont obligatoires." });
    }
    const newGymnast = new Gymnast({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      group: group ? group.trim() : 'Général',
      category: category ? category.trim() : 'Général'
    });
    await newGymnast.save();
    res.status(201).json(newGymnast);
  } catch (err) {
    res.status(500).json({ message: "Erreur sauvegarde gymnaste", error: err.message });
  }
});

// 5. Fallback pour afficher index.html sur toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. Démarrage Serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});