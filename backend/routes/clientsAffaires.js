// routes/clientsAffaires.js
const express = require('express');
const router = express.Router();
// const sqlite3 = require('sqlite3').verbose(); // <-- Supprimez ou commentez cette ligne
// const path = require('path');             // <-- Supprimez ou commentez cette ligne

// Supprimez cette connexion locale à la base de données :
// const dbPath = path.resolve(__dirname, '../gestion_travaux.db');
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     console.error('Erreur de connexion à SQLite dans clientsAffaires.js :', err.message);
//   } else {
//     console.log('✅ Connecté à la base SQLite dans clientsAffaires.js');
//   }
// });

// NOUVEAU : Fonction utilitaire pour obtenir la connexion à la base de données partagée
const getDb = (req) => req.app.get('db');

// GET toutes les affaires groupées par client
router.get('/', (req, res) => {
  const db = getDb(req); // Utilisez getDb(req) pour obtenir l'instance de la base de données
  const query = `
    SELECT
      affaires.id AS affaire_id,
      affaires.numero,
      affaires.designation,
      affaires.statut AS affaire_statut,
      clients.id AS client_id,
      clients.nom AS client_nom,
      clients.contact AS client_contact,
      clients.adresse AS client_adresse
    FROM affaires
    INNER JOIN clients ON affaires.client_id = clients.id
    ORDER BY clients.nom, affaires.numero;
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des clients et affaires :', err.message);
      return res.status(500).json({ error: err.message });
    }

    // Grouper les affaires par client
    const clientsAvecAffaires = {};
    rows.forEach(row => {
      if (!clientsAvecAffaires[row.client_id]) {
        clientsAvecAffaires[row.client_id] = {
          id: row.client_id,
          nom: row.client_nom,
          contact: row.client_contact,
          adresse: row.client_adresse,
          affaires: []
        };
      }
      clientsAvecAffaires[row.client_id].affaires.push({
        id: row.affaire_id,
        numero: row.numero,
        designation: row.designation,
        statut: row.affaire_statut
      });
    });

    res.json(Object.values(clientsAvecAffaires));
  });
});

// POST pour ajouter un client et/ou une affaire
router.post('/', async (req, res) => {
  const db = getDb(req); // Utilisez getDb(req)
  const { nom, contact, adresse, numero, designation, statut } = req.body; // nom est le nom du client

  if (!nom || !numero) {
    return res.status(400).json({ error: 'Le nom du client et le numéro de l\'affaire sont obligatoires.' });
  }

  try {
    let clientId;

    // 1. Vérifier si le client existe déjà
    const existingClient = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM clients WHERE nom = ?', [nom], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (existingClient) {
      clientId = existingClient.id;
      console.log(`Client '${nom}' trouvé (ID: ${clientId}).`);
    } else {
      // Si le client n'existe pas, l'insérer
      const insertClientResult = await new Promise((resolve, reject) => {
        db.run('INSERT INTO clients (nom, contact, adresse) VALUES (?, ?, ?)', [nom, contact, adresse], function (err) {
          if (err) reject(err);
          resolve(this.lastID);
        });
      });
      clientId = insertClientResult;
      console.log(`Client '${nom}' inséré avec l'ID ${clientId}.`);
    }

    // 2. Vérifier si l'affaire existe déjà pour ce client
    const existingAffaire = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM affaires WHERE numero = ? AND client_id = ?', [numero, clientId], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });

    if (existingAffaire) {
        return res.status(409).json({ error: 'Une affaire avec ce numéro existe déjà pour ce client.' });
    }

    // 3. Insérer l'affaire avec le client_id
    const insertAffaireResult = await new Promise((resolve, reject) => {
      db.run('INSERT INTO affaires (numero, designation, client_id, statut) VALUES (?, ?, ?, ?)', [numero, designation || `Affaire ${numero} pour ${nom}`, clientId, statut || 'Actif'], function (err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
    });
    const newAffaireId = insertAffaireResult;
    console.log(`Affaire '${numero}' insérée pour le client ${nom} (ID: ${clientId}).`);

    // Renvoyer les données du nouveau client et affaire pour mettre à jour le frontend
    res.status(201).json({
      client: { id: clientId, nom, contact, adresse },
      affaire: { id: newAffaireId, numero, designation: designation || `Affaire ${numero} pour ${nom}`, statut: statut || 'Actif' }
    });

  } catch (err) {
    console.error('Erreur lors de l\'ajout client/affaire :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT pour modifier une affaire existante
router.put('/affaires/:id', (req, res) => {
  const db = getDb(req); // Utilisez getDb(req)
  const { id } = req.params;
  const { numero, designation, statut } = req.body;

  if (!numero || !designation || !statut) {
    return res.status(400).json({ error: 'Tous les champs (numéro, désignation, statut) sont obligatoires pour la mise à jour de l\'affaire.' });
  }

  const sql = `UPDATE affaires SET numero = ?, designation = ?, statut = ? WHERE id = ?`;
  db.run(sql, [numero, designation, statut, id], function (err) {
    if (err) {
      console.error(`Erreur lors de la mise à jour de l'affaire ${id}:`, err.message);
      // Gérer l'erreur si le numéro d'affaire est unique et déjà pris pour un autre client (plus complexe ici)
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Une autre affaire avec ce numéro existe déjà.' });
      }
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: `Affaire avec l'ID ${id} non trouvée ou aucune modification effectuée.` });
    }
    res.status(200).json({ message: `Affaire avec l'ID ${id} mise à jour avec succès.` });
  });
});

// DELETE une affaire
router.delete('/affaires/:id', (req, res) => {
  const db = getDb(req); // Utilisez getDb(req)
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'L\'ID de l\'affaire est requis pour la suppression.' });
  }

  db.run('DELETE FROM affaires WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(`Erreur lors de la suppression de l'affaire ${id}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: `Affaire avec l'ID ${id} non trouvée.` });
    }
    res.status(200).json({ message: `Affaire avec l'ID ${id} supprimée avec succès.` });
  });
});

// PUT pour modifier un client existant
router.put('/clients/:id', (req, res) => {
  const db = getDb(req); // Utilisez getDb(req)
  const { id } = req.params;
  const { nom, contact, adresse } = req.body;

  if (!nom || !contact || !adresse) {
    return res.status(400).json({ error: 'Tous les champs (nom, contact, adresse) sont obligatoires pour la mise à jour du client.' });
  }

  const sql = `UPDATE clients SET nom = ?, contact = ?, adresse = ? WHERE id = ?`;
  db.run(sql, [nom, contact, adresse, id], function (err) {
    if (err) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, err.message);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Un autre client avec ce nom existe déjà.' });
      }
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: `Client avec l'ID ${id} non trouvé ou aucune modification effectuée.` });
    }
    res.status(200).json({ message: `Client avec l'ID ${id} mis à jour avec succès.` });
  });
});

// DELETE un client
router.delete('/clients/:id', (req, res) => {
  const db = getDb(req); // Utilisez getDb(req)
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'L\'ID du client est requis pour la suppression.' });
  }

  // Utiliser db.serialize pour s'assurer que les opérations sont séquentielles
  db.serialize(() => {
    // Supprimer d'abord les affaires associées à ce client
    db.run('DELETE FROM affaires WHERE client_id = ?', [id], (err) => {
      if (err) {
        console.error(`Erreur lors de la suppression des affaires liées au client ${id}:`, err.message);
        // Si cela échoue, ne pas empêcher la suppression du client, mais logguer l'erreur
      } else {
        console.log(`Affaires liées au client ${id} supprimées.`);
      }
    });

    // Ensuite, supprimer le client
    db.run('DELETE FROM clients WHERE id = ?', [id], function (err) {
      if (err) {
        console.error(`Erreur lors de la suppression du client ${id}:`, err.message);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: `Client avec l'ID ${id} non trouvé.` });
      }
      res.status(200).json({ message: `Client avec l'ID ${id} supprimé avec succès.` });
    });
  });
});


module.exports = router;