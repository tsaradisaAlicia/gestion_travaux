import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaClipboardList,
  FaPeopleCarry,
  FaUserTie,
  FaBuilding,
  FaShieldAlt,
  FaUsers,
  FaSignOutAlt,

  FaChartLine,
} from 'react-icons/fa';
import logoThermocool from '../assets/logo_thermocool.png';
import BonsTravailPage from './BonsTravailPage';
import InterventionsPage from './InterventionsPage';
import PersonnelsPage from './PersonnelsPage';
import ClientsAffairesPage from './ClientsAffairesPage';
import HSSEObservationsPage from './HSSEObservationsPage';
import UtilisateursPage from './UtilisateursPage';
import AnalysePerformancePage from './AnalysePerformancePage';
import { useNavigate } from 'react-router-dom';
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
} from 'recharts';

// VEUILLEZ REMPLACER CETTE ADRESSE SI VOTRE DOMAINE RENDER CHANGE !
//const API_BASE_URL = "https://gestion-travaux-de-thermocool.onrender.com";
const API_URL = process.env.REACT_APP_API_URL;

const HomePage = () => {
  const [menuActif, setMenuActif] = useState('dashboard');
  const navigate = useNavigate();

  // Nouveaux états pour les données du tableau de bord
  const [bonsNonValidesCount, setBonsNonValidesCount] = useState(0);

  const [interventionsTodayCount, setInterventionsTodayCount] = useState(0);
  // ✅ Renommé pour plus de clarté, ce sera le nombre d'intervenants actifs aujourd'hui
  const [intervenantsTodayCount, setIntervenantsTodayCount] = useState(0);
  const [recentActivitiesData, setRecentActivitiesData] = useState([]); // Pour le diagramme des activités
  const [lastThreeInterventions, setLastThreeInterventions] = useState([]); // Pour la liste des dernières interventions

  // Récupération du rôle de l'utilisateur pour les permissions
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName'); // Pour afficher le nom de l'utilisateur

  // Fonction utilitaire pour obtenir la configuration des headers avec le token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token'); // Assurez-vous que c'est bien 'token' ou 'userToken'
    if (!token) {
      console.error('Aucun token JWT trouvé dans le localStorage.');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fonction pour formater une date en 'DD/MM/YYYY'
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    let date;
    date = new Date(dateString);

    if (isNaN(date.getTime())) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }

    if (isNaN(date.getTime())) {
      console.error('Chaîne de date invalide reçue:', dateString);
      return 'Date Invalide';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Fonction pour charger toutes les données du tableau de bord
  const fetchDashboardData = async () => {
    const config = getAuthConfig();
    if (!config) {
      return;
    }

    try {
      // --- 1. Fetch Bons de Travail ---
      const bonsResponse = await axios.get(`${API_URL}/api/bons`, config);
      const allBons = bonsResponse.data;

      const nonValides = allBons.filter(bon => bon.est_valide === "Non validé").length;
      setBonsNonValidesCount(nonValides);

      // --- 2. Fetch Interventions ---
      const interventionsResponse = await axios.get(`${API_URL}/api/interventions`, config);
      const allInterventions = interventionsResponse.data;

      const today = new Date();
      // Pour une comparaison de date pure (ignorer l'heure), formater la date d'aujourd'hui
      const todayFormattedForComparison = formatDate(today);

      // Calculer les interventions du jour (filtrées pour obtenir les objets complets)
      const interventionsDuJour = allInterventions.filter(
        (inter) => formatDate(inter.du) === todayFormattedForComparison
      );
      setInterventionsTodayCount(interventionsDuJour.length);

      // ✅ Calculer les intervenants actifs (aujourd'hui)
      const activePersonnelToday = new Set();
      interventionsDuJour.forEach(inter => {
        if (inter.intervenant) {
          activePersonnelToday.add(inter.intervenant);
        }
        if (inter.binome) {
          activePersonnelToday.add(inter.binome);
        }
      });
      setIntervenantsTodayCount(activePersonnelToday.size); // Mettre à jour le nouvel état

      // Préparer les données pour le diagramme "Activités récentes" (basé sur les interventions)
      const activityMap = new Map();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 6);

      for (let i = 0; i < 7; i++) {
        const d = new Date(oneWeekAgo);
        d.setDate(oneWeekAgo.getDate() + i);
        activityMap.set(formatDate(d), { jour: formatDate(d), total: 0 });
      }

      allInterventions.forEach(inter => {
        const interDate = new Date(inter.du);
        if (!isNaN(interDate.getTime()) && interDate >= oneWeekAgo && interDate <= today) {
          const formattedDate = formatDate(inter.du);
          if (activityMap.has(formattedDate)) {
            const current = activityMap.get(formattedDate);
            activityMap.set(formattedDate, { ...current, total: current.total + 1 });
          }
        }
      });
      setRecentActivitiesData(Array.from(activityMap.values()));

      // Récupérer les 3 dernières interventions
      const sortedInterventions = [...allInterventions].sort((a, b) => {
        const parseDateForSort = (dateStr) => {
          if (!dateStr) return new Date(0);
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
          return new Date(dateStr);
        };

        const dateA = parseDateForSort(a.du);
        const dateB = parseDateForSort(b.du);

        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB.getTime() - dateA.getTime();
      });
      setLastThreeInterventions(sortedInterventions.slice(0, 3));

      // --- 3. Fetch Personnels (toujours utile si la page PersonnelsPage l'utilise) ---
      // Si vous n'utilisez pas le nombre total de personnels ailleurs, cette ligne peut être commentée.
      const personnelsResponse = await axios.get(`${API_URL}/api/personnels`, config);
      // const allPersonnels = personnelsResponse.data; // Non utilisé directement pour le compteur "actifs"

    } catch (error) {
      console.error('Erreur lors du chargement des données du tableau de bord:', error.response ? error.response.data : error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert("Votre session a expiré ou vous n'êtes pas autorisé à voir le tableau de bord. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userMatricule');
        localStorage.removeItem('userName');
        navigate('/');
      } else {
        alert("Une erreur est survenue lors du chargement du tableau de bord.");
      }
    }
  };

  // Charger les données du tableau de bord au montage du composant
  useEffect(() => {
    fetchDashboardData();
  }, [menuActif]);

  const handleDeconnexion = () => {
    const confirmation = window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
    if (confirmation) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userMatricule');
      localStorage.removeItem('userName');
      navigate("/");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-center py-6 border-b border-blue-700">
            <img
              src={logoThermocool}
              alt="Logo"
              className="w-28 h-20 rounded-full border-2 border-white"
            />  
          </div>
          <nav className="mt-6">
            <ul className="space-y-2 px-4">
              <li
                  onClick={() => setMenuActif('dashboard')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'dashboard' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaHome />
                  <span>Tableau de bord</span>
                </li>

                <li
                  onClick={() => setMenuActif('bons')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'bons' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaClipboardList />
                  <span>Bons de travail</span>
                </li>

                <li
                  onClick={() => setMenuActif('interventions')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'interventions' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaPeopleCarry />
                  <span>Interventions</span>
                </li>

                <li
                  onClick={() => setMenuActif('personnels')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'personnels' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaUserTie />
                  <span>Personnels</span>
                </li>

                <li
                  onClick={() => setMenuActif('clients')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'clients' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaBuilding />
                  <span>Clients / Affaires</span>
                </li>

                <li
                  onClick={() => setMenuActif('hsse')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'hsse' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaShieldAlt />
                  <span>HSE / Observations</span>
                </li>
                {/* 👈 NOUVEAU MENU : Analyse & Performance */}
                <li
                  onClick={() => setMenuActif('performance')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'performance' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaChartLine />
                  <span>Analyse & Performance</span>
                </li>

                <li
                  onClick={() => setMenuActif('utilisateurs')}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    menuActif === 'utilisateurs' ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <FaUsers />
                  <span>Utilisateurs</span>
                </li>
            </ul>
          </nav>
        </div>
        <div className="px-4 py-4 border-t border-blue-700">
          <div className="text-sm text-gray-300 mb-2">
            Connecté en tant que: <span className="font-semibold">{userName} ({userRole})</span>
          </div>
          <button onClick={handleDeconnexion} className="w-full flex items-center justify-center space-x-2 p-2 bg-red-600 hover:bg-red-700 rounded text-white">
            <FaSignOutAlt />
            <span>Déconnexion</span>
        </button>

        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {menuActif === 'dashboard' && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Bienvenue sur la plateforme de gestion des travaux de THERMOCOOL TECHNOLOGY 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Sélectionnez une section dans le menu pour gérer les bons de travail,
              les interventions, les personnels, les affaires ou les observations HSSE.
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tableau de bord</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded shadow text-center flex flex-col items-center">
              <FaClipboardList className="text-5xl text-blue-600 mb-2" />
              <p className="text-gray-500">Bons à valider</p>
              <p className="text-3xl font-bold text-blue-700">{bonsNonValidesCount}</p>
            </div>

            <div className="bg-white p-6 rounded shadow text-center flex flex-col items-center">
              <FaPeopleCarry className="text-5xl text-green-600 mb-2" />
              <p className="text-gray-500">Interventions du jour</p>
              <p className="text-3xl font-bold text-green-700">{interventionsTodayCount}</p>
            </div>

            <div className="bg-white p-6 rounded shadow text-center flex flex-col items-center">
              <FaUserTie className="text-5xl text-indigo-600 mb-2" />
              {/* ✅ Libellé mis à jour */}
              <p className="text-gray-500">Intervenants du jour</p>
              {/* ✅ Utilisation du nouveau compteur */}
              <p className="text-3xl font-bold text-indigo-700">{intervenantsTodayCount}</p>
            </div>
          </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Activités récentes</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={recentActivitiesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#3B82F6" name="Total Interventions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Dernières interventions</h2>
                <ul className="space-y-2">
                  {lastThreeInterventions.length > 0 ? (
                    lastThreeInterventions.map((inter) => (
                      <li key={inter.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{inter.designation}</span>
                        <span className="text-gray-500">{formatDate(inter.du)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">Aucune intervention récente.</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}

        {menuActif === 'bons' && <BonsTravailPage />}
        {menuActif === 'interventions' && <InterventionsPage />}
        {menuActif === 'personnels' && <PersonnelsPage />}
        {menuActif === 'clients' && <ClientsAffairesPage />}
        {menuActif === 'hsse' && <HSSEObservationsPage />}
        {/* 👈 AJOUT DU NOUVEAU COMPOSANT DE PAGE */}
        {menuActif === 'performance' && <AnalysePerformancePage />}
        {menuActif === 'utilisateurs' && <UtilisateursPage />}
      </div>
    </div>
  );
};

export default HomePage;