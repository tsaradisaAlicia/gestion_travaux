// backend/routes/mobileAuth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Importez bcryptjs
const jwt = require('jsonwebtoken'); // Importez jsonwebtoken
require('dotenv').config(); // Pour charger les variables d'environnement depuis un fichier .env

// Clé secrète JWT : Très important !
// Utilisez une chaîne longue et complexe. Pour la production, stockez-la dans une variable d'environnement (par exemple, dans un fichier .env).
const JWT_SECRET = process.env.JWT_SECRET || 'une_cle_secrete_tres_tres_longue_et_complexe_pour_le_dev'; // Utilisez dotenv en production!

// Route de connexion pour les utilisateurs mobiles
router.post('/login-mobile', (req, res) => {
    const { matricule, motDePasse } = req.body;
    const db = req.app.get('db'); // Récupère l'instance de la base de données SQLite

    if (!matricule || !motDePasse) {
        return res.status(400).json({ message: 'Matricule et mot de passe sont requis.' });
    }

    db.get(`SELECT * FROM mobile_users WHERE matricule = ?`, [matricule], async (err, user) => {
        if (err) {
            console.error('Erreur lors de la récupération de l\'utilisateur mobile:', err.message);
            return res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
        if (!user) {
            // Important : Ne pas dire si c'est le matricule ou le mot de passe qui est incorrect pour des raisons de sécurité
            return res.status(401).json({ message: 'Identifiants incorrects.' });
        }

        // Comparer le mot de passe fourni avec le mot de passe haché de la base de données
        const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasse);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Identifiants incorrects.' });
        }

        // Si les identifiants sont valides, générer un token JWT
        const token = jwt.sign(
            { id: user.id, matricule: user.matricule, nom: user.nom, prenoms: user.prenoms, fonction: user.fonction }, // Payload du token
            JWT_SECRET,
            { expiresIn: '1h' } // Le token expirera après 1 heure
        );

        res.json({
            message: 'Connexion mobile réussie',
            token,
            user: { // Retourne les informations de l'utilisateur (sans le mot de passe)
                id: user.id,
                matricule: user.matricule,
                nom: user.nom,
                prenoms: user.prenoms,
                fonction: user.fonction,
            }
        });
    });
});

module.exports = router;