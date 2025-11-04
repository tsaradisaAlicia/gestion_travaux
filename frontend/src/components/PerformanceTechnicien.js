// src/components/PerformanceTechnicien.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserCog, FaFilter } from 'react-icons/fa';

const PerformanceTechnicien = () => {
  const [technicienData, setTechnicienData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction utilitaire pour obtenir la configuration des headers avec le token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchTechnicienData = async () => {
      const config = getAuthConfig();
      if (!config) return;

      setIsLoading(true);
      try {
        // ⚠️ NOUVEL ENDPOINT À CRÉER dans votre API backend
        const response = await axios.get('http://localhost:5000/api/performance/techniciens', config);
        
        // Simuler des données pour la démo en attendant l'API
        const demoData = [
          { id: 1, nom: 'Jean', totalInterventions: '58 heures', tauxRappel: 5.2, chantier: 'Platinium' },
          { id: 2, nom: 'Fidelis', totalInterventions: '72 heures', tauxRappel: 2.8, chantier: 'Place masay' },
          { id: 3, nom: 'Jean Jimmy', totalInterventions: '45 heures', tauxRappel: 11.1, chantier: 'Skyline' },
          { id: 4, nom: 'Fetra', totalInterventions: '65 heures', tauxRappel: 4.6, chantier: 'ECE' },
        ];
        
        setTechnicienData(response.data || demoData);

      } catch (error) {
        console.error("Erreur lors de la récupération des performances des techniciens:", error);
        // En cas d'erreur, on utilise les données de démo pour ne pas bloquer l'affichage
        const demoData = [
            { id: 1, nom: 'Jean', totalInterventions: '58 heures', tauxRappel: 5.2, chantier: 'Platinium' },
            { id: 2, nom: 'Fidelis', totalInterventions: '72 heures', tauxRappel: 2.8, chantier: 'Place masay' },
            { id: 3, nom: 'Jean Jimmy', totalInterventions: '45 heures', tauxRappel: 11.1, chantier: 'Skyline' },
            { id: 4, nom: 'Fetra', totalInterventions: '65 heures', tauxRappel: 4.6, chantier: 'ECE' },
        ];
        setTechnicienData(demoData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicienData();
  }, []);

  const getRappelCellStyle = (taux) => {
    if (taux > 10) return 'text-red-600 font-bold';
    if (taux > 5) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-800 flex items-center space-x-2">
            <FaUserCog />
            <span>Analyse de Performance par Intervenant (par technicien)</span>
        </h2>
        <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800">
            <FaFilter />
            <span>Filtrer par nom</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intervenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Interventions (par Nb d'heure)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux de Rappel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chantier (le plus appelé pour la réintervention)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
                <tr><td colSpan="4" className="text-center p-4 text-gray-500">Chargement...</td></tr>
            ) : (
                technicienData.map((tech) => (
                    <tr key={tech.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tech.nom}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.totalInterventions}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getRappelCellStyle(tech.tauxRappel)}`}>{tech.tauxRappel}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.chantier}</td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Le 'Taux de Rappel' mesure la qualité de la réparation.
      </p>
    </div>
  );
};

export default PerformanceTechnicien;