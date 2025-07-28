// migrate_passwords.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs'); // Assurez-vous d'avoir installé bcryptjs: npm install bcryptjs

const dbPath = path.join(__dirname, 'gestion_travaux.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
        return;
    }
    console.log('Connecté à la base de données pour la migration.');

    // 1. Récupérer tous les utilisateurs dont le mot de passe n'est pas encore haché
    // Nous supposons qu'un mot de passe haché commence par '$2a$', '$2b$' ou '$2y$' (formats bcrypt)
    // Et qu'un mot de passe non haché ne commence PAS par ces préfixes.
    db.all(`SELECT id, matricule, motDePasse FROM users 
            WHERE motDePasse NOT LIKE '$2a$%' 
              AND motDePasse NOT LIKE '$2b$%' 
              AND motDePasse NOT LIKE '$2y$%'`, [], async (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err.message);
            db.close();
            return;
        }

        if (rows.length === 0) {
            console.log('Aucun mot de passe en texte clair à migrer. Tous les mots de passe semblent déjà hachés ou il n\'y a pas d\'utilisateurs.');
            db.close();
            return;
        }

        console.log(`Début de la migration de ${rows.length} mots de passe...`);

        for (const user of rows) {
            try {
                const hashedPassword = await bcrypt.hash(user.motDePasse, 10); // Hacher le mot de passe actuel
                
                // Mettre à jour le mot de passe dans la base de données
                db.run('UPDATE users SET motDePasse = ? WHERE id = ?', [hashedPassword, user.id], function(updateErr) {
                    if (updateErr) {
                        console.error(`Erreur lors de la mise à jour du mot de passe pour l'utilisateur ${user.matricule}:`, updateErr.message);
                    } else {
                        console.log(`Mot de passe de l'utilisateur ${user.matricule} (ID: ${user.id}) haché et mis à jour.`);
                    }
                });
            } catch (hashErr) {
                console.error(`Erreur lors du hachage du mot de passe pour l'utilisateur ${user.matricule}:`, hashErr);
            }
        }
        console.log('Migration des mots de passe terminée.');
        // Un délai pour s'assurer que toutes les opérations db.run sont terminées
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('Erreur lors de la fermeture de la base de données:', err.message);
                } else {
                    console.log('Connexion à la base de données fermée.');
                }
            });
        }, 1000); // Petit délai
    });
});