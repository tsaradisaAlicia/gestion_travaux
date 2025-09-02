const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../middleware/checkAuth");

const getDb = (req) => req.app.get("db");

// Promisifier db.run
function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

router.post(
  "/",
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
      await runAsync(db, "BEGIN TRANSACTION;");

      for (const bonData of bons) {
        const {
          id,
          numero_bon,
          affaire,
          client,
          designation_travaux,
          date_recu,
          heure_total,
          facturation,
          adresse,
          est_valide,
          cree_par_formulaire,
          interventions,
          observations,
        } = bonData;

        if (!numero_bon || !client) {
          throw new Error(`Données du bon de travail invalides (ID: ${id})`);
        }

        // 1) Insert/update bon
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
        await runAsync(db, bonInsertSql, [
          id,
          numero_bon,
          affaire,
          client,
          designation_travaux,
          date_recu,
          heure_total,
          facturation,
          adresse,
          est_valide,
          cree_par_formulaire,
        ]);

        // 2) Supprimer anciennes interventions et observations liées
        await runAsync(db, "DELETE FROM interventions WHERE bon_id = ?", [id]);
        await runAsync(db, "DELETE FROM observations WHERE bon_id = ?", [id]);

        // 3) Insérer interventions
        if (interventions && interventions.length > 0) {
          const interventionInsertSql = `
            INSERT INTO interventions (
              bon_id, du, au, matricule, prenoms, binome, heure_debut,
              heure_fin, total_heures, description_detail, observation_detail, is_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);
          `;
          for (const i of interventions) {
            await runAsync(db, interventionInsertSql, [
              id,
              i.du,
              i.au,
              i.matricule,
              i.prenoms,
              i.binome,
              i.heure_debut,
              i.heure_fin,
              i.total_heures,
              i.description_detail,
              i.observation_detail,
            ]);
          }
        }

        // 4) Insérer observations
        if (observations && observations.length > 0) {
          const observationInsertSql = `
            INSERT INTO observations (
              bon_id, tool_box_details, tool_box_responsable, rapport_incident,
              suivi_dechets_details, suivi_dechets_responsable, hsse, environnement,
              date, observateur, type, description, gravite, statut, chantier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `;
          for (const o of observations) {
            await runAsync(db, observationInsertSql, [
              id,
              o.tool_box_details,
              o.tool_box_responsable,
              o.rapport_incident,
              o.suivi_dechets_details,
              o.suivi_dechets_responsable,
              o.hsse,
              o.environnement,
              o.date,
              o.observateur,
              o.type,
              o.description,
              o.gravite,
              o.statut,
              o.chantier,
            ]);
          }
        }
      }

      await runAsync(db, "COMMIT;");
      console.log("Transaction COMMIT réussie.");
      res.status(200).json({
        status: "success",
        message: "Synchronisation terminée",
      });
    } catch (e) {
      try {
        await runAsync(db, "ROLLBACK;");
        console.error("Transaction ROLLBACK effectuée.");
      } catch (rollbackErr) {
        console.error("Erreur lors du ROLLBACK:", rollbackErr.message);
      }
      console.error("Erreur sync bon-de-travail:", e.message);
      res.status(500).json({
        status: "error",
        message: `Échec de la synchronisation : ${e.message}`,
      });
    }
  }
);

module.exports = router;