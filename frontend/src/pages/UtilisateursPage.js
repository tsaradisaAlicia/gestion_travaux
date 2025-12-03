import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaTrash, FaEdit } from 'react-icons/fa';
import axios from 'axios';

// 💡 ATTENTION : REMPLACEZ CETTE CHAÎNE PAR L'URL DE VOTRE BACKEND DÉPLOYÉ SUR RENDER
// Exemple : 'https://gestion-paie-backend-xyz.onrender.com'
//const API_BASE_URL = 'https://gestion-travaux-de-thermocool.onrender.com'; 
//const API_URL = process.env.REACT_APP_API_URL;

const UtilisateursPage = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [nouvelUtilisateur, setNouvelUtilisateur] = useState({
    matricule: '',
    nom: '',
    prenoms: '',
    roleId: '',
    motDePasse: '',
    email: '',
  });
  const [utilisateurEnEdition, setUtilisateurEnEdition] = useState(null);

  // Récupérer le rôle de l'utilisateur connecté
  const userRole = localStorage.getItem('userRole');

  // Fonction utilitaire pour obtenir la configuration des headers avec le token
  const getAuthConfig = () => {
    // ✅ CORRECTION : Récupérer le token sous la clé 'token'
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Aucun token JWT trouvé dans le localStorage.');
      // Remplacer par une notification ou une navigation si vous utilisez `useNavigate`
      // alert("Session expirée. Veuillez vous reconnecter."); 
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchUtilisateurs = async () => {
    // Rôles autorisés à voir la page des utilisateurs (ajustez si nécessaire)
    const canView = userRole === 'Admin' || userRole === 'RRH' || userRole === 'Assistante DES DIRECTIONS';
    if (!canView) {
      setUtilisateurs([]);
      return;
    }

    const config = getAuthConfig();
    if (!config) {
        // Remplacer alert() par une solution de modal ou de notification
        console.log("Vous devez être connecté pour voir cette page.");
        setUtilisateurs([]);
        return;
    }

    try {
      // 🛑 LIEN MODIFIÉ : Utilisation de la constante API_BASE_URL
      const response = await axios.get('http://localhost:5000/api/users', config);
      setUtilisateurs(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error.response ? error.response.data : error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Remplacer alert()
        console.log("Votre session a expiré ou vous n'êtes pas autorisé à voir cette page. Veuillez vous reconnecter.");
        localStorage.removeItem('token'); // ✅ Supprimer 'token'
        localStorage.removeItem('userRole');
        // navigate('/login');
      } else {
        // Remplacer alert()
        console.log("Une erreur est survenue lors du chargement des utilisateurs.");
      }
      setUtilisateurs([]);
    }
  };

  const fetchRoles = async () => {
    // Rôles autorisés à récupérer les rôles (ajustez si nécessaire)
    const canFetchRoles = userRole === 'Admin'|| userRole === 'RRH' || userRole === 'Assistante DES DIRECTIONS';
    if (!canFetchRoles) {
        setRolesDisponibles([]);
        return;
    }

    const config = getAuthConfig();
    if (!config) return;

    try {
      // 🛑 LIEN MODIFIÉ : Utilisation de la constante API_BASE_URL
      const response = await axios.get('http://localhost:5000/api/roles', config);
      setRolesDisponibles(response.data);
      if (response.data.length > 0) {
        setNouvelUtilisateur(prev => ({ ...prev, roleId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error.response ? error.response.data : error.message);
      // Remplacer alert()
      console.log('Erreur lors du chargement des rôles : ' + (error.response?.data?.error || error.message));
    }
  };


  useEffect(() => {
    fetchUtilisateurs();
    fetchRoles();
  }, [userRole]); // Recharger si le rôle de l'utilisateur change

  const ajouterUtilisateur = async (e) => {
    e.preventDefault();
    const canAdd = userRole === 'Admin'; // Seul l'Admin peut ajouter
    if (!canAdd) {
        // Remplacer alert()
        console.log("Vous n'avez pas les permissions pour ajouter un utilisateur.");
        return;
    }

    if (!nouvelUtilisateur.matricule || !nouvelUtilisateur.nom || !nouvelUtilisateur.prenoms || !nouvelUtilisateur.roleId || !nouvelUtilisateur.motDePasse) {
      // Remplacer alert()
      console.log('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const config = getAuthConfig();
    if (!config) return;

    try {
      // 🛑 LIEN MODIFIÉ : Utilisation de la constante API_BASE_URL
      await axios.post('http://localhost:5000/api/users', nouvelUtilisateur, config);
      // Remplacer alert()
      console.log('Utilisateur ajouté avec succès !');
      setNouvelUtilisateur({ matricule: '', nom: '', prenoms: '', roleId: rolesDisponibles[0]?.id || '', motDePasse: '', email: '' });
      fetchUtilisateurs();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error.response ? error.response.data : error.message);
      // Remplacer alert()
      console.log('Erreur lors de l\'ajout : ' + (error.response?.data?.error || error.message));
    }
  };

  const modifierUtilisateur = async (e) => {
    e.preventDefault();
    const canEdit = userRole === 'Admin'; // Seul l'Admin peut modifier
    if (!canEdit) {
        // Remplacer alert()
        console.log("Vous n'avez pas les permissions pour modifier un utilisateur.");
        return;
    }

    if (!utilisateurEnEdition.matricule || !utilisateurEnEdition.nom || !utilisateurEnEdition.prenoms || !utilisateurEnEdition.roleId) {
      // Remplacer alert()
      console.log('Veuillez remplir tous les champs obligatoires pour la modification.');
      return;
    }
    const config = getAuthConfig();
    if (!config) return;

    try {
      const dataToUpdate = {
        matricule: utilisateurEnEdition.matricule,
        nom: utilisateurEnEdition.nom,
        prenoms: utilisateurEnEdition.prenoms,
        roleId: utilisateurEnEdition.roleId,
        ...(utilisateurEnEdition.motDePasse && { motDePasse: utilisateurEnEdition.motDePasse })
      };
      // 🛑 LIEN MODIFIÉ : Utilisation de la constante API_BASE_URL
      await axios.put(`http://localhost:5000/api/users/${utilisateurEnEdition.id}`, dataToUpdate, config);
      // Remplacer alert()
      console.log('Utilisateur modifié avec succès !');
      setUtilisateurEnEdition(null);
      fetchUtilisateurs();
    } catch (error) {
      console.error('Erreur lors de la modification de l\'utilisateur:', error.response ? error.response.data : error.message);
      // Remplacer alert()
      console.log('Erreur lors de la modification : ' + (error.response?.data?.error || error.message));
    }
  };

  const supprimerUtilisateur = async (id) => {
    const canDelete = userRole === 'Admin'; // Seul l'Admin peut supprimer
    if (!canDelete) {
        // Remplacer alert()
        console.log("Vous n'avez pas les permissions pour supprimer un utilisateur.");
        return;
    }
    // ⚠️ REMARQUE : `window.confirm` est utilisé ici, mais dans un environnement sans alert/confirm,
    // il faudrait le remplacer par un composant Modal/Dialog.
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      const config = getAuthConfig();
      if (!config) return;

      try {
        // 🛑 LIEN MODIFIÉ : Utilisation de la constante API_BASE_URL
        await axios.delete(`http://localhost:5000/api/users/${id}`, config);
        // Remplacer alert()
        console.log('Utilisateur supprimé avec succès !');
        fetchUtilisateurs();
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error.response ? error.response.data : error.message);
        // Remplacer alert()
        console.log('Erreur lors de la suppression : ' + (error.response?.data?.error || error.message));
      }
    }
  };

  // Vérifier si l'utilisateur connecté est autorisé à voir cette page (pour le rendu conditionnel)
  const canViewPage = userRole === 'Admin' || userRole === 'RRH' || userRole === 'Assistante DES DIRECTIONS';
  const canEditOrDelete = userRole === 'Admin'; // Seul l'Admin peut modifier/supprimer

  if (!canViewPage) {
    return (
      <div className="text-center p-8 text-red-600 font-bold">
        Vous n'avez pas les permissions pour accéder à cette page.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h1>

      {canEditOrDelete && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Ajouter un nouvel utilisateur</h2>
          <form onSubmit={ajouterUtilisateur} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="matricule">
                Matricule:
              </label>
              <input
                type="text"
                id="matricule"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={nouvelUtilisateur.matricule}
                onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, matricule: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nom">
                Nom:
              </label>
              <input
                type="text"
                id="nom"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={nouvelUtilisateur.nom}
                onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, nom: e.target.value })}
                required
              />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prenoms">
                  Prénoms:
              </label>
                <input
                  type="text"
                  id="prenoms"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={nouvelUtilisateur.prenoms}
                  onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, prenoms: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="motDePasse">
                  Mot de Passe:
                </label>
                <input
                  type="password"
                  id="motDePasse"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={nouvelUtilisateur.motDePasse}
                  onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, motDePasse: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Rôle:
                </label>
                <select
                  id="role"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={nouvelUtilisateur.roleId}
                  onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, roleId: e.target.value })}
                  required
                >
                  {rolesDisponibles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  <FaUserPlus className="inline mr-2" /> Ajouter Utilisateur
                </button>
              </div>
            </form>
          </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Liste des Utilisateurs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Matricule</th>
                <th className="py-3 px-6 text-left">Nom</th>
                <th className="py-3 px-6 text-left">Prénoms</th>
                <th className="py-3 px-6 text-left">Rôle</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {utilisateurs.map((u) => (
                <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{u.matricule}</td>
                  <td className="py-3 px-6 text-left">{u.nom}</td>
                  <td className="py-3 px-6 text-left">{u.prenoms}</td>
                  <td className="py-3 px-6 text-left">{u.roleName}</td>
                  <td className="py-3 px-6 text-center">
                    {canEditOrDelete && (
                      <>
                        <button
                          onClick={() => setUtilisateurEnEdition({ ...u, motDePasse: '' })}
                          className="mr-3 text-yellow-600 hover:text-yellow-800"
                        >
                          <FaEdit className="inline mr-1" /> Modifier
                        </button>
                        <button
                          onClick={() => supprimerUtilisateur(u.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash className="inline mr-1" /> Supprimer
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {utilisateurs.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {utilisateurEnEdition && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Modifier l'utilisateur</h2>
            <form onSubmit={modifierUtilisateur} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editMatricule">
                  Matricule:
                </label>
                <input
                  type="text"
                  id="editMatricule"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={utilisateurEnEdition.matricule}
                  onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, matricule: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editNom">
                  Nom:
                </label>
                <input
                  type="text"
                  id="editNom"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={utilisateurEnEdition.nom}
                  onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, nom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editPrenoms">
                  Prénoms:
                </label>
                <input
                  type="text"
                  id="editPrenoms"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={utilisateurEnEdition.prenoms}
                  onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, prenoms: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editMotDePasse">
                  Nouveau Mot de Passe (laissez vide pour ne pas changer):
                </label>
                <input
                  type="password"
                  id="editMotDePasse"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={utilisateurEnEdition.motDePasse}
                  onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, motDePasse: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editRole">
                  Rôle:
                </label>
                <select
                  id="editRole"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={utilisateurEnEdition.roleId}
                  onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, roleId: e.target.value })}
                  required
                >
                  {rolesDisponibles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUtilisateurEnEdition(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilisateursPage;