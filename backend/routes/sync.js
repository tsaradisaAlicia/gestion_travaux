// backend/routes/sync.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/checkAuth');

const getDb = (req) => req.app.get('db');

// Route de synchronisation pour les bons de travail
// Accessible uniquement par les utilisateurs mobiles authentifiés avec le rôle 'TECHNICIEN'
router.post('/bon-de-travail', authenticateToken, authorizeRoles(['TECHNICIEN']), async (req, res) => {
    const db = getDb(req);
    const bonData = req.body;

    if (!bonData || !bonData.bon || !bonData.interventions) {
        return res.status(400).json({ status: 'error', message: 'Données de bon de travail, interventions ou observations manquantes.' });
    }

    const { bon, interventions, observations } = bonData;

    try {
        // 1. Démarrer une transaction pour garantir l'intégrité des données
        await db.run('BEGIN TRANSACTION;');

        // 2. Insérer le bon de travail principal
        const bonInsertSql = `INSERT INTO bonsdetravail (
            numero_bon, affaire, client, designation_travaux, date_recu, heure_total, facturation, est_valide, cree_par_formulaire
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;

        const bonId = await new Promise((resolve, reject) => {
            db.run(bonInsertSql, [
                bon.numero_bon, bon.affaire, bon.client, bon.designation_travaux, bon.date_recu, bon.heure_total, bon.facturation, bon.est_valide, 1
            ], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });

        // 3. Insérer toutes les interventions associées
        const interventionInsertSql = `INSERT INTO interventions (
            bon_id, du, au, matricule, prenoms, binome, heure_debut, heure_fin, total_heures, description_detail, observation_detail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

        for (const intervention of interventions) {
            await new Promise((resolve, reject) => {
                db.run(interventionInsertSql, [
                    bonId, intervention.du, intervention.au, intervention.matricule, intervention.prenoms, intervention.binome,
                    intervention.heure_debut, intervention.heure_fin, intervention.total_heures, intervention.description_detail,
                    intervention.observation_detail
                ], function(err) {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        // 4. Insérer toutes les observations associées, si elles existent
        if (observations && observations.length > 0) {
            const observationInsertSql = `INSERT INTO observations (
                bon_id, tool_box_details, tool_box_responsable, rapport_incident, suivi_dechets_details, suivi_dechets_responsable,
                hsse, environnement, date, observateur, type, description, gravite, statut, chantier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
            
            for (const observation of observations) {
                await new Promise((resolve, reject) => {
                    db.run(observationInsertSql, [
                        bonId, observation.tool_box_details, observation.tool_box_responsable, observation.rapport_incident,
                        observation.suivi_dechets_details, observation.suivi_dechets_responsable, observation.hsse, observation.environnement,
                        observation.date, observation.observateur, observation.type, observation.description, observation.gravite,
                        observation.statut, observation.chantier
                    ], function(err) {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            }
        }

        // 5. Tout s'est bien passé, on peut valider la transaction
        await db.run('COMMIT;');

        res.status(200).json({ status: 'success', message: 'Bon de travail synchronisé avec succès.', bon_id: bonId });

    } catch (e) {
        // En cas d'erreur, on annule la transaction pour ne rien enregistrer
        await db.run('ROLLBACK;');
        console.error('Erreur lors de la synchronisation d\'un bon de travail :', e.message);
        res.status(500).json({ status: 'error', message: `Échec de la synchronisation : ${e.message}` });
    }
});

module.exports = router;
