// routes/interventions.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/checkAuth'); // Import des middlewares

const getDb = (req) => req.app.get('db');

// ✅ Route pour récupérer toutes les interventions avec les détails des bons de travail
// Accessible par tous les rôles qui peuvent voir la page
router.get('/', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante\xA0DES\xA0DIRECTIONS', 'RRH', 'Superviseur', 'Technicien', 'Observateur']), (req, res) => {
    const db = getDb(req);
    const sql = `
        SELECT
            i.id,
            b.numero_bon,
            i.du,
            i.au,
            i.matricule,
            i.prenoms,
            i.binome,
            i.heure_debut,
            i.heure_fin,
            b.designation_travaux AS designation,
            i.description_detail AS description,
            i.observation_detail AS observations,
            b.client,
            b.affaire,
            b.adresse
        FROM
            interventions i
        JOIN
            bonsdetravail b ON i.bon_id = b.id
        ORDER BY
            i.du DESC, i.heure_debut DESC;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des interventions:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ✅ Route POST pour ajouter une nouvelle intervention (Accessible par Admin, RESPONSABLE TECHNIQUE, CHARGE D'ETUDE)
router.post('/', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE']), (req, res) => {
    const db = getDb(req);
    const { bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, description_detail, observation_detail } = req.body;

    if (!bon_id || !du || !au || !matricule || !prenoms || !heure_debut || !heure_fin || !description_detail) {
        return res.status(400).json({ error: 'Champs obligatoires manquants pour l\'intervention.' });
    }

    const sql = `INSERT INTO interventions (bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, description_detail, observation_detail)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, description_detail, observation_detail], function(err) {
        if (err) {
            console.error('Erreur lors de l\'ajout de l\'intervention:', err.message);
            return res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de l\'intervention.' });
        }
        res.status(201).json({ id: this.lastID, bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, description_detail, observation_detail });
    });
});


// ✅ Route PUT pour modifier une intervention existante (Accessible par Admin, RESPONSABLE TECHNIQUE)
router.put('/:id', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE']), (req, res) => {
    const db = getDb(req);
    const { id } = req.params;
    const { bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, description_detail, observation_detail } = req.body;

    if (!bon_id || !du || !au || !matricule || !prenoms || !heure_debut || !heure_fin || !description_detail) {
        return res.status(400).json({ error: 'Champs obligatoires manquants pour la mise à jour de l\'intervention.' });
    }

    const sql = `UPDATE interventions SET
                 bon_id = ?, du = ?, au = ?, matricule = ?, prenoms = ?, binome = ?,
                 heure_debut = ?, heure_fin = ?, description_detail = ?, observation_detail = ?
                 WHERE id = ?`;
    db.run(sql, [bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, description_detail, observation_detail, id], function(err) {
        if (err) {
            console.error('Erreur lors de la modification de l\'intervention:', err.message);
            return res.status(500).json({ error: 'Erreur serveur lors de la modification de l\'intervention.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Intervention non trouvée ou aucune modification effectuée.' });
        }
        res.json({ message: 'Intervention mise à jour avec succès.', id });
    });
});

// ✅ Route DELETE pour supprimer une intervention (Accessible par Admin, RESPONSABLE TECHNIQUE)
router.delete('/:id', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE']), (req, res) => {
    const db = getDb(req);
    const { id } = req.params;

    const sql = 'DELETE FROM interventions WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Erreur lors de la suppression de l\'intervention:', err.message);
            return res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'intervention.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Intervention non trouvée.' });
        }
        res.json({ message: 'Intervention supprimée avec succès.' });
    });
});

module.exports = router;
