// backend/middleware/checkAuth.js
const jwt = require('jsonwebtoken');

// ✅ Clé secrète pour signer les tokens JWT
// ATTENTION: EN PRODUCTION, UTILISEZ UNE VRAIE VARIABLE D'ENVIRONNEMENT SECURISEE !
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee_pour_jwt_par_defaut'; // Clé par défaut si non définie

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (token == null) {
        console.warn('Authentification requise: Token manquant.');
        return res.status(401).json({ message: 'Authentification requise. Token manquant.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erreur de vérification du token:', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
            }
            return res.status(403).json({ message: 'Token invalide. Accès refusé.' });
        }
        req.user = user; // Stocke les infos de l'utilisateur décryptées (id, matricule, roleName)
        next();
    });
};

// Middleware pour vérifier les rôles
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        // req.user doit être défini par authenticateToken et contenir le rôleName
        if (!req.user || !req.user.roleName) {
            console.warn('Accès refusé: Informations de rôle manquantes dans le token.');
            return res.status(403).json({ message: 'Accès refusé. Informations de rôle utilisateur manquantes.' });
        }

        if (!allowedRoles.includes(req.user.roleName)) {
            console.warn(`Accès non autorisé pour l'utilisateur ${req.user.matricule} (Rôle: ${req.user.roleName}). Rôles requis: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    JWT_SECRET // Exportez la clé secrète pour qu'elle puisse être utilisée ailleurs si nécessaire (ex: pour signer les tokens)
};