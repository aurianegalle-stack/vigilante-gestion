const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Importation des modèles Mongoose
const User = require('./models/User');
const Leotard = require('./models/Leotard');
const Stock = require('./models/Stock');
const Gymnast = require('./models/Gymnast'); // 👈 Ajout du modèle Gymnaste

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du dossier /public
app.use(express.static(path.join(__dirname, 'public')));

// Configuration des variables d'environnement
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gym_secret_token_key_2026';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://aurianegalle_db_user:0603734703Seb11@cluster0.pae88yh.mongodb.net/gymgestion?retryWrites=true&w=majority";

// Connexion à MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB Atlas avec succès'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// --- ROUTES D'AUTHENTIFICATION ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Nom d\'utilisateur ou e-mail déjà utilisé.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'Coach / Entraîneur'
    });
    await newUser.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès !' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Identifiants invalides.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Identifiants invalides.' });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
});

// --- ROUTES GYMNASTES ---

app.get('/api/gymnasts', async (req, res) => {
  try {
    const gymnasts = await Gymnast.find();
    res.json(gymnasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/gymnasts', async (req, res) => {
  try {
    const newGymnast = new Gymnast(req.body);
    const savedGymnast = await newGymnast.save();
    res.status(201).json(savedGymnast);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- ROUTES JUSTAUCORPS ---

app.get('/api/leotards', async (req, res) => {
  try {
    const leotards = await Leotard.find();
    res.json(leotards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/leotards', async (req, res) => {
  try {
    const newLeotard = new Leotard(req.body);
    const savedLeotard = await newLeotard.save();
    res.status(201).json(savedLeotard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- ROUTES STOCKS ---

app.get('/api/stocks', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/stocks', async (req, res) => {
  try {
    const newStock = new Stock(req.body);
    const savedStock = await newStock.save();
    res.status(201).json(savedStock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route fallback : renvoie index.html pour les autres requêtes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});