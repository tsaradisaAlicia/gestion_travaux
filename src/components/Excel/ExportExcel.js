import * as XLSX from 'xlsx';

const exporterBonsExcel = (bon) => {
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
  XLSX.writeFile(wb, `${bon.numero_bon}.xlsx`);
};

const exporterTousBonsExcel = (bons) => {
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
  XLSX.writeFile(wb, 'bons_travail.xlsx');
};

export { exporterBonsExcel, exporterTousBonsExcel };
