// routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/checkAuth'); // Assurez-vous que ce chemin est correct

// 🎯 ROUTE POUR /api/performance/analyse-pannes (Répartition des pannes par domaine & Pareto)
router.get('/analyse-pannes', authenticateToken, (req, res) => {
    // SIMULATION DES DONNÉES D'ANALYSE
    const simulationData = {
        // Taux de Rappel (pour l'indicateur clé)
        taux_rappel: 0.085, // 8.5%

        // Top 5 Causes de Pannes (pour le graphique à barres - Pareto)
        pannes_par_cause: [
            { cause: 'Sonde défectueuse', count: 75 },
            { cause: 'Fuite Gaz R410', count: 50 },
            { cause: 'Problème électrique', count: 40 },
            { cause: 'Vanne bloquée', count: 30 },
            { cause: 'Autres', count: 15 },
        ],

        // Répartition par Domaine (pour le graphique circulaire)
        pannes_par_domaine: [
            { name: 'Froid & Clim', value: 550 },
            { name: 'VMC/Désenfumage', value: 120 },
            { name: 'Plomberie', value: 250 },
            { name: 'Sécurité Incendie', value: 150 },
            { name: 'Matériels de Cuisine', value: 80 },
            //{ name: 'Électricité Générale', value: 100 },
        ],
    };
    
    res.json(simulationData);
});



module.exports = router; // 👈 EXPORTATION CRUCIALE