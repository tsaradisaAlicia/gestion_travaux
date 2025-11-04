// InterventionsPage.js
import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InterventionPDF from '../components/PDF/InterventionPDF'; // Assurez-vous que ce composant est à jour avec les champs nécessaires
import { FaSpinner, FaUndo } from 'react-icons/fa'; // Import du spinner
import axios from 'axios'; // Import d'axios pour les requêtes authentifiées
import { useNavigate } from 'react-router-dom';

// PDF Styles (inchangés, mais déplacés ici pour la visibilité du worker)
const styles = StyleSheet.create({
    page: { padding: 20 },
    section: { marginBottom: 10 },
    title: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
    text: { fontSize: 12 },
    table: {
        display: "table",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        marginBottom: 10,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row"
    },
    tableColHeader: {
        width: "14%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        backgroundColor: '#f0f0f0',
        padding: 5,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tableCol: {
        width: "14%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        padding: 5,
        textAlign: 'center',
    },
});

// Document PDF complet pour l'exportation de toutes les interventions filtrées (inchangé)
// Ce composant sera utilisé par le Web Worker
/*
const FullInterventionDocument = ({ data }) => (
    <Document>
        {data.length > 0 ? (
            data.map((interv, idx) => (
                <Page key={idx} size="A4" style={styles.page}>
                    <View style={styles.section}><Text style={styles.title}>Bon de Travail N° {interv.numero_bon}</Text></View>
                    <View style={styles.section}><Text style={styles.text}>Client : {interv.client}</Text></View>
                    <View style={styles.section}><Text style={styles.text}>Adresse d'intervention : {interv.adresse}</Text></View>
                    <View style={styles.section}><Text style={styles.text}>Désignation des travaux : {interv.designation}</Text></View>
                    <View style={styles.section}><Text style={styles.text}>Intervention du {interv.du} de {interv.heure_debut} à {interv.heure_fin}</Text></View>
                    <View style={styles.section}><Text style={styles.text}>Intervenants : {interv.prenoms}{interv.binome ? `, ${interv.binome}` : ''}</Text></View>
                    <View style={styles.section}><Text style={styles.text}>Description détaillée : {interv.description}</Text></View>
                    <View style={styles.section}><Text style={styles.text}>Observations : {interv.observations}</Text></View>
                </Page>
            ))
        ) : (
            <Page size="A4" style={styles.page}>
                <Text>Aucune intervention à afficher.</Text>
            </Page>
        )}
    </Document>
);
*/


function InterventionsPage() {
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchDate, setSearchDate] = useState('');
    const [searchNom, setSearchNom] = useState(''); // Pour prenoms ou binome

    //Pour navigation de signalement
    const navigate = useNavigate();

    // Nouveaux états pour gérer les chargements des exports
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [loadingExcel, setLoadingExcel] = useState(false);

    const userRole = localStorage.getItem('userRole');
    const canViewInterventions = ['Admin', 'RESPONSABLE TECHNIQUE', 'CHARGE D\'ETUDE', 'Assistante DES DIRECTIONS', 'RRH', 'Superviseur', 'Technicien', 'Observateur'].includes(userRole);

    // Fonction utilitaire pour obtenir la configuration des headers avec le token
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

    // ✅ Fonction pour récupérer les données depuis l'API
    useEffect(() => {
        const fetchInterventions = async () => {
            if (!canViewInterventions) {
                setInterventions([]);
                setLoading(false);
                return;
            }
            const config = getAuthConfig();
            if (!config) {
                alert("Vous devez être connecté pour voir cette page.");
                setInterventions([]);
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/api/interventions', config);
                setInterventions(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération des interventions:", err.response ? err.response.data : err.message);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    alert("Votre session a expiré ou vous n'êtes pas autorisé à voir cette page. Veuillez vous reconnecter.");
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userMatricule');
                    localStorage.removeItem('userName');
                } else {
                    setError("Impossible de charger les interventions. Veuillez vérifier le serveur.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInterventions();
    }, [userRole, canViewInterventions]);

    // ✅ Logique de filtrage mise à jour pour les nouvelles propriétés
    const interventionsFiltres = interventions.filter((i) => {
        let interventionDateFormatee = '';
        if (i.du) {
            const [jour, mois, annee] = i.du.split('/');
            interventionDateFormatee = `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`;
        }
        
        const dateMatch = searchDate ? interventionDateFormatee === searchDate : true;
        const nomMatch = searchNom ?
            (i.prenoms && i.prenoms.toLowerCase().includes(searchNom.toLowerCase())) ||
            (i.binome && i.binome.toLowerCase().includes(searchNom.toLowerCase()))
            : true;
        return dateMatch && nomMatch;
    });

    // ✅ Nouvelle fonction pour réinitialiser les filtres
    const handleResetFilters = () => {
        setSearchDate('');
        setSearchNom('');
    };

    // ✅ Exportation PDF globale (toutes les interventions filtrées) - UTILISE WEB WORKER
    const exporterPDF = async () => {
        if (interventionsFiltres.length === 0) {
            alert("Aucune intervention à exporter en PDF.");
            return;
        }
        setLoadingPdf(true);
        const worker = new Worker(new URL('../workers/interventionPdfWorker.js', import.meta.url));
        worker.postMessage({ type: 'all', data: interventionsFiltres });

        worker.onmessage = (e) => {
            const blob = e.data;
            if (blob) {
                saveAs(blob, 'interventions_globales.pdf');
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

    // ✅ Exportation Excel globale (toutes les interventions filtrées) - UTILISE WEB WORKER
    const exporterExcel = () => {
        if (interventionsFiltres.length === 0) {
            alert("Aucune intervention à exporter en Excel.");
            return;
        }
        setLoadingExcel(true);
        const worker = new Worker(new URL('../workers/interventionExcelWorker.js', import.meta.url));
        worker.postMessage({ type: 'all', data: interventionsFiltres });

        worker.onmessage = (e) => {
            const blob = e.data;
            if (blob) {
                saveAs(blob, 'interventions_globales.xlsx');
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

    // ✅ Exportation Excel pour une seule intervention - UTILISE WEB WORKER
    const exporterInterventionExcel = (intervention) => {
        setLoadingExcel(true);
        const worker = new Worker(new URL('../workers/interventionExcelWorker.js', import.meta.url));
        worker.postMessage({ type: 'single', data: intervention });

        worker.onmessage = (e) => {
            const blob = e.data;
            if (blob) {
                saveAs(blob, `intervention_${intervention.id}.xlsx`);
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

    // ✅ NOUVELLE FONCTION POUR LE RAPPEL
    const handleSignalerRappel = (interventionOrigine) => {
        // Cette fonction prépare les données et redirige vers la page de création d'une nouvelle intervention
        console.log("Préparation d'un rappel pour l'intervention ID:", interventionOrigine.id);
        
        // On navigue vers la page de création d'intervention
        // En utilisant 'state', on passe l'ID de l'intervention d'origine et un flag 'isRappel'.
        navigate('/nouvelle-intervention', { // ⚠️ ASSUREZ-VOUS QUE C'EST LA BONNE ROUTE
            state: {
                isRappel: true,
                interventionOrigineId: interventionOrigine.id, // L'ID à envoyer au backend
                clientNom: interventionOrigine.client,      // Pour pré-remplir
                designation: interventionOrigine.designation // Pour pré-remplir
            }
        });
    };

    if (!canViewInterventions) {
        return (
            <div className="text-center p-8 text-red-600 font-bold">
                Vous n'avez pas les permissions pour accéder à cette page.
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-600">Chargement des interventions...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">Erreur: {error}</div>;
    }

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Interventions</h2>

            {/* Filtres et boutons d'exportation */}
            <div className="flex flex-wrap gap-4 mb-6">
                <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="p-2 border rounded"
                />
                <input
                    type="text"
                    placeholder="Filtrer par nom d'intervenant"
                    value={searchNom}
                    onChange={(e) => setSearchNom(e.target.value)}
                    className="p-2 border rounded"
                />
                <button
                    onClick={handleResetFilters}
                    className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 transition duration-200"
                >
                    Réinitialiser
                </button>
                <button
                    onClick={exporterPDF}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                    disabled={loadingPdf}
                >
                    {loadingPdf ? <FaSpinner className="animate-spin mr-2" /> : null}
                    Exporter tous en PDF
                </button>
                <button
                    onClick={exporterExcel}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition duration-200 flex items-center justify-center"
                    disabled={loadingExcel}
                >
                    {loadingExcel ? <FaSpinner className="animate-spin mr-2" /> : null}
                    Exporter tous en Excel
                </button>
            </div>

            {/* Tableau des interventions */}
            <div className="max-h-[60vh] overflow-y-auto rounded shadow border">
                <table className="min-w-full bg-white rounded shadow text-sm">
                    <thead className="bg-gray-100 text-left sticky top-0 z-10">
                        <tr>
                            <th className="py-2 px-4">N° BT</th>
                            <th className="py-2 px-4">Date</th>
                            <th className="py-2 px-4">Intervenants</th>
                            <th className="py-2 px-4">Heures</th>
                            <th className="py-2 px-4">Désignation</th>
                            <th className="py-2 px-4">Description</th>
                            <th className="py-2 px-4">Client</th>
                            <th className="py-2 px-4">Adresse</th>
                            <th className="py-2 px-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interventionsFiltres.length > 0 ? (
                            interventionsFiltres.map((i) => (
                                <tr key={i.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-4">{i.numero_bon}</td>
                                    <td className="py-2 px-4">{i.du}</td>
                                    <td className="py-2 px-4">{i.prenoms}{i.binome ? `, ${i.binome}` : ''}</td>
                                    <td className="py-2 px-4">{i.heure_debut} - {i.heure_fin}</td>
                                    <td className="py-2 px-4">{i.designation}</td>
                                    <td className="py-2 px-4">{i.description}</td>
                                    <td className="py-2 px-4">{i.client}</td>
                                    <td className="py-2 px-4">{i.adresse}</td>
                                    <td className="py-2 px-4 space-x-2">
                                        {/* Utilisation de InterventionPDF pour l'exportation individuelle */}
                                        <PDFDownloadLink
                                            document={<InterventionPDF intervention={i} />}
                                            fileName={`intervention_${i.id}.pdf`}
                                            className="text-blue-600 hover:underline flex items-center"
                                            // Le PDFDownloadLink gère son propre état de chargement, pas besoin de loadingPdf ici
                                        >
                                            {({ loading }) => (loading ? <><FaSpinner className="animate-spin mr-1" />Chargement...</> : 'PDF')}
                                        </PDFDownloadLink>
                                        <button
                                            className="text-green-600 hover:underline flex items-center"
                                            onClick={() => exporterInterventionExcel(i)}
                                            disabled={loadingExcel}
                                        >
                                            {loadingExcel ? <FaSpinner className="animate-spin mr-1" /> : null}
                                            Excel
                                        </button>
                                    {/* 👇 LE BOUTON DE SIGNALEMENT DE RAPPEL 👇 */}
                                        <button
                                            onClick={() => handleSignalerRappel(i)}
                                            title="Signaler un appel à ré-intervention (Rappel)"
                                            className="text-orange-500 hover:text-orange-700 ml-2 flex items-center"
                                        >
                                            <FaUndo /> 
                                        </button>
                                        
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="py-4 px-4 text-center text-gray-500">
                                    {loading ? "Chargement..." : "Aucune intervention trouvée."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InterventionsPage;
