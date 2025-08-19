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

// ✅ Nouvelle route pour synchroniser plusieurs interventions en une seule requête
router.post('/sync', authenticateToken, authorizeRoles(['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE']), (req, res) => {
    const db = getDb(req);
    const interventions = req.body.interventions; // Le payload envoyé par Flutter

    if (!Array.isArray(interventions) || interventions.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Aucune intervention à synchroniser.' });
    }

    db.serialize(() => {
        const stmt = db.prepare(`
            INSERT INTO interventions (
                id, bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, 
                description_detail, observation_detail
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                bon_id = excluded.bon_id,
                du = excluded.du,
                au = excluded.au,
                matricule = excluded.matricule,
                prenoms = excluded.prenoms,
                binome = excluded.binome,
                heure_debut = excluded.heure_debut,
                heure_fin = excluded.heure_fin,
                description_detail = excluded.description_detail,
                observation_detail = excluded.observation_detail
        `);

        for (const intervention of interventions) {
            stmt.run([
                intervention.id,
                intervention.bon_id,
                intervention.du,
                intervention.au,
                intervention.matricule,
                intervention.prenoms,
                intervention.binome,
                intervention.heure_debut,
                intervention.heure_fin,
                intervention.description_detail,
                intervention.observation_detail
            ], (err) => {
                if (err) {
                    console.error('❌ Erreur insertion intervention:', err.message);
                }
            });
        }

        stmt.finalize((err) => {
            if (err) {
                console.error('❌ Erreur finalisation:', err.message);
                return res.status(500).json({ status: 'error', message: 'Erreur lors de la synchro interventions.' });
            }
            res.json({ status: 'success', message: `${interventions.length} interventions synchronisées avec succès.` });
        });
    });
});

module.exports = router;
