// frontend/src/workers/bonsPdfWorker.js
/* eslint-disable no-restricted-globals */ // Désactive la règle pour 'self'

import React from 'react'; // Nécessaire pour le JSX
import { pdf } from '@react-pdf/renderer';
import BonTravailPDF from '../components/PDF/BonsTravailPDF'; // Assurez-vous que le chemin est correct

self.onmessage = async (e) => {
  const { type, bon, bons } = e.data;

  try {
    let doc;
    if (type === 'single' && bon) {
      doc = <BonTravailPDF bon={bon} />;
    } else if (type === 'all' && bons) {
      doc = <BonTravailPDF bons={bons} />;
    } else {
      throw new Error('Données PDF invalides reçues par le worker.');
    }

    const blob = await pdf(doc).toBlob();
    self.postMessage(blob);
  } catch (error) {
    console.error('Erreur dans le Web Worker PDF des bons:', error);
    self.postMessage(null); // Envoyer null ou un indicateur d'erreur
  }
};