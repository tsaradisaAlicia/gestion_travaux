// backend/routes/bons.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/checkAuth');

const getDb = (req) => req.app.get('db');

// ✅ Liste des bons (Accessible par tous les rôles qui peuvent voir la page)
router.get('/', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH']), (req, res) => {
  const db = getDb(req); 
  const sql = `
    SELECT 
      b.id AS bon_id,
      b.numero_bon,
      b.affaire,
      b.client,
      b.designation_travaux,
      b.date_recu,
      b.heure_total,
      b.facturation,
      b.est_valide,
      i.du,
      i.au,
      i.matricule,
      i.prenoms,
      i.binome
    FROM bonsdetravail b
    LEFT JOIN interventions i ON i.bon_id = b.id
    ORDER BY b.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erreur récupération bons avec interventions :', err.message);
      res.status(500).json({ error: err.message });
    } else {
      const bonsMap = {};

      rows.forEach(row => {
        const bonId = row.bon_id;

        if (!bonsMap[bonId]) {
            bonsMap[bonId] = {
                id: bonId,
                numero_bon: row.numero_bon,
                affaire: row.affaire,
                client: row.client,
                designation_travaux: row.designation_travaux,
                date_recu: row.date_recu,
                heure_total: row.heure_total,
                facturation: row.facturation,
                est_valide: row.est_valide,
                interventions: [],
            };
            }

        if (row.matricule) {
          bonsMap[bonId].interventions.push({
            du: row.du,
            au: row.au,
            matricule: row.matricule,
            prenoms: row.prenoms,
            binome: row.binome
          });
        }
      });

      const bons = Object.values(bonsMap);
      res.json(bons);
    }
  });
});

// 🔗 Liste des interventions liées à un bon (Accessible par tous les rôles qui peuvent voir la page)
router.get('/interventions/:bon_id', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH']), (req, res) => {
  const bonId = req.params.bon_id;
  const db = getDb(req);
  console.log('📌 Requête pour interventions du bon_id =', bonId);
  const sql = `SELECT id, du, au, matricule, prenoms, binome, designation, description, lieu, heure_debut, heure_fin, heure_total FROM interventions WHERE bon_id = ?`; // Ajout de plus de champs pour l'export PDF/Excel
  db.all(sql, [bonId], (err, rows) => {
    if (err) {
      console.error('Erreur récupération interventions pour bon :', err.message);
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// --- AJOUTER, MODIFIER, SUPPRIMER DES BONS DE TRAVAIL ---

// ✅ POST - Ajouter un nouveau bon de travail (Accessible par Admin, RESPONSABLE TECHNIQUE, CHARGE D'ETUDE)
router.post('/', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE']), (req, res) => {
    const db = getDb(req);
    const { numero_bon, affaire, client, designation_travaux, date_recu, heure_total, facturation, est_valide } = req.body;

    if (!numero_bon || !affaire || !client || !designation_travaux || !date_recu || !facturation) {
        return res.status(400).json({ error: 'Champs obligatoires manquants pour le bon de travail.' });
    }

    const sql = `INSERT INTO bonsdetravail (numero_bon, affaire, client, designation_travaux, date_recu, heure_total, facturation, est_valide)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [numero_bon, affaire, client, designation_travaux, date_recu, heure_total, facturation, est_valide], function(err) {
        if (err) {
            console.error('Erreur lors de l\'ajout du bon de travail:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Un bon de travail avec ce numéro existe déjà.' });
            }
            return res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du bon de travail.' });
        }
        res.status(201).json({ 
            id: this.lastID, 
            numero_bon, affaire, client, designation_travaux, date_recu, heure_total, facturation, est_valide 
        });
    });
});

// ✅ PUT - Modifier un bon de travail (Maintenant accessible par Admin et RRH pour la facturation, et autres champs)
router.put('/:id', authenticateToken, authorizeRoles(['Admin', 'RRH']), (req, res) => {
    const db = getDb(req);
    const { id } = req.params;
    // Récupérer tous les champs potentiellement modifiables
    const { numero_bon, affaire, client, designation_travaux, date_recu, heure_total, facturation, est_valide } = req.body;

    const fieldsToUpdate = [];
    const values = [];

    // Ajouter les champs à mettre à jour dynamiquement
    if (numero_bon !== undefined) { fieldsToUpdate.push('numero_bon = ?'); values.push(numero_bon); }
    if (affaire !== undefined) { fieldsToUpdate.push('affaire = ?'); values.push(affaire); }
    if (client !== undefined) { fieldsToUpdate.push('client = ?'); values.push(client); }
    if (designation_travaux !== undefined) { fieldsToUpdate.push('designation_travaux = ?'); values.push(designation_travaux); }
    if (date_recu !== undefined) { fieldsToUpdate.push('date_recu = ?'); values.push(date_recu); }
    if (heure_total !== undefined) { fieldsToUpdate.push('heure_total = ?'); values.push(heure_total); }
    if (facturation !== undefined) { fieldsToUpdate.push('facturation = ?'); values.push(facturation); } // Champ facturation
    if (est_valide !== undefined) { fieldsToUpdate.push('est_valide = ?'); values.push(est_valide); }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour fourni.' });
    }

    const sql = `UPDATE bonsdetravail SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    values.push(id); // Ajouter l'ID à la fin des valeurs

    db.run(sql, values, function(err) {
        if (err) {
            console.error('Erreur lors de la modification du bon de travail:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Un autre bon de travail avec ce numéro existe déjà.' });
            }
            return res.status(500).json({ error: 'Erreur serveur lors de la modification du bon de travail.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Bon de travail non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Bon de travail mis à jour avec succès.', id });
    });
});

// ✅ DELETE - Supprimer un bon de travail (Accessible par Admin, RRH)
router.delete('/:id', authenticateToken, authorizeRoles(['Admin', 'RRH']), (req, res) => {
    const db = getDb(req);
    const { id } = req.params;

    db.serialize(() => {
        db.run("DELETE FROM interventions WHERE bon_id = ?", [id], (err) => {
            if (err) {
                console.error('Erreur lors de la suppression des interventions liées:', err.message);
            } else {
                console.log(`Interventions liées au bon ${id} supprimées.`);
            }
        });

        db.run("DELETE FROM bonsdetravail WHERE id = ?", [id], function(err) {
            if (err) {
                console.error('Erreur lors de la suppression du bon de travail:', err.message);
                return res.status(500).json({ error: 'Erreur serveur lors de la suppression du bon de travail.' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Bon de travail non trouvé.' });
            }
            res.status(200).json({ message: 'Bon de travail supprimé avec succès.' });
        });
    });
});

module.exports = router;
