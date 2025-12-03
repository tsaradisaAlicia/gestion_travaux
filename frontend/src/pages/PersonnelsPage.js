import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { StyleSheet, pdf } from '@react-pdf/renderer';

import PersonnelsPDF from '../components/PDF/PersonnelsPDF';
import axios from 'axios';

// 💡 URL DE BASE DE L'API (À VÉRIFIER SI C'EST LA BONNE ADRESSE ACTUELLE)
//const API_BASE_URL = 'https://gestion-travaux-de-thermocool.onrender.com';
//const API_URL = process.env.REACT_APP_API_URL;

StyleSheet.create({
  page: { padding: 20 },
  section: { marginBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  text: { fontSize: 12 },
});

function PersonnelsPage() {
  const [personnels, setPersonnels] = useState([]);
  const [searchPrenom, setSearchPrenom] = useState('');
  const [searchNom, setSearchNom] = useState('');
  const [searchMatricule, setSearchMatricule] = useState('');
  const [searchFonction, setSearchFonction] = useState('');

  const [formVisible, setFormVisible] = useState(false);
  const [nouveaux, setNouveaux] = useState([
    { matricule: '', nom: '', prenoms: '', fonction: '' }
  ]);

  const [personnelEdit, setPersonnelEdit] = useState(null);

  const userRole = localStorage.getItem('userRole');
  // ✅ Rôles mis à jour pour correspondre à la liste plus large du backend pour la vue
  const canViewPersonnel = ['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH'].includes(userRole);
  const canAddEditDeletePersonnel = ['Admin', 'RRH'].includes(userRole);

  const chargerPersonnels = async () => {
    if (!canViewPersonnel) {
      setPersonnels([]);
      return;
    }
    try {
      // ✅ CORRECTION : Récupérer le token sous la clé 'token'
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get('http://localhost:5000/api/personnels', config);
      const uniques = Array.from(
        new Map(response.data.map((p) => [p.matricule, p])).values()
      );
      setPersonnels(uniques);
    } catch (error) {
      console.error('Erreur lors du chargement des personnels:', error.response ? error.response.data : error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert("Votre session a expiré ou vous n'êtes pas autorisé à voir cette page. Veuillez vous reconnecter.");
        localStorage.removeItem('token'); // ✅ Supprimer 'token'
        localStorage.removeItem('userRole');
        // navigate('/login');
      } else {
        alert("Une erreur est survenue lors du chargement des personnels.");
      }
    }
  };  

  useEffect(() => {
    chargerPersonnels();
  }, [userRole, canViewPersonnel, chargerPersonnels]);


  const reinitialiserFiltres = () => {
    setSearchPrenom('');
    setSearchNom('');
    setSearchMatricule('');
    setSearchFonction('');
  };

  const personnelsFiltres = personnels.filter((p) => {
    const nomMatch = (p.nom || '').toLowerCase().includes(searchNom.toLowerCase());
    const prenomMatch = (p.prenoms || '').toLowerCase().includes(searchPrenom.toLowerCase());
    const matriculeMatch = (p.matricule?.toString() || '').toLowerCase().includes(searchMatricule.toLowerCase());
    const fonctionMatch = (p.fonction || '').toLowerCase().includes(searchFonction.toLowerCase());
    return nomMatch && prenomMatch && matriculeMatch && fonctionMatch;
  });


  const ajouterFormulaire = () => {
    setNouveaux([...nouveaux, { matricule: '', nom: '', prenoms: '', fonction: '' }]);
  };

  const ajouterPersonnelAPI = async (personnelData) => {
    if (!canAddEditDeletePersonnel) {
      alert("Vous n'avez pas les permissions pour ajouter un personnel.");
      return null;
    }
    try {
      // ✅ CORRECTION : Récupérer le token sous la clé 'token'
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      };
      const response = await axios.post('http://localhost:5000/api/personnels', personnelData, config);

      alert('Personnel ajouté avec succès !');
      return response.data;
    } catch (error) {
      console.error('Erreur API ajout personnel:', error.response ? error.response.data : error.message);
      alert('Échec de l’ajout : ' + (error.response?.data?.error || error.message));
      return null;
    }
  };
/*
 async (index) => {
    const p = nouveaux[index];
    if (!p.matricule || !p.nom || !p.prenoms || !p.fonction) {
      alert("Veuillez remplir tous les champs du personnel.");
      return;
    }

    if (personnels.some(existingP => existingP.matricule === p.matricule)) {
      alert("Matricule déjà existant !");
      return;
    }

    const confirmation = window.confirm("Confirmer l'enregistrement de ce personnel ?");
    if (!confirmation) return;

    const result = await ajouterPersonnelAPI(p);
    if (result) {
      await chargerPersonnels();
      const temp = [...nouveaux];
      temp[index] = { matricule: '', nom: '', prenoms: '', fonction: '' };
      setNouveaux(temp);
    } else {
      // Le message d'erreur est déjà géré dans ajouterPersonnelAPI
    }
  };

  async () => {
    const incomplets = nouveaux.some(
      (p) => !p.matricule || !p.nom || !p.prenoms || !p.fonction
    );
    if (incomplets) {
      alert('Tous les champs de tous les formulaires doivent être remplis.');
      return;
    }

    const nouveauxValidés = nouveaux.filter(
      (n) => !personnels.some((p) => p.matricule === n.matricule)
    );

    if (nouveauxValidés.length === 0) {
      alert("Tous les matricules existent déjà ou aucun nouveau personnel valide à ajouter !");
      return;
    }

    const confirmation = window.confirm("Enregistrer tous les personnels ajoutés ?");
    if (!confirmation) return;

    let successCount = 0;
    for (const p of nouveauxValidés) {
      const result = await ajouterPersonnelAPI(p);
      if (result) {
        successCount++;
      }
    }

    if (successCount > 0) {
      alert(`${successCount} personnel(s) ajouté(s) avec succès !`);
      await chargerPersonnels();
      setNouveaux([{ matricule: '', nom: '', prenoms: '', fonction: '' }]);
      setFormVisible(false);
    } else {
      // Le message d'erreur est déjà géré dans ajouterPersonnelAPI
    }
  };
*/
  const enregistrerModification = async () => {
    if (!canAddEditDeletePersonnel) {
        alert("Vous n'avez pas les permissions pour modifier un personnel.");
        return;
    }
    if (!personnelEdit.matricule || !personnelEdit.nom || !personnelEdit.prenoms || !personnelEdit.fonction) {
        alert('Veuillez remplir tous les champs obligatoires pour la modification.');
        return;
    }
    try {
      // ✅ CORRECTION : Récupérer le token sous la clé 'token'
      const token = localStorage.getItem('token');
      const config = {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      };
      const response = await axios.put(`http://localhost:5000/api/personnels/${personnelEdit.id}`, personnelEdit, config);

      if (response.status !== 200) {
        throw new Error('Erreur lors de la mise à jour');
      }

      alert('Personnel modifié avec succès !');
      await chargerPersonnels();
      setPersonnelEdit(null);
    } catch (error) {
      console.error('Erreur lors de la modification du personnel:', error.response ? error.response.data : error.message);
      alert('Échec de l’enregistrement : ' + (error.response?.data?.error || error.message));
    }
  };

  const supprimerPersonnel = async (id) => {
    if (!canAddEditDeletePersonnel) {
        alert("Vous n'avez pas les permissions pour supprimer un personnel.");
        return;
    }
    if (window.confirm("Supprimer ce personnel ?")) {
      try {
        // ✅ CORRECTION : Récupérer le token sous la clé 'token'
        const token = localStorage.getItem('token');
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        const response = await axios.delete(`http://localhost:5000/api/personnels/${id}`, config);

        if (response.status !== 200) {
            throw new Error("Erreur suppression");
        }

        alert('Personnel supprimé avec succès !');
        await chargerPersonnels();
      } catch (error) {
          console.error("Erreur lors de la suppression :", error.response ? error.response.data : error.message);
          alert("Échec de la suppression : " + (error.response?.data?.error || error.message));
      }
    }
  };

  const exporterExcel = (personnel) => {
    const ws = XLSX.utils.json_to_sheet([personnel]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personnel');
    XLSX.writeFile(wb, `personnel_${personnel.matricule}.xlsx`);
  };

  const exporterTousExcel = () => {
    const ws = XLSX.utils.json_to_sheet(personnelsFiltres);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personnels');
    XLSX.writeFile(wb, 'personnels.xlsx');
  };

  const exporterTousPDF = async () => {
    const doc = <PersonnelsPDF personnels={personnelsFiltres} />;
    const blob = await pdf(doc).toBlob();
    saveAs(blob, 'personnels.pdf');
  };

  const exporterPDF = async (personnel) => {
    const doc = <PersonnelsPDF personnel={personnel} />;
    const blob = await pdf(doc).toBlob();
    saveAs(blob, `personnel_${personnel.matricule}.pdf`);
  };

  if (!canViewPersonnel) {
    return (
      <div className="text-center p-8 text-red-600 font-bold">
        Vous n'avez pas les permissions pour accéder à cette page.
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Liste des personnels</h2>
      <div className="flex flex-wrap gap-4 mb-6">
        <input type="text" placeholder="Filtrer par prénoms" className="p-2 border rounded" value={searchPrenom} onChange={(e) => setSearchPrenom(e.target.value)} />
        <input type="text" placeholder="Filtrer par matricule" className="p-2 border rounded" value={searchMatricule} onChange={(e) => setSearchMatricule(e.target.value)} />
        <input type="text" placeholder="Filtrer par fonction" className="p-2 border rounded" value={searchFonction} onChange={(e) => setSearchFonction(e.target.value)} />
        <button onClick={reinitialiserFiltres} className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 transition duration-200" > Réinitialiser</button>
        {canAddEditDeletePersonnel && (
          <button onClick={() => setFormVisible(true)} className="bg-red-600 text-white px-4 py-2 rounded">
            Ajouter
          </button>
        )}
        <button onClick={exporterTousPDF} className="bg-blue-600 text-white px-4 py-2 rounded">Exporter tous en PDF</button>
        <button onClick={exporterTousExcel} className="bg-green-600 text-white px-4 py-2 rounded">Exporter tous en Excel</button>
      </div>

    
            {canAddEditDeletePersonnel && formVisible && (
        <div className="bg-gray-50 p-4 mb-4 rounded shadow">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Ajouter des personnels</h3>

          {nouveaux.map((nouv, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <input
                type="text"
                placeholder="Matricule"
                className="p-2 border rounded"
                value={nouv.matricule}
                onChange={(e) => {
                  const temp = [...nouveaux];
                  temp[index].matricule = e.target.value;
                  setNouveaux(temp);
                }}
              />
              <input
                type="text"
                placeholder="Nom"
                className="p-2 border rounded"
                value={nouv.nom}
                onChange={(e) => {
                  const temp = [...nouveaux];
                  temp[index].nom = e.target.value;
                  setNouveaux(temp);
                }}
              />
              <input
                type="text"
                placeholder="Prénom"
                className="p-2 border rounded"
                value={nouv.prenoms}
                onChange={(e) => {
                  const temp = [...nouveaux];
                  temp[index].prenoms = e.target.value;
                  setNouveaux(temp);
                }}
              />
              <input
                type="text"
                placeholder="Fonction"
                className="p-2 border rounded"
                value={nouv.fonction}
                onChange={(e) => {
                  const temp = [...nouveaux];
                  temp[index].fonction = e.target.value;
                  setNouveaux(temp);
                }}
              />

              <button
                className="bg-green-600 text-white px-3 py-2 rounded"
                onClick={async () => {
                  const confirmer = window.confirm("Confirmer l'enregistrement de ce personnel ?");
                  if (confirmer) {
                    const p = nouveaux[index];
                    if (p.matricule && p.nom && p.prenoms && p.fonction) {
                      const resultat = await ajouterPersonnelAPI(p);
                      if (resultat) {
                        setPersonnels([...personnels, resultat]);

                        const copie = [...nouveaux];
                        copie[index] = { matricule: '', nom: '', prenoms: '', fonction: '' };
                        setNouveaux(copie);
                      } else {
                        alert("Échec de l'ajout.");
                      }
                    } else {
                      alert("Veuillez remplir tous les champs.");
                    }
                  }
                }}
              >
                Enregistrer
              </button>
            </div>
            ))}

        <div className="flex gap-4 mt-4">
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={ajouterFormulaire}
          >
            Ajouter un nouveau
          </button>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={async () => {
          const confirmer = window.confirm("Enregistrer tous les personnels ajoutés ?");
          if (confirmer) {
            const valides = nouveaux.filter(n => n.matricule && n.nom && n.prenoms && n.fonction);
            if (valides.length === 0) {
              alert("Aucun formulaire complet à enregistrer.");
              return;
            }

            const ajoutes = [];
            for (const p of valides) {
              const resultat = await ajouterPersonnelAPI(p);
              if (resultat) {
                ajoutes.push(resultat);
              }
            }

            if (ajoutes.length > 0) {
              setPersonnels([...personnels, ...ajoutes]);
              setNouveaux([{ matricule: '', nom: '', prenoms: '', fonction: '' }]);
              setFormVisible(false);
            } else {
              alert("Aucun personnel n'a pu être ajouté.");
            }
          }
        }}

      >
        Enregistrer tous
      </button>

      <button
        className="bg-gray-500 text-white px-4 py-2 rounded"
        onClick={() => {
            const confirmer = window.confirm("Voulez-vous vraiment annuler l'ajout ?");
            if (confirmer) {
                setFormVisible(false);
                setNouveaux([{ matricule: '', nom: '', prenoms: '', fonction: '' }]);
            }
            }}
      >
        Annuler
      </button>
    </div>
  </div>
)}  
      <div className="max-h-[60vh] overflow-y-auto rounded shadow border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100 text-left sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2">Matricule</th>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Prénoms</th>
              <th className="px-4 py-2">Fonction</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
          {personnelsFiltres.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              {personnelEdit && personnelEdit.id === p.id ? (
                <>
                  <td className="px-4 py-2">
                    <input
                      className="p-1 border rounded w-full"
                      value={personnelEdit.matricule}
                      onChange={(e) => setPersonnelEdit({ ...personnelEdit, matricule: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="p-1 border rounded w-full"
                      value={personnelEdit.nom}
                      onChange={(e) => setPersonnelEdit({ ...personnelEdit, nom: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="p-1 border rounded w-full"
                      value={personnelEdit.prenoms}
                      onChange={(e) => setPersonnelEdit({ ...personnelEdit, prenoms: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="p-1 border rounded w-full"
                      value={personnelEdit.fonction}
                      onChange={(e) => setPersonnelEdit({ ...personnelEdit, fonction: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={enregistrerModification}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setPersonnelEdit(null)}
                      className="bg-gray-400 text-white px-2 py-1 rounded text-sm"
                    >
                      Annuler
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2">{p.matricule}</td>
                  <td className="px-4 py-2">{p.nom}</td>
                  <td className="px-4 py-2">{p.prenoms}</td>
                  <td className="px-4 py-2">{p.fonction}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => setPersonnelEdit(p)}
                      className="text-yellow-600 hover:underline"
                    >
                      <FaEdit className="inline mr-1" />Modifier
                    </button>
                    <button
                      onClick={() => supprimerPersonnel(p.id)}
                      className="text-red-600 hover:underline"
                    >
                      <FaTrash className="inline mr-1" />Supprimer
                    </button>
                    <button
                      onClick={() => exporterPDF(p)}
                      className="text-blue-600 hover:underline"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => exporterExcel(p)}
                      className="text-green-600 hover:underline"
                    >
                      Excel
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}

          {personnelsFiltres.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 py-4">Aucun personnel trouvé.</td>
            </tr>
          )}
        </tbody>
        
      </table>
      </div>
    </div>
  );
}

export default PersonnelsPage;
