const express = require('express');
const router = express.Router();
const getDb = req => req.app.get('db');

// GET toutes les affaires groupées par client
router.get('/', (req, res) => {
  const db = getDb(req);
  const query = `
    SELECT affaires.id AS affaire_id, affaires.numero, affaires.designation, affaires.statut AS affaire_statut,
      clients.id AS client_id, clients.nom AS client_nom, clients.contact AS client_contact, clients.adresse AS client_adresse
    FROM affaires
    INNER JOIN clients ON affaires.client_id = clients.id
    ORDER BY clients.nom, affaires.numero;
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.client_id]) {
        grouped[r.client_id] = {
          id: r.client_id,
          nom: r.client_nom,
          contact: r.client_contact,
          adresse: r.client_adresse,
          affaires: []
        };
      }
      grouped[r.client_id].affaires.push({
        id: r.affaire_id,
        numero: r.numero,
        designation: r.designation,
        statut: r.affaire_statut
      });
    });
    res.json(Object.values(grouped));
  });
});

// POST ajouter client/affaire
router.post('/', async (req, res) => {
  const db = getDb(req);
  const { nom, contact, adresse, numero, designation, statut } = req.body;
  if (!nom || !numero) return res.status(400).json({ error: 'Nom client et numéro affaire obligatoires.' });
  try {
    let clientId;
    const existingClient = await new Promise((r, j) =>
      db.get('SELECT id FROM clients WHERE nom = ?', [nom], (e, row) => e ? j(e) : r(row))
    );
    if (existingClient) clientId = existingClient.id;
    else {
      clientId = await new Promise((r, j) =>
        db.run('INSERT INTO clients (nom, contact, adresse) VALUES (?, ?, ?)', [nom, contact, adresse], function (e) {
          return e ? j(e) : r(this.lastID);
        })
      );
    }
    const existingAff = await new Promise((r, j) =>
      db.get('SELECT id FROM affaires WHERE numero = ? AND client_id = ?', [numero, clientId], (e, row) => e ? j(e) : r(row))
    );
    if (existingAff) return res.status(409).json({ error: 'Affaire existe déjà pour ce client.' });
    const affaireId = await new Promise((r, j) =>
      db.run('INSERT INTO affaires (numero, designation, client_id, statut) VALUES (?, ?, ?, ?)',
        [numero, designation || `Affaire ${numero}`, clientId, statut || 'Actif'],
        function (e) { return e ? j(e) : r(this.lastID); }
      )
    );
    res.status(201).json({
      client: { id: clientId, nom, contact, adresse },
      affaire: { id: affaireId, numero, designation: designation || `Affaire ${numero}`, statut: statut || 'Actif' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT composite : affaire + client
router.put('/:affaireId', async (req, res) => {
  const db = getDb(req);
  const { affaireId } = req.params;
  const { numero, designation, statut, clientId, nom, contact, adresse } = req.body;
  if (!numero || !designation || !statut || !clientId || !nom || !contact || !adresse) {
    return res.status(400).json({ error: 'Tous les champs affaire+client sont requis.' });
  }
  try {
    await new Promise((r, j) => db.run('BEGIN TRANSACTION', e => e ? j(e) : r()));
    await new Promise((r, j) =>
      db.run('UPDATE affaires SET numero = ?, designation = ?, statut = ? WHERE id = ?',
        [numero, designation, statut, affaireId],
        function (e) { return e ? j(e) : this.changes === 0 ? j(new Error('Affaire non trouvée')) : r(); }
      )
    );
    await new Promise((r, j) =>
      db.run('UPDATE clients SET nom = ?, contact = ?, adresse = ? WHERE id = ?',
        [nom, contact, adresse, clientId],
        function (e) { return e ? j(e) : this.changes === 0 ? j(new Error('Client non trouvé')) : r(); }
      )
    );
    await new Promise((r, j) => db.run('COMMIT', e => e ? j(e) : r()));
    const updatedAffaire = await new Promise((r, j) =>
      db.get('SELECT * FROM affaires WHERE id = ?', [affaireId], (e, row) => e ? j(e) : r(row))
    );
    const updatedClient = await new Promise((r, j) =>
      db.get('SELECT * FROM clients WHERE id = ?', [clientId], (e, row) => e ? j(e) : r(row))
    );
    res.status(200).json({ message: 'Affaire et client mis à jour', updatedAffaire, updatedClient });
  } catch (err) {
    console.error(err);
    await new Promise(r => db.run('ROLLBACK', () => r()));
    res.status(500).json({ error: err.message });
  }
});

// DELETE affaire
router.delete('/affaires/:id', (req, res) => {
  const db = getDb(req);
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID affaire requis.' });
  db.run('DELETE FROM affaires WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Affaire non trouvée.' });
    res.status(200).json({ message: `Affaire ${id} supprimée.` });
  });
});

module.exports = router;
