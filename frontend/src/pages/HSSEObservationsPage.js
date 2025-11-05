import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaPlus, FaCheckCircle, FaTimesCircle, FaTrashAlt, FaEdit } from 'react-icons/fa';
import axios from 'axios';

// VEUILLEZ REMPLACER CETTE ADRESSE SI VOTRE DOMAINE RENDER CHANGE !
const API_BASE_URL = "https://gestion-travaux-de-thermocool.onrender.com";

const couleurs = {
  Hygiène: '#34D399',
  Santé: '#60A5FA',
  Sécurité: '#f5ca0bff',
  Environnement: '#10B981',
};

const HSSEObservationsPage = () => {
  const [observations, setObservations] = useState([]);
  const [nouvelleObservation, setNouvelleObservation] = useState({
    date: '',
    observateur: '',
    type: '',
    description: '',
    gravite: '',
    statut: 'Non traitée',
    chantier: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentObservationToEdit, setCurrentObservationToEdit] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [observationToDeleteId, setObservationToDeleteId] = useState(null);

  const userRole = localStorage.getItem('userRole');
  // ✅ Rôles mis à jour pour correspondre à la liste plus large du backend pour la vue
  const canViewObservations = ['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH'].includes(userRole);
  const canManageObservations = ['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE'].includes(userRole);

  // Fonction utilitaire pour obtenir la configuration des headers avec le token
  const getAuthConfig = () => {
    // ✅ CORRECTION : Récupérer le token sous la clé 'token'
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

  const fetchObservations = async () => {
    if (!canViewObservations) {
      setObservations([]);
      return;
    }

    const config = getAuthConfig();
    if (!config) {
        alert("Vous devez être connecté pour voir cette page.");
        setObservations([]);
        return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/observations`, config);
      if (Array.isArray(response.data)) {
        setObservations(response.data);
      } else {
        console.error('Les données reçues ne sont pas un tableau :', response.data);
        setObservations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des observations:', error.response ? error.response.data : error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert("Votre session a expiré ou vous n'êtes pas autorisé à voir cette page. Veuillez vous reconnecter.");
        localStorage.removeItem('token'); // ✅ Supprimer 'token'
        localStorage.removeItem('userRole');
        // navigate('/login');
      } else {
        alert("Une erreur est survenue lors du chargement des observations.");
      }
      setObservations([]);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, [userRole, canViewObservations]);

  const ajouterObservation = async () => {
    if (!canManageObservations) {
      alert("Vous n'avez pas les permissions pour ajouter une observation.");
      return;
    }
    if (
      !nouvelleObservation.date ||
      !nouvelleObservation.observateur ||
      !nouvelleObservation.type ||
      !nouvelleObservation.description ||
      !nouvelleObservation.gravite
    ) {
      alert('Veuillez remplir tous les champs obligatoires (date, observateur, type, description, gravité).');
      return;
    }

    const config = getAuthConfig();
    if (!config) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/observations`, nouvelleObservation, config);
      console.log('Observation ajoutée :', response.data);
      setObservations(prev => [response.data, ...prev]);
      setNouvelleObservation({
        date: '',
        observateur: '',
        type: '',
        description: '',
        gravite: '',
        statut: 'Non traitée',
        chantier: '',
      });
      alert('Observation ajoutée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'observation:', error.response ? error.response.data : error.message);
      alert('Erreur lors de l\'ajout : ' + (error.response?.data?.error || error.message));
    }
  };

  const supprimerObservation = (id) => {
    if (!canManageObservations) {
      alert("Vous n'avez pas les permissions pour supprimer une observation.");
      return;
    }
    setObservationToDeleteId(id);
    setShowConfirmDeleteModal(true);
  };

  const confirmDelete = async () => {
    const config = getAuthConfig();
    if (!config) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/observations/${observationToDeleteId}`, config);
      console.log('Suppression réussie :', response.data.message);
      setObservations(prev => prev.filter(obs => obs.id !== observationToDeleteId));
      alert('Observation supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'observation:', error.response ? error.response.data : error.message);
      alert('Erreur lors de la suppression : ' + (error.response?.data?.error || error.message));
    } finally {
      setShowConfirmDeleteModal(false);
      setObservationToDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDeleteModal(false);
    setObservationToDeleteId(null);
  };

  const openEditModal = (observation) => {
    if (!canManageObservations) {
      alert("Vous n'avez pas les permissions pour modifier une observation.");
      return;
    }
    setCurrentObservationToEdit({ ...observation });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentObservationToEdit(null);
  };

  const handleUpdateObservation = async (e) => {
    e.preventDefault();
    if (!canManageObservations) {
      alert("Vous n'avez pas les permissions pour modifier une observation.");
      return;
    }
    if (!currentObservationToEdit) return;

    const { id, ...updatedFields } = currentObservationToEdit;

    const config = getAuthConfig();
    if (!config) return;

    try {
      const response = await axios.put(`${API_BASE_URL}/api/observations/${id}`, updatedFields, config);
      console.log('Mise à jour réussie :', response.data.message);
      setObservations(prev => prev.map(obs => obs.id === id ? currentObservationToEdit : obs));
      closeEditModal();
      alert('Observation modifiée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'observation:', error.response ? error.response.data : error.message);
      alert('Erreur lors de la mise à jour : ' + (error.response?.data?.error || error.message));
    }
  };

  const changerStatut = async (id, currentStatut) => {
    if (!canManageObservations) {
      alert("Vous n'avez pas les permissions pour changer le statut d'une observation.");
      return;
    }
    const newStatut = currentStatut === 'Traitée' ? 'Non traitée' : 'Traitée';

    const config = getAuthConfig();
    if (!config) return;

    try {
      const response = await axios.put(`${API_BASE_URL}/api/observations/${id}`, { statut: newStatut }, config);
      console.log('Statut mis à jour :', response.data.message);
      setObservations(prev => prev.map(obs =>
        obs.id === id ? { ...obs, statut: newStatut } : obs
      ));
      alert('Statut mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error.response ? error.response.data : error.message);
      alert('Erreur lors du changement de statut : ' + (error.response?.data?.error || error.message));
    }
  };

  const statsTypes = observations.reduce((acc, o) => {
    acc[o.type] = (acc[o.type] || 0) + 1;
    return acc;
  }, {});

  const donneesPie = Object.entries(statsTypes).map(([type, valeur]) => ({
    name: type,
    value: valeur,
  }));

  if (!canViewObservations) {
    return (
      <div className="text-center p-8 text-red-600 font-bold">
        Vous n'avez pas les permissions pour accéder à cette page.
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Observations HSE</h2>
      <div className="grid md:grid-cols-2 gap-8 mb-6">
        {canManageObservations && (
          <div className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Nouvelle observation</h3>
            <div className="grid grid-cols-1 gap-3">
              <input type="date" className="p-2 border rounded" value={nouvelleObservation.date} onChange={(e) => setNouvelleObservation({ ...nouvelleObservation, date: e.target.value })} required />
              <input type="text" placeholder="Observateur" className="p-2 border rounded" value={nouvelleObservation.observateur} onChange={(e) => setNouvelleObservation({ ...nouvelleObservation, observateur: e.target.value })} required />
              <select className="p-2 border rounded" value={nouvelleObservation.type} onChange={(e) => setNouvelleObservation({ ...nouvelleObservation, type: e.target.value })} required>
                <option value="">-- Type HSSE --</option>
                <option>Hygiène</option>
                <option>Santé</option>
                <option>Sécurité</option>
                <option>Environnement</option>
                <option>Tous</option> {/* Cette option n'est pas gérée dans le backend pour l'ajout, à revoir si nécessaire */}
              </select>

              <textarea placeholder="Description" className="p-2 border rounded" value={nouvelleObservation.description} onChange={(e) => setNouvelleObservation({ ...nouvelleObservation, description: e.target.value })} required />
              <select className="p-2 border rounded" value={nouvelleObservation.gravite} onChange={(e) => setNouvelleObservation({ ...nouvelleObservation, gravite: e.target.value })} required>
                <option value="">-- Gravité --</option>
                <option>Mineure</option>
                <option>Majeure</option>
                <option>Critique</option>
              </select>
              <input type="text" placeholder="Chantier / Lieu" className="p-2 border rounded" value={nouvelleObservation.chantier} onChange={(e) => setNouvelleObservation({ ...nouvelleObservation, chantier: e.target.value })} />
              <button onClick={ajouterObservation} className="bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2">
                <FaPlus /> Ajouter
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Statistiques par type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={donneesPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {donneesPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={couleurs[entry.name] || '#ccc'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded shadow border">
        <table className="min-w-full text-sm bg-white rounded shadow">
          <thead className="bg-gray-100 text-left sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Observateur</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Gravité</th>
               <th className="px-4 py-2">Chnatier/Lieu</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {observations.length > 0 ? (
              observations.map((obs) => (
                <tr key={obs.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{obs.date}</td>
                  <td className="px-4 py-2">{obs.observateur}</td>
                  <td className="px-4 py-2">{obs.type}</td>
                  <td className="px-4 py-2">{obs.description}</td>
                  <td className="px-4 py-2">{obs.gravite}</td>
                  <td className="px-4 py-2">{obs.chantier}</td>
                  <td className="px-4 py-2">{obs.statut === 'Traitée' ? <span className="text-green-600 font-bold">Traitée</span> : <span className="text-red-600 font-bold">Non traitée</span>}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {canManageObservations && (
                      <>
                        <button
                          onClick={() => changerStatut(obs.id, obs.statut)}
                          className={`px-2 py-1 rounded text-xs text-white ${obs.statut !== 'Traitée' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                        >
                          {obs.statut !== 'Traitée' ? 'Marquer comme traitée' : 'Marquer non traitée'}
                        </button>
                        <button
                          onClick={() => openEditModal(obs)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs ml-2 hover:bg-yellow-600"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => supprimerObservation(obs.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs ml-2 hover:bg-red-600"
                        >
                          <FaTrashAlt />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-4">
                  Aucune observation trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canManageObservations && showEditModal && currentObservationToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Modifier l'Observation</h3>
            <form onSubmit={handleUpdateObservation}>
              <div className="grid grid-cols-1 gap-3">
                <label className="block text-gray-700 text-sm font-bold mb-1">Date:</label>
                <input type="date" className="p-2 border rounded" value={currentObservationToEdit.date} onChange={(e) => setCurrentObservationToEdit({ ...currentObservationToEdit, date: e.target.value })} required />

                <label className="block text-gray-700 text-sm font-bold mb-1">Observateur:</label>
                <input type="text" placeholder="Observateur" className="p-2 border rounded" value={currentObservationToEdit.observateur} onChange={(e) => setCurrentObservationToEdit({ ...currentObservationToEdit, observateur: e.target.value })} required />

                <label className="block text-gray-700 text-sm font-bold mb-1">Type:</label>
                <select className="p-2 border rounded" value={currentObservationToEdit.type} onChange={(e) => setCurrentObservationToEdit({ ...currentObservationToEdit, type: e.target.value })} required>
                  <option value="">-- Type HSSE --</option>
                  <option>Hygiène</option>
                  <option>Santé</option>
                  <option>Sécurité</option>
                  <option>Environnement</option>
                </select>

                <label className="block text-gray-700 text-sm font-bold mb-1">Description:</label>
                <textarea placeholder="Description" className="p-2 border rounded" value={currentObservationToEdit.description} onChange={(e) => setCurrentObservationToEdit({ ...currentObservationToEdit, description: e.target.value })} required />

                <label className="block text-gray-700 text-sm font-bold mb-1">Gravité:</label>
                <select className="p-2 border rounded" value={currentObservationToEdit.gravite} onChange={(e) => setCurrentObservationToEdit({ ...currentObservationToEdit, gravite: e.target.value })} required>
                  <option value="">-- Gravité --</option>
                  <option>Mineure</option>
                  <option>Majeure</option>
                  <option>Critique</option>
                </select>

                <label className="block text-gray-700 text-sm font-bold mb-1">Statut:</label>
                <select className="p-2 border rounded" value={currentObservationToEdit.statut} onChange={(e) => setCurrentObservationToEdit({ ...currentObservationToEdit, statut: e.target.value })} required>
                  <option>Non traitée</option>
                  <option>Traitée</option>
                </select>

                <label className="block text-gray-700 text-sm font-bold mb-1">Chantier / Lieu:</label>
                <input type="text" placeholder="Chantier / Lieu" className="p-2 border rounded" value={currentObservationToEdit.chantier} onChange={(e) => setCurrentObservationToEdit({ ...currentObservationToEdit, chantier: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Confirmer la suppression</h2>
            <p className="mb-6">Êtes-vous sûr de vouloir supprimer cette observation ? Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HSSEObservationsPage;