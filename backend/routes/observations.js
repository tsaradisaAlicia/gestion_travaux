// backend/routes/observations.js
const express = require('express');
const router = express.Router();

// Importez les middlewares d'authentification et d'autorisation
const { authenticateToken, authorizeRoles } = require('../middleware/checkAuth');

// Fonction utilitaire pour obtenir la connexion à la base de données partagée
const getDb = (req) => req.app.get('db');

// ✅ GET toutes les observations (Accessible par tous les rôles qui peuvent voir la page)
router.get('/', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH']), async (req, res) => {
  const db = getDb(req);
  try {
    const rows = await new Promise((resolve, reject) => {
      const query = `SELECT * FROM observations ORDER BY date DESC, id DESC`;
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des observations :', error.message);
    return res.status(500).json({ error: 'Erreur serveur lors de la récupération des observations.' });
  }
});

// ✅ POST pour ajouter une nouvelle observation (Accessible par Admin, RESPONSABLE TECHNIQUE)
router.post('/', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE']), async (req, res) => {
  const db = getDb(req);
  const { date, observateur, type, description, gravite, statut, chantier } = req.body;

  if (!date || !observateur || !type || !description || !gravite || !statut || !chantier) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const query = `INSERT INTO observations (date, observateur, type, description, gravite, statut, chantier)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(query, [date, observateur, type, description, gravite, statut, chantier], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
    res.status(201).json({ id: result.lastID, date, observateur, type, description, gravite, statut, chantier });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'observation :', error.message);
    return res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de l\'observation.' });
  }
});

// ✅ PUT pour modifier une observation (Accessible par Admin, RESPONSABLE TECHNIQUE)
router.put('/:id', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE']), async (req, res) => {
  const db = getDb(req);
  const { id } = req.params;
  const { date, observateur, type, description, gravite, statut, chantier } = req.body;

  const fields = [];
  const values = [];

  if (date) { fields.push('date = ?'); values.push(date); }
  if (observateur) { fields.push('observateur = ?'); values.push(observateur); }
  if (type) { fields.push('type = ?'); values.push(type); }
  if (description) { fields.push('description = ?'); values.push(description); }
  if (gravite) { fields.push('gravite = ?'); values.push(gravite); }
  if (statut) { fields.push('statut = ?'); values.push(statut); }
  if (chantier) { fields.push('chantier = ?'); values.push(chantier); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Aucun champ à mettre à jour fourni.' });
  }

  const query = `UPDATE observations SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  try {
    const result = await new Promise((resolve, reject) => {
      db.run(query, values, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ message: `Observation avec l'ID ${id} non trouvée ou aucune modification effectuée.` });
    }
    res.status(200).json({ message: `Observation avec l'ID ${id} mise à jour avec succès.` });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'observation ${id}:`, error.message);
    return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'observation.' });
  }
});

// ✅ DELETE une observation (Accessible par Admin, RESPONSABLE TECHNIQUE)
router.delete('/:id', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE']), async (req, res) => {
  const db = getDb(req);
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'L\'ID de l\'observation est requis pour la suppression.' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM observations WHERE id = ?', [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ message: `Observation avec l'ID ${id} non trouvée.` });
    }
    res.status(200).json({ message: `Observation avec l'ID ${id} supprimée avec succès.` });
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'observation ${id}:`, error.message);
    return res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'observation.' });
  }
});

module.exports = router;
