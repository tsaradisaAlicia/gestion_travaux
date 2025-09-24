const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Ce point de terminaison recevra les données de Flutter
app.post('/api/donnees', (req, res) => {
  const donneesRecues = req.body;
  console.log('Données reçues de l\'application Flutter :', donneesRecues);

  // Ici, vous traiterez les données (validation, stockage en BDD, etc.)
  // Par exemple, les sauvegarder dans une base de données.

  res.status(200).json({ message: 'Données reçues avec succès !', data: donneesRecues });
});

// Point de terminaison de test pour vérifier que l'API est vivante
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'L\'API fonctionne !' });
});

module.exports = app;