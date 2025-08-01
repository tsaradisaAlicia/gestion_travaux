import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaTrash, FaEdit } from 'react-icons/fa';
import Papa from 'papaparse'; // Pas utilisé ici, peut être retiré si non nécessaire
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#1c5eecff', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57']; // Plus de couleurs pour les statuts

function ClientsAffairesPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  // États pour le formulaire d'ajout
  const [newAffaireNumero, setNewAffaireNumero] = useState('');
  const [newClientNom, setNewClientNom] = useState('');
  const [newClientAdresse, setNewClientAdresse] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newAffaireStatut, setNewAffaireStatut] = useState('Actif');
  const [newAffaireDesignation, setNewAffaireDesignation] = useState(''); // Ajout de la désignation
  // NOUVEAUX ÉTATS POUR LA MODIFICATION
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAffaireToEdit, setCurrentAffaireToEdit] = useState(null); // Contient l'affaire + client associé

  useEffect(() => {
    fetch('http://localhost:5000/api/clients-affaires')
      .then((res) => res.json())
      .then((data) => {
        console.log('Données reçues de l\'API clients-affaires :', data);
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error('Les données reçues ne sont pas un tableau :', data);
          setClients([]); // S'assurer que 'clients' est un tableau vide en cas d'erreur
        }
      })
      .catch((err) => console.error('Erreur lors du chargement des clients:', err));
  }, []);

  // Filtrer les clients/affaires
  const filteredClients = Array.isArray(clients)
    ? clients.filter((c) =>
        (c.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        c.affaires.some(a => (a.numero || '').toLowerCase().includes(search.toLowerCase())) ||
        c.affaires.some(a => (a.designation || '').toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  // Préparation des données pour les statistiques (basées sur les affaires)
  const allAffaires = [];
  if (Array.isArray(clients)) {
    clients.forEach(client => {
      client.affaires.forEach(affaire => {
        allAffaires.push(affaire);
      });
    });
  }

  const totalAffaires = allAffaires.length;
  
  const affairesParStatut = allAffaires.reduce((acc, affaire) => {
    const statut = affaire.statut || 'Inconnu';
    acc[statut] = (acc[statut] || 0) + 1;
    return acc;
  }, {});

  const dataPie = Object.entries(affairesParStatut).map(([type, value]) => ({
    name: type,
    value,
  }));

  const handleAddClientAffaire = (e) => {
    e.preventDefault();

    const newEntry = {
      numero: newAffaireNumero,
      nom: newClientNom,
      adresse: newClientAdresse,
      contact: newClientContact,
      statut: newAffaireStatut,
      designation: newAffaireDesignation, // Inclure la désignation
    };

    fetch('http://localhost:5000/api/clients-affaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erreur réseau ou réponse non OK');
        }
        return res.json();
      })
      .then((data) => {
        console.log('Réponse POST :', data);
        // Mettre à jour l'état `clients` de manière intelligente
        // Si le client existe, ajouter l'affaire à son tableau d'affaires
        // Sinon, ajouter un nouveau client avec cette affaire
        setClients(prevClients => {
          const existingClientIndex = prevClients.findIndex(c => c.id === data.client.id);
          if (existingClientIndex > -1) {
            // Le client existe, ajouter l'affaire
            const updatedClients = [...prevClients];
            updatedClients[existingClientIndex].affaires.push(data.affaire);
            return updatedClients;
          } else {
            // Nouveau client, créer un nouvel objet client avec l'affaire
            return [...prevClients, {
              id: data.client.id,
              nom: data.client.nom,
              contact: data.client.contact,
              adresse: data.client.adresse,
              affaires: [data.affaire]
            }];
          }
        });
        // Réinitialiser le formulaire
        setNewAffaireNumero('');
        setNewClientNom('');
        setNewClientAdresse('');
        setNewClientContact('');
        setNewAffaireStatut('Actif');
        setNewAffaireDesignation('');
      })
      .catch((err) => console.error('Erreur lors de l\'ajout du client/affaire:', err));
  };

  // NOUVELLE FONCTION: Gérer la suppression d'une affaire
  const handleDeleteAffaire = (affaireId, clientId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affaire ?')) {
      fetch(`http://localhost:5000/api/clients-affaires/affaires/${affaireId}`, {
        method: 'DELETE',
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Erreur lors de la suppression de l\'affaire.');
          }
          return res.json();
        })
        .then(data => {
          console.log('Suppression réussie :', data.message);
          // Mettre à jour l'état de React pour retirer l'affaire supprimée
          setClients(prevClients => {
            return prevClients.map(client => {
              if (client.id === clientId) {
                return {
                  ...client,
                  affaires: client.affaires.filter(aff => aff.id !== affaireId)
                };
              }
              return client;
            }).filter(client => client.affaires.length > 0); // Optionnel: Si un client n'a plus d'affaires, le retirer de la liste
          });
        })
        .catch(err => console.error('Erreur lors de la suppression de l\'affaire:', err));
    }
  };

  // Fonction pour ouvrir le modal de modification
const openEditModal = (affaire, client) => {
  // Stocke toutes les infos nécessaires, y compris les ID et les infos client
  setCurrentAffaireToEdit({
    ...affaire,
    clientId: client.id, // Assurez-vous d'avoir l'ID du client
    clientNom: client.nom,
    clientAdresse: client.adresse,
    clientContact: client.contact
  });
  setShowEditModal(true);
};
// Fonction pour fermer le modal de modification
const closeEditModal = () => {
  setShowEditModal(false);
  setCurrentAffaireToEdit(null); // Réinitialiser l'affaire en cours d'édition
};

// NOUVELLE FONCTION: Gérer la soumission du formulaire de modification
const handleUpdateAffaire = (e) => {
  e.preventDefault();
  if (!currentAffaireToEdit) return;

  const {
    id: affaireId,
    numero,
    designation,
    statut,
    clientId, // Récupérez l'ID du client
    clientNom, clientAdresse, clientContact // Récupérez les infos client
  } = currentAffaireToEdit;

  fetch(`http://localhost:5000/api/clients-affaires/affaires/${affaireId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numero,
      designation,
      statut,
      clientId,        // Envoyer l'ID du client
      clientNom,       // Envoyer le nom du client
      clientAdresse,   // Envoyer l'adresse du client
      clientContact    // Envoyer le contact du client
    }),
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour.');
      }
      return res.json();
    })
    .then(data => {
      console.log('Mise à jour réussie :', data.message);
      // Mettre à jour l'état de React pour refléter les changements
      setClients(prevClients => {
        return prevClients.map(client => {
          // Mettre à jour les infos du client si c'est le client concerné
          if (data.updatedClient && client.id === data.updatedClient.id) {
            client = {
              ...client,
              nom: data.updatedClient.nom,
              adresse: data.updatedClient.adresse,
              contact: data.updatedClient.contact
            };
          }

          // Mettre à jour les affaires de ce client
          const updatedAffaires = client.affaires.map(aff => {
            if (data.updatedAffaire && aff.id === data.updatedAffaire.id) {
              return {
                ...aff,
                numero: data.updatedAffaire.numero,
                designation: data.updatedAffaire.designation,
                statut: data.updatedAffaire.statut,
              };
            }
            return aff;
          });
          return { ...client, affaires: updatedAffaires };
        });
      });
      closeEditModal(); // Fermer le modal après succès
    })
    .catch(err => console.error('Erreur lors de la mise à jour:', err));
};

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Clients / Affaires</h2>

      {/* Filtres */}
      <input
        type="text"
        placeholder="Rechercher par client, affaire ou désignation"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="p-2 border rounded mb-6 w-full max-w-md"
      />

      {/* Bloc: Graphique + Formulaire */}
      <div className="flex flex-col lg:flex-row items-start gap-8 mb-8"> {/* Utiliser flex-col et lg:flex-row pour le responsive */}
        {/* Diagramme */}
        <div className="bg-white p-6 rounded shadow w-full lg:w-[600px] h-[320px] flex-shrink-0">
          <h3 className="text-lg font-semibold mb-2">Répartition des affaires par statut</h3>
          {totalAffaires > 0 ? (
            <PieChart width={500} height={250}> {/* Ajuster la hauteur du graphique */}
              <Pie
                data={dataPie}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          ) : (
            <p className="text-center text-gray-500 py-4">Aucune donnée pour le graphique.</p>
          )}
        </div>

        {/* Formulaire à droite */}
        <div className="bg-white p-6 rounded shadow w-full lg:max-w-md"> {/* Utiliser w-full et lg:max-w-md pour le responsive */}
          <h3 className="text-lg font-semibold mb-4">Ajouter une affaire et/ou un client</h3>
          <form onSubmit={handleAddClientAffaire}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Adapter la grille pour les petits écrans */}
              <input name="numero" placeholder="N° Affaire" className="p-2 border rounded" required value={newAffaireNumero} onChange={(e) => setNewAffaireNumero(e.target.value)} />
              <input name="nom" placeholder="Nom Client" className="p-2 border rounded" required value={newClientNom} onChange={(e) => setNewClientNom(e.target.value)} />
              <input name="designation" placeholder="Désignation Affaire" className="p-2 border rounded col-span-2" value={newAffaireDesignation} onChange={(e) => setNewAffaireDesignation(e.target.value)} />
              <input name="adresse" placeholder="Adresse" className="p-2 border rounded" value={newClientAdresse} onChange={(e) => setNewClientAdresse(e.target.value)} />
              <input name="contact" placeholder="Contact" className="p-2 border rounded" value={newClientContact} onChange={(e) => setNewClientContact(e.target.value)} />
              <select name="statut" className="p-2 border rounded col-span-2" value={newAffaireStatut} onChange={(e) => setNewAffaireStatut(e.target.value)}>
                <option value="Actif">Actif</option>
                <option value="En Cours">En Cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
                <option value="En attente">En attente</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ajouter Affaire/Client</button>
          </form>
        </div>
      </div>

      {/* Statistiques texte */}
      <div className="bg-white p-6 rounded shadow w-full max-w-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Statistiques des Affaires</h3>
        <p>Total affaires : <strong>{totalAffaires}</strong></p>
        <ul className="list-disc ml-6">
          {Object.entries(affairesParStatut).map(([type, count]) => (
            <li key={type}>
              {type} : {count}
            </li>
          ))}
        </ul>
      </div>

      {/* Tableau */}
      <div className="max-h-[60vh] overflow-y-auto rounded shadow border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100 text-left sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2">N° Affaire</th>
              <th className="px-4 py-2">Désignation</th>
              <th className="px-4 py-2">Nom Client</th>
              <th className="px-4 py-2">Adresse</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Statut Affaire</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) =>
                client.affaires.map((affaire) => (
                  <tr key={`${client.id}-${affaire.id}`} className="border-b hover:bg-gray-50"> {/* Clé unique */}
                    <td className="px-4 py-2">{affaire.numero}</td>
                    <td className="px-4 py-2">{affaire.designation}</td>
                    <td className="px-4 py-2">{client.nom}</td>
                    <td className="px-4 py-2">{client.adresse}</td>
                    <td className="px-4 py-2">{client.contact}</td>
                    <td className="px-4 py-2">
                      <span className={`font-semibold ${
                        affaire.statut === 'Actif' ? 'text-green-600' :
                        affaire.statut === 'Terminé' ? 'text-blue-600' :
                        affaire.statut === 'Annulé' ? 'text-red-500' :
                        'text-orange-500' // Pour "En Cours", "En attente", etc.
                      }`}>
                        {affaire.statut}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {/* Bouton Modifier */}
                    <button
                      className="mr-3 text-yellow-600 hover:text-yellow-800"
                      onClick={() => openEditModal(affaire, client)} // Passer l'affaire et le client
                    >
                       <FaEdit className="inline mr-1" /> Modifier
                      </button>
                      {/* Bouton Supprimer */}
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDeleteAffaire(affaire.id, client.id)}
                      >
                        <FaTrash className="inline mr-1" />Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-4">
                  Aucun client ou affaire trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

            {/* NOUVEAU: Modal de Modification */}
      {showEditModal && currentAffaireToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Modifier l'Affaire {currentAffaireToEdit.numero}</h3>
            <form onSubmit={handleUpdateAffaire}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  N° Affaire:
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={currentAffaireToEdit.numero}
                  onChange={(e) => setCurrentAffaireToEdit({ ...currentAffaireToEdit, numero: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Désignation:
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={currentAffaireToEdit.designation}
                  onChange={(e) => setCurrentAffaireToEdit({ ...currentAffaireToEdit, designation: e.target.value })}
                />
              </div>
              {/* Champs du client rendus modifiables */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nom Client:
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={currentAffaireToEdit.clientNom}
                  onChange={(e) => setCurrentAffaireToEdit({ ...currentAffaireToEdit, clientNom: e.target.value })}
                  required // Nom du client souvent requis
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Adresse Client:
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={currentAffaireToEdit.clientAdresse}
                  onChange={(e) => setCurrentAffaireToEdit({ ...currentAffaireToEdit, clientAdresse: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Contact Client:
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={currentAffaireToEdit.clientContact}
                  onChange={(e) => setCurrentAffaireToEdit({ ...currentAffaireToEdit, clientContact: e.target.value })}
                />
              </div>
              {/* Fin des champs du client */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Statut Affaire:
                </label>
                <select
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={currentAffaireToEdit.statut}
                  onChange={(e) => setCurrentAffaireToEdit({ ...currentAffaireToEdit, statut: e.target.value })}
                >
                  <option value="Actif">Actif</option>
                  <option value="En Cours">En Cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Annulé">Annulé</option>
                  <option value="En attente">En attente</option>
                </select>
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
    </div>
  );
}

export default ClientsAffairesPage;