// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
//const { initDb } = require('./database/init_db'); 


const app = express();
const PORT = 5000;


app.use(cors());
app.use(express.json());

// ✅ Connexion à la base
const db = new sqlite3.Database(path.join(__dirname, 'gestion_travaux.db'), (err) => {
  if (err) return console.error('Erreur de connexion à SQLite:', err.message);
  console.log('✅ Connexion à SQLite réussie.');

  // NOUVELLE LIGNE À AJOUTER ICI : Rend l'instance de la base de données disponible pour toutes les routes
  app.set('db', db);

   //1) NOUVEAU : Création de la table 'mobile_users' IDENTIQUE AU db_helper.dart dans le FLUTTER
  db.run(`CREATE TABLE IF NOT EXISTS mobile_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricule TEXT UNIQUE,
      nom TEXT,
      prenoms TEXT,
      fonction TEXT,
      motDePasse TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Erreur de création de la table 'mobile_users':", err.message);
    } else {
      console.log('Table mobile_users vérifiée/créée.');
    }
  });

  //2) Création du table bonsdetravail si elle n'existe pas IDENTIQUE AU db_helper.dart dans le FLUTTER
  db.run(`CREATE TABLE IF NOT EXISTS bonsdetravail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_bon INTEGER,
    affaire TEXT,
    client TEXT,
    designation_travaux TEXT,
    date_recu TEXT,
    heure_total TEXT,
    facturation TEXT,
    adresse TEXT,
    est_valide INTEGER,
    cree_par_formulaire INTEGER DEFAULT 0,
    is_synced INTEGER DEFAULT 0
  )`);

  //3) Création de la table interventions IDENTIQUE AU db_helper.dart dans le FLUTTER
  db.run(`CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bon_id INTEGER,
    du TEXT,
    au TEXT,
    matricule TEXT,
    prenoms TEXT,
    binome TEXT,
    heure_debut TEXT,
    heure_fin TEXT,
    total_heures REAL,
    description_detail TEXT,
    observation_detail TEXT,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (bon_id) REFERENCES bonsdetravail(id)
  )`);

  //4) Création de la table observations IDENTIQUE AU db_helper.dart dans le FLUTTER
  db.run(`CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bon_id INTEGER,
    tool_box_details TEXT,
    tool_box_responsable TEXT,
    rapport_incident TEXT,
    suivi_dechets_details TEXT,
    suivi_dechets_responsable TEXT,
    hsse TEXT,
    environnement TEXT,
    date TEXT,
    observateur TEXT,
    type TEXT,
    description TEXT,
    gravite TEXT,
    statut TEXT,
    chantier TEXT,
    FOREIGN KEY (bon_id) REFERENCES bonsdetravail(id)
  )`);

  //5) Création du table personnels si nécessaire IDENTIQUE AU db_helper.dart dans le FLUTTER
  db.run(`CREATE TABLE IF NOT EXISTS personnels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricule TEXT UNIQUE,
    nom TEXT,
    prenoms TEXT,
    fonction TEXT
  )`);

  //6) Création de la table clients 
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT UNIQUE,
    contact TEXT,
    adresse TEXT
  )`);

  //7) Création de la table affaires
  db.run(`CREATE TABLE IF NOT EXISTS affaires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE,
    designation TEXT,
    client_id INTEGER,
    statut TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  )`);

   //8) Création du table users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricule TEXT UNIQUE,
    nom TEXT,
    prenoms TEXT,
    role_id INTEGER, -- Changé de 'role TEXT' à 'role_id INTEGER'
    motDePasse TEXT,
    FOREIGN KEY (role_id) REFERENCES roles(id) -- Ajout de la clé étrangère
  )`, (err) => {
    if (err) {
      // Gérer l'erreur si la table existe déjà avec une ancienne structure
      if (err.message.includes("duplicate column name: role_id")) {
        console.warn("La colonne 'role_id' existe déjà dans la table 'users'.");
      } else if (err.message.includes("column role is not unique")) {
         // Cela peut arriver si vous avez un 'role TEXT' et que vous essayez d'ajouter 'role_id'.
         // Pour une migration propre, il faudrait DROP TABLE puis CREATE, ou ALTER TABLE.
         // Pour l'instant, si vous voyez cette erreur, votre DB est probablement dans un état mixte.
         console.error("Erreur lors de la création de la table 'users':", err.message);
      } else {
        console.error("Erreur de création de la table 'users':", err.message);
      }
    } else {
      console.log('Table users vérifiée/créée.');
    }
  });


  //9) NOUVEAU : Création de la table 'roles' si elle n'existe pas
  db.run(`CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Erreur de création de la table 'roles':", err.message);
    } else {
      console.log('Table roles vérifiée/créée.');
      // Insérer les rôles par défaut si la table est vide
      db.get("SELECT COUNT(*) AS count FROM roles", (err, row) => {
        if (row.count === 0) {
          console.log("Insertion des rôles par défaut...");
          db.run("INSERT INTO roles (name) VALUES ('Admin'), ('RESPONSABLE TECHNIQUE'), ('CHARGE D\'ETUDE'), ('Assistante DES DIRECTIONS'), ('RRH')", (err) => {
            if (err) console.error("Erreur d'insertion des rôles par défaut:", err.message);
            else console.log("Rôles par défaut insérés.");
          });
        }
      });
    }
  });

});


// ✅ Importer les routeurs
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

const personnelsRoutes = require('./routes/personnels');
app.use('/api/personnels', personnelsRoutes);

const bonsRoutes = require('./routes/bons');
app.use('/api/bons', bonsRoutes);

const interventionsRoutes = require('./routes/interventions');
app.use('/api/interventions', interventionsRoutes);

const observationsRoutes = require('./routes/observations');
app.use('/api/observations', observationsRoutes);

const clientsAffairesRoutes = require('./routes/clientsAffaires');
app.use('/api/clients-affaires', clientsAffairesRoutes);

const mobileAuthRoutes = require('./routes/mobileAuth');
app.use('/api/mobile', mobileAuthRoutes);

const syncRoutes = require('./routes/sync');
app.use('/api/sync', syncRoutes);

// Supprimez ces routes directes de server.js car elles sont maintenant gérées par clientsAffairesRoutes
// app.get('/api/clients', (req, res) => { /* ... */ });
// app.get('/api/affaires/:client_id', (req, res) => { /* ... */ });

// 🚨 LIGNE CRUCIALE : Doit être après le 'require' et doit pointer vers un routeur valide.
const performanceRoutes = require('./routes/performanceRoutes');
app.use('/api/performance', performanceRoutes); 


app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
});
