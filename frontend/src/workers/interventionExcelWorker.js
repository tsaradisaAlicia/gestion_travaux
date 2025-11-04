// frontend/src/workers/interventionExcelWorker.js
/* eslint-disable no-restricted-globals */ // Désactive la règle pour 'self'

import * as XLSX from 'xlsx';

// Fonction utilitaire pour l'exportation Excel d'une seule intervention
const exporterSingleInterventionExcelLogic = (intervention) => {
    const dataToExport = [{
        'Numéro Bon': intervention.numero_bon,
        'Date': intervention.du,
        'Intervenants': `${intervention.prenoms}${intervention.binome ? `, ${intervention.binome}` : ''}`,
        'Heure Début': intervention.heure_debut,
        'Heure Fin': intervention.heure_fin,
        'Désignation Travaux': intervention.designation,
        'Description Détail': intervention.description,
        'Client': intervention.client,
        'Adresse Intervention': intervention.adresse,
        'Observations': intervention.observations,
    }];
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Intervention');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Fonction utilitaire pour l'exportation Excel de toutes les interventions
const exporterAllInterventionsExcelLogic = (interventions) => {
    const dataToExport = interventions.map(i => ({
        'Numéro Bon': i.numero_bon,
        'Date': i.du,
        'Intervenants': `${i.prenoms}${i.binome ? `, ${i.binome}` : ''}`,
        'Heure Début': i.heure_debut,
        'Heure Fin': i.heure_fin,
        'Désignation Travaux': i.designation,
        'Description Détail': i.description,
        'Client': i.client,
        'Adresse Intervention': i.adresse,
        'Observations': i.observations,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Interventions');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};


self.onmessage = (e) => {
  const { type, data } = e.data;

  try {
    let blob;
    if (type === 'single' && data) {
      blob = exporterSingleInterventionExcelLogic(data);
    } else if (type === 'all' && data) {
      blob = exporterAllInterventionsExcelLogic(data);
    } else {
      throw new Error('Données Excel invalides reçues par le worker.');
    }
    self.postMessage(blob);
  } catch (error) {
    console.error('Erreur dans le Web Worker Excel:', error);
    self.postMessage(null);
  }
};
