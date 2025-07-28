// backend/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Importez bcrypt pour le hachage
const jwt = require('jsonwebtoken'); // Importez jsonwebtoken pour les tokens
const getDb = (req) => req.app.get('db');

// Importez les middlewares et la clé secrète depuis checkAuth.js
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('../middleware/checkAuth');


// =========================================================
// ROUTES D'AUTHENTIFICATION (PAS BESOIN DE TOKEN POUR SE CONNECTER)
// =========================================================

// ✅ POST /api/users/login - Connexion de l'utilisateur
router.post('/login', async (req, res) => {
    const db = getDb(req);
    const { matricule, motDePasse } = req.body;

    if (!matricule || !motDePasse) {
        return res.status(400).json({ message: 'Matricule et mot de passe sont requis.' });
    }

    try {
        // Récupérer l'utilisateur par matricule en utilisant une Promesse
        const user = await new Promise((resolve, reject) => {
            // Suppression de 'u.actif' dans la sélection
            db.get(`SELECT u.id, u.matricule, u.nom, u.prenoms, u.motDePasse, r.name AS roleName
                    FROM users u
                    JOIN roles r ON u.role_id = r.id
                    WHERE u.matricule = ?`, [matricule], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        // Suppression de la vérification 'user.actif === 0'
        if (!user) {
            return res.status(401).json({ message: 'Matricule ou mot de passe incorrect.' });
        }

        // Comparer le mot de passe fourni avec le hachage stocké
        const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasse);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Matricule ou mot de passe incorrect.' });
        }

        // Générer un token JWT si le mot de passe est correct
        const payload = {
            id: user.id,
            matricule: user.matricule,
            roleName: user.roleName // Inclure le nom du rôle dans le token
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expire en 1 heure

        // Retourner le token et les infos de l'utilisateur (sans le mot de passe haché)
        res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                matricule: user.matricule,
                nom: user.nom,
                prenoms: user.prenoms,
                roleName: user.roleName // Envoyez le nom du rôle au frontend
            }
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error.message);
        return res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
});


// =========================================================
// ROUTES DE GESTION DES UTILISATEURS (PROTÉGÉES PAR AUTHENTICATION/AUTHORISATION)
// =========================================================

// ✅ GET /api/users - Récupérer tous les utilisateurs (Accessible par Admin, RRH, Assistante DES DIRECTIONS)
router.get('/', authenticateToken, authorizeRoles(['Admin', 'RRH', 'Assistante DES DIRECTIONS']), async (req, res) => {
    const db = getDb(req);
    try {
        // Jointure avec la table roles pour obtenir le nom du rôle
        // Suppression de 'u.actif' dans la sélection
        const users = await new Promise((resolve, reject) => {
            db.all(`SELECT u.id, u.matricule, u.nom, u.prenoms, r.name AS roleName
                    FROM users u
                    JOIN roles r ON u.role_id = r.id`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
        res.json(users);
    } catch (error) {
        console.error('Erreur récupération utilisateurs :', error.message);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des utilisateurs.' });
    }
});

// ✅ POST /api/users - Ajouter un nouvel utilisateur (Accessible par Admin)
router.post('/', authenticateToken, authorizeRoles(['Admin']), async (req, res) => {
    const db = getDb(req);
    // Suppression de 'actif' dans la déstructuration
    const { matricule, nom, prenoms, roleId, motDePasse } = req.body;

    // Suppression de 'actif' dans la validation
    if (!matricule || !nom || !prenoms || !roleId || !motDePasse) {
        return res.status(400).json({ error: 'Tous les champs (matricule, nom, prénoms, rôle et mot de passe) sont requis.' });
    }

    try {
        // Hacher le mot de passe avant de l'enregistrer
        const hashedPassword = await bcrypt.hash(motDePasse, 10);

        const result = await new Promise((resolve, reject) => {
            // Suppression de 'actif' dans l'insertion
            db.run(`INSERT INTO users (matricule, nom, prenoms, role_id, motDePasse)
                     VALUES (?, ?, ?, ?, ?)`,
                [matricule, nom, prenoms, roleId, hashedPassword],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this);
                    }
                }
            );
        });

        // Suppression de 'actif' dans la réponse
        res.status(201).json({ id: result.lastID, matricule, nom, prenoms, roleId });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Un utilisateur avec ce matricule existe déjà.' });
        }
        console.error('Erreur ajout utilisateur :', error.message);
        return res.status(500).json({ error: error.message });
    }
});

// ✅ PUT /api/users/:id - Modifier un utilisateur (Accessible par Admin)
router.put('/:id', authenticateToken, authorizeRoles(['Admin']), async (req, res) => {
    const db = getDb(req);
    const { id } = req.params;
    // Suppression de 'actif' dans la déstructuration
    const { matricule, nom, prenoms, roleId, motDePasse } = req.body;

    // Suppression de 'actif' dans la validation
    if (!matricule && !nom && !prenoms && !roleId && !motDePasse) {
        return res.status(400).json({ message: 'Aucun champ à mettre à jour fourni.' });
    }

    const fields = [];
    const values = [];

    if (matricule) { fields.push('matricule = ?'); values.push(matricule); }
    if (nom) { fields.push('nom = ?'); values.push(nom); }
    if (prenoms) { fields.push('prenoms = ?'); values.push(prenoms); }
    if (roleId) { fields.push('role_id = ?'); values.push(roleId); }
    // Suppression de 'actif' dans la logique de mise à jour

    if (motDePasse) {
        // Hacher le nouveau mot de passe s'il est fourni
        const hashedPassword = await bcrypt.hash(motDePasse, 10);
        fields.push('motDePasse = ?');
        values.push(hashedPassword);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Aucun champ valide à mettre à jour fourni.' });
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    try {
        const result = await new Promise((resolve, reject) => {
            db.run(query, values, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Utilisateur mis à jour avec succès.', id });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Un autre utilisateur avec ce matricule existe déjà.' });
        }
        console.error(`Erreur lors de la mise à jour de l'utilisateur ${id}:`, error.message);
        return res.status(500).json({ error: error.message });
    }
});


// ✅ DELETE /api/users/:id - Supprimer un utilisateur (Accessible par Admin)
router.delete('/:id', authenticateToken, authorizeRoles(['Admin']), async (req, res) => {
    const db = getDb(req);
    const { id } = req.params;

    try {
        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.json({ message: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur suppression utilisateur :', error.message);
        return res.status(500).json({ error: error.message });
    }
});

// ✅ GET /api/users/roles - Récupérer tous les rôles (accessible par Admin pour les formulaires)
router.get('/roles', authenticateToken, authorizeRoles(['Admin', 'RRH', 'Assistante DES DIRECTIONS']), async (req, res) => {
    const db = getDb(req);
    try {
        const roles = await new Promise((resolve, reject) => {
            db.all('SELECT id, name FROM roles', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(roles);
    } catch (error) {
        console.error('Erreur lors de la récupération des rôles :', error.message);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des rôles.' });
    }
});


module.exports = router;
