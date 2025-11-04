// frontend/src/workers/bonsExcelWorker.js
/* eslint-disable no-restricted-globals */ // Désactive la règle pour 'self'

import * as XLSX from 'xlsx';

// Fonction utilitaire pour l'exportation d'un seul bon en Excel (adaptée de ExportExcel.js)
const exporterBonExcelLogic = (bon) => {
  const rows = bon.interventions.map(interv => ({
    'N° BT': bon.numero_bon,
    'N° Affaire': bon.affaire,
    'Facturation': bon.facturation,
    'DU': interv.du,
    'AU': interv.au,
    'Matricule': interv.matricule,
    'Prénom': interv.prenoms,
    'Binôme': interv.binome,
    'Client': bon.client,
    'Désignation': bon.designation_travaux,
    'Date reçu': bon.date_recu,
    'Heure total': bon.heure_total,
    'Statut': bon.est_valide ? 'Validé' : 'Non validé'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BonTravail');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Fonction utilitaire pour l'exportation de tous les bons en Excel (adaptée de ExportExcel.js)
const exporterTousBonsExcelLogic = (bons) => {
  const allRows = [];

  bons.forEach(bon => {
    bon.interventions.forEach(interv => {
      allRows.push({
        'N° BT': bon.numero_bon,
        'N° Affaire': bon.affaire,
        'Facturation': bon.facturation,
        'DU': interv.du,
        'AU': interv.au,
        'Matricule': interv.matricule,
        'Prénom': interv.prenoms,
        'Binôme': interv.binome,
        'Client': bon.client,
        'Désignation': bon.designation_travaux,
        'Date reçu': bon.date_recu,
        'Heure total': bon.heure_total,
        'Statut': bon.est_valide ? 'Validé' : 'Non validé'       
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(allRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BonsTravail');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};


self.onmessage = (e) => {
  const { type, bon, bons } = e.data;

  try {
    let blob;
    if (type === 'single' && bon) {
      blob = exporterBonExcelLogic(bon);
    } else if (type === 'all' && bons) {
      blob = exporterTousBonsExcelLogic(bons);
    } else {
      throw new Error('Données Excel invalides reçues par le worker.');
    }
    self.postMessage(blob);
  } catch (error) {
    console.error('Erreur dans le Web Worker Excel des bons:', error);
    self.postMessage(null);
  }
};
