import React, { useEffect, useState } from 'react';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#1c5eecff', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

function ClientsAffairesPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [newAffaireNumero, setNewAffaireNumero] = useState('');
  const [newClientNom, setNewClientNom] = useState('');
  const [newClientAdresse, setNewClientAdresse] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newAffaireStatut, setNewAffaireStatut] = useState('Actif');
  const [newAffaireDesignation, setNewAffaireDesignation] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAffaireToEdit, setCurrentAffaireToEdit] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/clients-affaires')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data);
        else setClients([]);
      })
      .catch(console.error);
  }, []);

  const filteredClients = Array.isArray(clients)
    ? clients.filter(c =>
        (c.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        c.affaires.some(a => (a.numero || '').toLowerCase().includes(search.toLowerCase())) ||
        c.affaires.some(a => (a.designation || '').toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const allAffaires = filteredClients.flatMap(c => c.affaires);
  const dataPie = Object.entries(
    allAffaires.reduce((acc, a) => {
      acc[a.statut] = (acc[a.statut] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));
  const totalAffaires = allAffaires.length;

  const handleAddClientAffaire = async (e) => {
    e.preventDefault();
    const newEntry = {
      numero: newAffaireNumero,
      nom: newClientNom,
      adresse: newClientAdresse,
      contact: newClientContact,
      statut: newAffaireStatut,
      designation: newAffaireDesignation,
    };
    try {
      const res = await fetch('http://localhost:5000/api/clients-affaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      if (!res.ok) throw new Error('Erreur POST');
      const data = await res.json();
      setClients(prev => {
        const idx = prev.findIndex(c => c.id === data.client.id);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx].affaires.push(data.affaire);
          return copy;
        }
        return [...prev, { ...data.client, affaires: [data.affaire] }];
      });
      setNewAffaireNumero(''); setNewClientNom(''); setNewClientAdresse('');
      setNewClientContact(''); setNewAffaireStatut('Actif'); setNewAffaireDesignation('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAffaire = async (affaireId, clientId) => {
    if (!window.confirm('Êtes-vous sûr ?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/clients-affaires/affaires/${affaireId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur DELETE');
      await res.json();
      setClients(prev =>
        prev
          .map(c => c.id === clientId
            ? { ...c, affaires: c.affaires.filter(a => a.id !== affaireId) }
            : c
          )
          .filter(c => c.affaires.length > 0)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (aff, client) => {
    setCurrentAffaireToEdit({
      ...aff,
      clientId: client.id,
      clientNom: client.nom,
      clientAdresse: client.adresse,
      clientContact: client.contact,
    });
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentAffaireToEdit(null);
  };

  const handleUpdateAffaire = async (e) => {
    e.preventDefault();
    if (!currentAffaireToEdit) return;
    const {
      id, numero, designation, statut,
      clientId, clientNom, clientAdresse, clientContact
    } = currentAffaireToEdit;
    try {
      const res = await fetch(`http://localhost:5000/api/clients-affaires/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero, designation, statut,
          clientId, nom: clientNom, adresse: clientAdresse, contact: clientContact
        }),
      });
      if (!res.ok) throw new Error('Erreur PUT composite');
      const data = await res.json();
      setClients(prev => prev.map(c => {
        if (c.id === data.updatedClient.id) {
          return {
            id: c.id,
            nom: data.updatedClient.nom,
            adresse: data.updatedClient.adresse,
            contact: data.updatedClient.contact,
            affaires: c.affaires.map(a =>
              a.id === data.updatedAffaire.id
                ? { ...a, numero: data.updatedAffaire.numero, designation: data.updatedAffaire.designation, statut: data.updatedAffaire.statut }
                : a
            )
          };
        }
        return c;
      }));
      closeEditModal();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Clients / Affaires</h2>
      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="p-2 border rounded mb-6 w-full max-w-md"
      />

      <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
        <div className="bg-white p-6 rounded shadow w-full lg:w-[600px] h-[320px]">
          <h3 className="text-lg font-semibold mb-2">Répartition par statut</h3>
          {totalAffaires > 0 ? (
            <PieChart width={500} height={250}>
              <Pie data={dataPie} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                {dataPie.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          ) : (
            <p className="text-center text-gray-500 py-4">Aucune donnée pour le graphique.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded shadow w-full lg:max-w-md">
          <h3 className="text-lg font-semibold mb-4">Ajouter une affaire/client</h3>
          <form onSubmit={handleAddClientAffaire}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required name="numero" placeholder="N° Affaire" className="p-2 border rounded" value={newAffaireNumero} onChange={e => setNewAffaireNumero(e.target.value)} />
              <input required name="nom" placeholder="Nom Client" className="p-2 border rounded" value={newClientNom} onChange={e => setNewClientNom(e.target.value)} />
              <input name="designation" placeholder="Désignation" className="p-2 border rounded col-span-2" value={newAffaireDesignation} onChange={e => setNewAffaireDesignation(e.target.value)} />
              <input name="adresse" placeholder="Adresse" className="p-2 border rounded" value={newClientAdresse} onChange={e => setNewClientAdresse(e.target.value)} />
              <input name="contact" placeholder="Contact" className="p-2 border rounded" value={newClientContact} onChange={e => setNewClientContact(e.target.value)} />
              <select name="statut" className="p-2 border rounded col-span-2" value={newAffaireStatut} onChange={e => setNewAffaireStatut(e.target.value)}>
                <option>Actif</option><option>En Cours</option><option>Terminé</option><option>Annulé</option><option>En attente</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ajouter</button>
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow w-full max-w-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Statistiques des affaires</h3>
        <p>Total affaires : <strong>{totalAffaires}</strong></p>
        <ul className="list-disc ml-6">
          {dataPie.map(d => <li key={d.name}>{d.name} : {d.value}</li>)}
        </ul>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded shadow border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100 text-left sticky top-0">
            <tr>
              <th>N° Affaire</th><th>Désignation</th><th>Nom Client</th><th>Adresse</th><th>Contact</th><th>Statut</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? filteredClients.map(c =>
              c.affaires.map(a => (
                <tr key={`${c.id}-${a.id}`} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{a.numero}</td>
                  <td className="px-4 py-2">{a.designation}</td>
                  <td className="px-4 py-2">{c.nom}</td>
                  <td className="px-4 py-2">{c.adresse}</td>
                  <td className="px-4 py-2">{c.contact}</td>
                  <td className="px-4 py-2">
                    <span className={`font-semibold ${
                      a.statut === 'Actif' ? 'text-green-600' :
                      a.statut === 'Terminé' ? 'text-blue-600' :
                      a.statut === 'Annulé' ? 'text-red-500' :
                      'text-orange-500'
                    }`}>{a.statut}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button className="mr-3 text-yellow-600 hover:text-yellow-800" onClick={() => openEditModal(a, c)}><FaEdit className="inline mr-1"/>Modifier</button>
                    <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteAffaire(a.id, c.id)}><FaTrash className="inline mr-1"/>Supprimer</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="text-center text-gray-500 py-4">Aucun client ou affaire trouvé.</td></tr>
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