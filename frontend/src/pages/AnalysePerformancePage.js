// AnalysePerformancePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart, // Pour des graphiques circulaires (utile pour la répartition des pannes)
  Pie,
  Cell,
} from 'recharts';
import { FaChartLine, FaExclamationTriangle, FaRecycle, FaCube } from 'react-icons/fa';
import PerformanceTechnicien from '../components/PerformanceTechnicien'; 

// Couleurs pour les graphiques (à adapter)
const COLORS = ['#FF4560', '#008FFB', '#00E396', '#FEB019', '#775DD0', '#A8A8A8'];

const AnalysePerformancePage = () => {
  const [pannesParCause, setPannesParCause] = useState([]);
  const [tauxRappel, setTauxRappel] = useState('N/A');
  const [pannesParDomaine, setPannesParDomaine] = useState([]);
  const [piecesPlusUtilisees, setPiecesPlusUtilisees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction utilitaire pour obtenir la configuration des headers avec le token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchAnalyseData = async () => {
    const config = getAuthConfig();
    if (!config) return;

    setIsLoading(true);
    try {
      // ⚠️ ADAPTER L'ENDPOINT : Vous devrez créer cet endpoint dans votre API Node.js (ex: /api/performance/analyse-pannes)
      const response = await axios.get('http://localhost:5000/api/performance/analyse-pannes', config);
      const data = response.data;
      
      // Simuler des données pour la démonstration tant que l'API n'est pas prête
      // En production, vous utiliserez data.pannes_par_cause, data.taux_rappel, etc.
      
      // Analyse 1: Classification des Pannes (Graphique de Pareto)
      setPannesParCause(data.pannes_par_cause || [
        { cause: 'Sonde défectueuse', count: 75 },
        { cause: 'Fuite Gaz R410', count: 50 },
        { cause: 'Problème électrique', count: 40 },
        { cause: 'Vanne bloquée', count: 30 },
        { cause: 'Autres', count: 15 },
      ]);

      // Analyse 2: Taux de Rappel (ou Taux de Réparation Non-Conforme)
      setTauxRappel(data.taux_rappel ? `${(data.taux_rappel * 100).toFixed(1)} %` : '8.5 %'); 

      // Analyse 3: Répartition par Domaine (Plomberie, Froid, Sécurité)
      setPannesParDomaine(data.pannes_par_domaine || [
       // 👇 NOUVELLE SIMULATION 👇
       { name: 'Froid & Clim', value: 550 },
       { name: 'VMC/Désenfumage', value: 120 }, // Nouveau Domaine
       { name: 'Plomberie', value: 250 },
       { name: 'Sécurité Incendie', value: 150 }, // Mis à jour
       { name: 'Matériels de Cuisine', value: 80 }, // Nouveau Domaine
       { name: 'Électricité Générale', value: 100 }, // Garder un domaine général
     ]);

     // 👇 NOUVELLE ANALYSE 4: Pièces les plus critiques (pour l'optimisation des stocks)
     setPiecesPlusUtilisees(data.pieces_plus_utilisee || [
       { piece_name: 'Filtre M5 (24x24)', usage_count: 95, cost_unit: 100000 },
       { piece_name: 'Joint torique 3/4"', usage_count: 88, cost_unit: 1.20 },
       { piece_name: 'Contrôleur Temp. XYZ', usage_count: 52, cost_unit: 85.00 },
       { piece_name: 'Fusible Céramique 10A', usage_count: 40, cost_unit: 2.50 },
       { piece_name: 'Vanne d\'arrêt 1/2"', usage_count: 35, cost_unit: 18.00 },
    ]);

    } catch (error) {
      console.error("Erreur lors du chargement des données d'analyse:", error);
      // Gérer l'erreur (ex: afficher un message)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyseData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-black-800 flex items-center space-x-3">
        <FaChartLine className="text-4xl" />
        <span>Analyse & Performance Opérationnelle</span>
      </h1>
      <p className="text-gray-600">
        Tableau de bord stratégique pour l'analyse prédictive des pannes.
      </p>

      {isLoading ? (
        <div className="text-center p-10 text-gray-500">Chargement des données d'analyse...</div>
      ) : (
        <>
          {/* Indicateur Clé 1: Taux de Rappel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/*
            <div className="bg-white p-6 rounded shadow text-center flex flex-col items-center col-span-1">
              <FaExclamationTriangle className="text-5xl text-red-600 mb-2" />
              <p className="text-gray-500">Taux de Rappel (Ré-intervention)</p>
              <p className="text-4xl font-bold text-red-700">{tauxRappel}</p>
              <p className="text-sm text-gray-400 mt-2">Cible idéale :  5%</p>
            </div>
            */}
            
            {/* Graphique 1: Pareto des causes de pannes */}
            <div className="bg-white p-6 rounded shadow col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Top 5 Causes de Pannes</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pannesParCause} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cause" angle={-15} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} label={{ value: 'Nombre de Pannes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF4560" name="Occurrences" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-500 mt-2">Permet d'orienter la formation ou les choix d'équipement (ou choix des pièces).</p>
            </div>
          </div>

          {/* 👇 AJOUTER CE NOUVEAU BLOC COMPLET CI-DESSOUS 👇 */}
    <div className="mt-8">
        <PerformanceTechnicien />
    </div>

          {/* Graphique 2: Répartition par Domaine d'Activité */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Répartition des Pannes par Domaine</h2>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pannesParDomaine}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pannesParDomaine.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} pannes`, props.payload.name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-500 mt-2">Identification des domaines où le risque est le plus concentré.</p>
            </div>

          {/* 👇 NOUVEAU BLOC : Optimisation des Stocks & Achats */}
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center space-x-2">
                   <FaCube />
                   <span>Top Pièces & Optimisation Stock</span>
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                 {/* Utilisation du BarChart pour un meilleur affichage des noms de pièces */}
                   <BarChart data={piecesPlusUtilisees} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis type="number" label={{ value: 'Nombre d\'Utilisations', position: 'bottom', offset: 0 }} allowDecimals={false}/>
                     <YAxis dataKey="piece_name" type="category" width={100}/>
                     <Tooltip 
                       formatter={(value, name, props) => {
                          const usage = value;
                          const cost = props.payload.cost_unit || 'N/A';
                         return [
                        `${usage} utilisations`,
                           `Coût Unitaire: ${cost} Ariary`
                         ];
                       }}
                     />
                     <Legend formatter={(value) => 'Utilisations'} />
                     <Bar dataKey="usage_count" fill="#775DD0" name="Utilisations" />
                   </BarChart>
                 </ResponsiveContainer>
                 <p className="text-sm text-gray-500 mt-2">
                    Base pour déterminer le **stock de sécurité** des pièces critiques.
                 </p>
             </div>
            
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysePerformancePage;