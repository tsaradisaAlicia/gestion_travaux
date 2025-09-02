// backend/routes/personnels.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/checkAuth');

const getDb = (req) => req.app.get('db');

// ✅ GET : Récupérer tous les personnels (Rôles mis à jour pour la vue)
router.get('/', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH']), (req, res) => {
  const db = getDb(req);
  const sql = 'SELECT * FROM personnels';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erreur récupération personnels :', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// ✅ POST : Ajouter un nouveau personnel
router.post('/', authenticateToken, authorizeRoles(['Admin', 'RRH']), (req, res) => {
  const db = getDb(req);
  const { matricule, nom, prenoms, fonction } = req.body;

  if (!matricule || !nom || !prenoms || !fonction) {
    return res.status(400).json({ error: 'Tous les champs (matricule, nom, prenoms, fonction) sont requis.' });
  }

  const sql = `INSERT INTO personnels (matricule, nom, prenoms, fonction)
               VALUES (?, ?, ?, ?)`;

  db.run(sql, [matricule, nom, prenoms, fonction], function (err) {
    if (err) {
      console.error('Erreur ajout personnel :', err.message);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Un personnel avec ce matricule existe déjà.' });
      }
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      matricule,
      nom,
      prenoms,
      fonction,
    });
  });
});

// PUT - Modifier un personnel
router.put('/:id', authenticateToken, authorizeRoles(['Admin', 'RRH']), (req, res) => {
  const db = getDb(req);
  const id = req.params.id;
  const { matricule, nom, prenoms, fonction } = req.body;

  if (!matricule || !nom || !prenoms || !fonction) {
    return res.status(400).json({ error: 'Tous les champs (matricule, nom, prenoms, fonction) sont requis pour la mise à jour.' });
  }

  const sql = `UPDATE personnels
               SET matricule = ?, nom = ?, prenoms = ?, fonction = ?
               WHERE id = ?`;

  db.run(sql, [matricule, nom, prenoms, fonction, id], function (err) {
    if (err) {
      console.error('Erreur modification personnel :', err.message);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Un autre personnel avec ce matricule existe déjà.' });
      }
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Personnel non trouvé ou aucune modification effectuée.' });
    }

    res.status(200).json({
      id,
      matricule,
      nom,
      prenoms,
      fonction
    });
  });
});

// DELETE - Supprimer un personnel
router.delete('/:id', authenticateToken, authorizeRoles(['Admin', 'RRH']), (req, res) => {
  const db = getDb(req);
  const id = req.params.id;

  const sql = 'DELETE FROM personnels WHERE id = ?';
  db.run(sql, [id], function (err) {
    if (err) {
      console.error('Erreur suppression personnel :', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Personnel non trouvé.' });
    }

    res.status(200).json({ message: 'Personnel supprimé avec succès.' });
  });
});


// ✅ POST /sync - Synchroniser tous les personnels (pour Flutter)
router.post('/sync', authenticateToken, authorizeRoles(['Admin', 'RRH']), (req, res) => {
  const db = getDb(req);
  const personnels = req.body.personnels;

  if (!Array.isArray(personnels) || personnels.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Aucun personnel à synchroniser.' });
  }

  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO personnels (id, matricule, nom, prenoms, fonction)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        matricule = excluded.matricule,
        nom = excluded.nom,
        prenoms = excluded.prenoms,
        fonction = excluded.fonction
    `);

    for (const p of personnels) {
      stmt.run([
        p.id,
        p.matricule,
        p.nom,
        p.prenoms,
        p.fonction
      ], (err) => {
        if (err) {
          console.error('❌ Erreur insertion personnel :', err.message);
        }
      });
    }

    stmt.finalize((err) => {
      if (err) {
        console.error('❌ Erreur finalisation personnels :', err.message);
        return res.status(500).json({ status: 'error', message: 'Erreur lors de la synchro des personnels.' });
      }
      res.json({ status: 'success', message: `${personnels.length} personnels synchronisés avec succès.` });
    });
  });
});

// ✅ GET /techniciens - Récupérer uniquement les techniciens pour le formulaire
router.get('/techniciens', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH']), (req, res) => {
  const sql = `SELECT matricule, nom, prenoms FROM personnels WHERE fonction = 'TECHNICIEN'`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


module.exports = router;
