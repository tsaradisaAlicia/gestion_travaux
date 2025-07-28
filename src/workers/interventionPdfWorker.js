// frontend/src/workers/interventionPdfWorker.js
/* eslint-disable no-restricted-globals */ // Désactive la règle pour 'self'

import React from 'react'; // Nécessaire pour le JSX
import { pdf } from '@react-pdf/renderer';
import InterventionPDF from '../components/PDF/InterventionPDF'; // Importe le composant PDF complet

self.onmessage = async (e) => {
  const { type, data } = e.data; // 'data' peut être un objet (single) ou un tableau (all)

  try {
    let doc;
    if (type === 'single' && data) {
      // Si c'est une seule intervention, passez-la via la prop 'intervention'
      doc = <InterventionPDF intervention={data} />;
    } else if (type === 'all' && data) {
      // Si c'est un tableau, passez-le via la prop 'interventions'
      doc = <InterventionPDF interventions={data} />;
    } else {
      throw new Error('Données PDF invalides reçues par le worker.');
    }

    const blob = await pdf(doc).toBlob();
    self.postMessage(blob);
  } catch (error) {
    console.error('Erreur dans le Web Worker PDF:', error);
    self.postMessage(null); // Envoyer null ou un indicateur d'erreur
  }
};