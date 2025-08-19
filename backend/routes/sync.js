// backend/routes/sync.js
const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../middleware/checkAuth");

const getDb = (req) => req.app.get("db");

router.post(
  "/bon-de-travail",
  authenticateToken,
  authorizeRoles(["TECHNICIEN"]),
  async (req, res) => {
    const db = getDb(req);
    const bons = req.body.bonsDeTravail;

    if (!bons || !Array.isArray(bons)) {
      return res.status(400).json({
        status: "error",
        message: "Format invalide : bonsDeTravail attendu",
      });
    }

    try {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        for (const bonData of bons) {
          const { id, numero_bon, affaire, client, designation_travaux, date_recu,
            heure_total, facturation, adresse, est_valide, cree_par_formulaire,
            interventions, observations } = bonData;

          // 1) Insertion ou update du bon
          const bonInsertSql = `
            INSERT INTO bonsdetravail (
              id, numero_bon, affaire, client, designation_travaux, date_recu,
              heure_total, facturation, adresse, est_valide, cree_par_formulaire, is_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(id) DO UPDATE SET
              numero_bon=excluded.numero_bon,
              affaire=excluded.affaire,
              client=excluded.client,
              designation_travaux=excluded.designation_travaux,
              date_recu=excluded.date_recu,
              heure_total=excluded.heure_total,
              facturation=excluded.facturation,
              adresse=excluded.adresse,
              est_valide=excluded.est_valide,
              cree_par_formulaire=excluded.cree_par_formulaire,
              is_synced=1;
          `;

          db.run(bonInsertSql, [
            id, numero_bon, affaire, client, designation_travaux, date_recu,
            heure_total, facturation, adresse, est_valide, cree_par_formulaire,
          ]);

          // 2) Insertion des interventions liées
          if (interventions && interventions.length > 0) {
            const interventionInsertSql = `
              INSERT INTO interventions (
                bon_id, du, au, matricule, prenoms, binome, heure_debut,
                heure_fin, total_heures, description_detail, observation_detail, is_synced
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);
            `;
            for (const i of interventions) {
              db.run(interventionInsertSql, [
                id, i.du, i.au, i.matricule, i.prenoms, i.binome,
                i.heure_debut, i.heure_fin, i.total_heures, i.description_detail, i.observation_detail
              ]);
            }
          }

          // 3) Insertion des observations liées
          if (observations && observations.length > 0) {
            const observationInsertSql = `
              INSERT INTO observations (
                bon_id, tool_box_details, tool_box_responsable, rapport_incident,
                suivi_dechets_details, suivi_dechets_responsable, hsse, environnement,
                date, observateur, type, description, gravite, statut, chantier
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            for (const o of observations) {
              db.run(observationInsertSql, [
                id, o.tool_box_details, o.tool_box_responsable, o.rapport_incident,
                o.suivi_dechets_details, o.suivi_dechets_responsable, o.hsse, o.environnement,
                o.date, o.observateur, o.type, o.description, o.gravite, o.statut, o.chantier
              ]);
            }
          }
        }

        db.run("COMMIT;");
      });

      res.status(200).json({
        status: "success",
        message: "Synchronisation terminée",
      });
    } catch (e) {
      db.run("ROLLBACK;");
      console.error("Erreur sync bon-de-travail:", e.message);
      res.status(500).json({
        status: "error",
        message: `Échec de la synchronisation : ${e.message}`,
      });
    }
  }
);

module.exports = router;
