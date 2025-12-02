import React, { useState, useEffect } from 'react';
//import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

// Les fonctions exporterBonsExcelFn et exporterTousBonsExcelFn ne sont plus directement utilisées ici
// car leur logique est déplacée dans le worker. On peut les retirer si elles ne sont pas utilisées ailleurs.
// import { exporterBonsExcel as exporterBonsExcelFn, exporterTousBonsExcel as exporterTousBonsExcelFn } from '../components/Excel/ExportExcel';
import axios from 'axios';
import { FaEdit, FaSave, FaTimes, FaSpinner } from 'react-icons/fa'; // Ajout de FaSpinner


// VEUILLEZ REMPLACER CETTE ADRESSE SI VOTRE DOMAINE RENDER CHANGE !
//const API_BASE_URL = "https://gestion-travaux-de-thermocool.onrender.com";
const API_URL = process.env.REACT_APP_API_URL;

function BonsTravailPage() {
  const [searchClient, setSearchClient] = useState('');
  const [searchStatut, setSearchStatut] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [bons, setBons] = useState([]);

  const [editingBonId, setEditingBonId] = useState(null);
  const [editingFacturationValue, setEditingFacturationValue] = useState('');

  // Nouveaux états pour gérer les chargements des exports
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const userRole = localStorage.getItem('userRole');
  const canEditFacturation = ['Admin', 'RRH'].includes(userRole);
  const canViewBons = ['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante\xA0DES\xA0DIRECTIONS', 'RRH', 'Superviseur', 'Technicien', 'Observateur'].includes(userRole);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
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

  // CHARGER LES BONS AVEC INTERVENTIONS
  const fetchBons = async () => {
    if (!canViewBons) {
      setBons([]);
      return;
    }
    const config = getAuthConfig();
    if (!config) {
        alert("Vous devez être connecté pour voir cette page.");
        setBons([]);
        return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/bons`, config);
      const bonsData = res.data;
      console.log("📥 Données reçues de /api/bons :", bonsData);
      setBons(bonsData);
    } catch (error) {
      console.error('❌ Erreur chargement bons :', error.response ? error.response.data : error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert("Votre session a expiré ou vous n'êtes pas autorisé à voir cette page. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userMatricule');
        localStorage.removeItem('userName');
      } else {
        alert("Une erreur est survenue lors du chargement des bons.");
      }
      setBons([]);
    }
  };

  useEffect(() => {
    fetchBons();
  }, [userRole, canViewBons]);

  // FILTRES
  const bonsFiltres = bons.filter((bon) => {
    const bonClient = bon.client?.toLowerCase() || "";
    const bonStatut = bon.est_valide ? "Validé" : "Non validé";

    const aBonneDate = bon.interventions?.some((i) => {
      if (!i.du) return false;
      const [jour, mois, annee] = i.du.split('/');
      const duFormatee = `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`;
      return duFormatee.includes(searchDate);
    }) ?? false;

    return (
      bonClient.includes(searchClient.toLowerCase()) &&
      bonStatut.includes(searchStatut.toLowerCase()) &&
      (searchDate === '' || aBonneDate)
    );
  });

  const reinitialiserFiltres = () => {
    setSearchClient('');
    setSearchStatut('');
    setSearchDate('');
  };

  const handleEditFacturationClick = (bon) => {
    setEditingBonId(bon.id);
    setEditingFacturationValue(bon.facturation || '');
  };

  const handleSaveFacturationClick = async (bonId) => {
    if (!canEditFacturation) {
      alert("Vous n'avez pas les permissions pour modifier la facturation.");
      return;
    }
    const config = getAuthConfig();
    if (!config) return;

    try {
      const response = await axios.put(`${API_URL}/api/bons/${bonId}`, {
        facturation: editingFacturationValue
      }, config);

      if (response.status === 200) {
        alert('Facturation mise à jour avec succès !');
        setEditingBonId(null);
        setEditingFacturationValue('');
        fetchBons();
      } else {
        alert('Erreur lors de la mise à jour de la facturation.');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facturation:', error.response ? error.response.data : error.message);
      alert('Erreur lors de la mise à jour : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelFacturationClick = () => {
    setEditingBonId(null);
    setEditingFacturationValue('');
  };

  // EXPORTER UN BON EN EXCEL (UTILISE WEB WORKER)
  const exporterBonsExcel = (bon) => {
    console.log("✅ Bouton Excel cliqué pour un bon :", bon);
    if (!bon.interventions || bon.interventions.length === 0) {
      alert("Aucune intervention trouvée pour ce bon à exporter !");
      return;
    }
    setLoadingExcel(true);
    const worker = new Worker(new URL('../workers/bonsExcelWorker.js', import.meta.url));
    worker.postMessage({ type: 'single', bon: bon });

    worker.onmessage = (e) => {
      const blob = e.data;
      if (blob) {
        saveAs(blob, `bon_de_travail_${bon.numero_bon}.xlsx`);
      } else {
        alert('Erreur lors de la génération du fichier Excel.');
      }
      setLoadingExcel(false);
      worker.terminate(); // Terminer le worker après utilisation
    };

    worker.onerror = (error) => {
      console.error('Erreur du Web Worker Excel:', error);
      alert('Erreur lors de la génération du fichier Excel.');
      setLoadingExcel(false);
      worker.terminate();
    };
  };
    
  // EXPORTER TOUS LES BONS EN PDF (UTILISE WEB WORKER)
  const exporterTousPDF = async () => {
    console.log("✅ Bouton Exporter tous en PDF cliqué.");
    if (!bonsFiltres || bonsFiltres.length === 0) {
      alert("Aucun bon à exporter en PDF !");
      return;
    }
    setLoadingPdf(true);
    const worker = new Worker(new URL('../workers/bonsPdfWorker.js', import.meta.url));
    worker.postMessage({ type: 'all', bons: bonsFiltres });

    worker.onmessage = (e) => {
      const blob = e.data;
      if (blob) {
        saveAs(blob, 'bons_travail.pdf');
      } else {
        alert('Erreur lors de la génération du fichier PDF.');
      }
      setLoadingPdf(false);
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error('Erreur du Web Worker PDF:', error);
      alert('Erreur lors de la génération du fichier PDF.');
      setLoadingPdf(false);
      worker.terminate();
    };
  };

  // EXPORTER UN SEUL PDF A CHAQUE LIGNE (UTILISE WEB WORKER)
  const exporterPDF = async (bon) => {
      console.log("✅ Bouton PDF cliqué pour un bon :", bon);
      if (!bon.interventions || bon.interventions.length === 0) {
          alert("Aucune intervention trouvée pour ce bon à exporter en PDF !");
          return;
      }
      setLoadingPdf(true);
      const worker = new Worker(new URL('../workers/bonsPdfWorker.js', import.meta.url));
      worker.postMessage({ type: 'single', bon: bon });

      worker.onmessage = (e) => {
        const blob = e.data;
        if (blob) {
          saveAs(blob, `bon_de_travail_${bon.numero_bon}.pdf`);
        } else {
          alert('Erreur lors de la génération du fichier PDF.');
        }
        setLoadingPdf(false);
        worker.terminate();
      };

      worker.onerror = (error) => {
        console.error('Erreur du Web Worker PDF:', error);
        alert('Erreur lors de la génération du fichier PDF.');
        setLoadingPdf(false);
        worker.terminate();
      };
  };
    
  // EXPORTER TOUS LES BONS EN EXCEL (UTILISE WEB WORKER)
  const exporterTousBonsExcel = () => {
    console.log("✅ Bouton Exporter tous en Excel cliqué.");
    if (!bonsFiltres || bonsFiltres.length === 0) {
      alert("Aucun bon à exporter en Excel !");
      return;
    }
    setLoadingExcel(true);
    const worker = new Worker(new URL('../workers/bonsExcelWorker.js', import.meta.url));
    worker.postMessage({ type: 'all', bons: bonsFiltres });

    worker.onmessage = (e) => {
      const blob = e.data;
      if (blob) {
        saveAs(blob, 'bons_travail.xlsx');
      } else {
        alert('Erreur lors de la génération du fichier Excel.');
      }
      setLoadingExcel(false);
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error('Erreur du Web Worker Excel:', error);
      alert('Erreur lors de la génération du fichier Excel.');
      setLoadingExcel(false);
      worker.terminate();
    };
  };

  if (!canViewBons) {
    return (
      <div className="text-center p-8 text-red-600 font-bold">
        Vous n'avez pas les permissions pour accéder à cette page.
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Bons de travail</h2>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Filtrer par client"
          className="p-2 border rounded"
          value={searchClient}
          onChange={(e) => setSearchClient(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filtrer par statut"
          className="p-2 border rounded"
          value={searchStatut}
          onChange={(e) => setSearchStatut(e.target.value)}
        />
        <input
          type="date"
          className="p-2 border rounded"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />
        <button
          onClick={reinitialiserFiltres}
          className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 transition duration-200"
        >
          Réinitialiser
        </button>

        {/* Boutons export */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={exporterTousPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded ml-5 flex items-center justify-center"
            disabled={loadingPdf}
          >
            {loadingPdf ? <FaSpinner className="animate-spin mr-2" /> : null}
            Exporter tous en PDF
          </button>
          <button
            onClick={exporterTousBonsExcel}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center"
            disabled={loadingExcel}
          >
            {loadingExcel ? <FaSpinner className="animate-spin mr-2" /> : null}
            Exporter tous en Excel
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="max-h-[60vh] overflow-y-auto rounded shadow border">
      <table className="min-w-full bg-white rounded shadow text-sm">
        <thead className="bg-gray-100 text-left sticky top-0 z-10">
          <tr>
            <th className="py-2 px-4">N° BT</th>
            <th className="py-2 px-4">N° Affaire</th>
            <th className="py-2 px-4">Facturation</th>
            <th className="py-2 px-4">Client</th>
            <th className="py-2 px-4">DU</th>
            <th className="py-2 px-4">AU</th>
            <th className="py-2 px-4">Matricule</th>
            <th className="py-2 px-4">Prénoms</th>
            <th className="py-2 px-4">Statut</th>
            <th className="py-2 px-4">Action</th>
          </tr>
        </thead>

        <tbody>
          {bonsFiltres.map((bon) => (
            <tr key={bon.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-4">{bon.numero_bon}</td>
              <td className="py-2 px-4">{bon.affaire}</td>
              {/* Cellule de facturation avec mode édition */}
              <td className="py-2 px-4">
                {editingBonId === bon.id && canEditFacturation ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingFacturationValue}
                      onChange={(e) => setEditingFacturationValue(e.target.value)}
                      className="p-1 border rounded w-24"
                    />
                    <button
                      onClick={() => handleSaveFacturationClick(bon.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Enregistrer"
                    >
                      <FaSave />
                    </button>
                    <button
                      onClick={handleCancelFacturationClick}
                      className="text-red-600 hover:text-red-800"
                      title="Annuler"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>{bon.facturation}</span>
                    {canEditFacturation && (
                      <button
                        onClick={() => handleEditFacturationClick(bon)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Modifier"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td className="py-2 px-4">{bon.client}</td>
              <td className="py-2 px-4">
                {bon.interventions?.map((i) => i.du).join(', ')}
              </td>
              <td className="py-2 px-4">
                {bon.interventions?.map((i) => i.au).join(', ')}
              </td>
              <td className="py-2 px-4">
                {bon.interventions?.map((i) => i.matricule).join(', ')}
              </td>
              <td className="py-2 px-4">
                {bon.interventions?.map((i) => i.prenoms).join(', ')}
              </td>
              <td className="py-2 px-4">
                <span className={`px-2 py-1 rounded text-white text-xs ${bon.est_valide ? 'bg-green-500' : 'bg-red-500'}`}>
                  {bon.est_valide ? 'Validé' : 'Non validé'}
                </span>
              </td>
              <td className="py-2 px-4 space-x-2">
                <button
                  onClick={() => exporterPDF(bon)}
                  className="text-blue-600 hover:underline flex items-center"
                  disabled={loadingPdf}
                >
                  {loadingPdf ? <FaSpinner className="animate-spin mr-1" /> : null}
                  PDF
                </button>
                <button
                  className="text-green-600 hover:underline flex items-center"
                  onClick={() => exporterBonsExcel(bon)}
                  disabled={loadingExcel}
                >
                  {loadingExcel ? <FaSpinner className="animate-spin mr-1" /> : null}
                  Excel
                </button>
              </td>
            </tr>
          ))}
          {bonsFiltres.length === 0 && (
            <tr>
              <td colSpan="10" className="text-center text-gray-500 py-4">
                Aucun bon trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default BonsTravailPage;
