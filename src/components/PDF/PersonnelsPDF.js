// src/components/PDF/PersonnelsPDF.js
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
  
} from '@react-pdf/renderer';

import logoGauche from '../../assets/titre.png';
import logoDroite from '../../assets/marque.png';

const styles = StyleSheet.create({
 page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  table: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#000'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 5
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ccc',
    padding: 5,
  },
  cell: { flex: 1, fontSize: 10 },
});

// Enregistrez une police si vous souhaitez utiliser des polices personnalisées.
// Font.register({ family: 'Open Sans', src: '/fonts/OpenSans-Regular.ttf' });
// Font.register({ family: 'Lato', src: '/fonts/Lato-Regular.ttf' });

// Modifié pour gérer à la fois un personnel unique et un tableau de personnels
const PersonnelsPDF = ({ personnel, personnels }) => {
    // Déterminer quelle source de données utiliser : 'personnels' (tableau) ou 'personnel' (objet unique)
    const dataToRender = personnels || (personnel ? [personnel] : []);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header avec 2 images */}
                <View style={styles.header}>
                    <View>
                      {/* Image gauche */}
                        <Image src={logoGauche} style={{ width: 150, height: 20 }} />

                          <Text>Spécialiste en équipements industriels</Text>
                          <Text>Lot 114 CI Behitsy Ambohimanagakely Antananarivo</Text>
                          <Text>Tél. : 034 60 931 03 - 034 21 310 81</Text>
                          <Text>Email : thermocool@thermocool-mg.com</Text>
                    </View>
                    <View>
                        {/* Image droite */}
                        <Image src={logoDroite} style={{ width: 60, height: 60 }} />
                    </View>
                </View>

                {/* Titre */}
                <Text style={{ marginBottom: 10, fontSize: 14, textAlign: 'center' }}>
                  Liste du personnel
                </Text>

                {/* Tableau */}
                <View style={styles.tableHeader}>
                  <Text style={styles.cell}>Matricule</Text>
                  <Text style={styles.cell}>Nom</Text>
                  <Text style={styles.cell}>Prénoms</Text>
                  <Text style={styles.cell}>Fonction</Text>
                </View>

                {/* Itérer sur le tableau de données déterminé */}
                {dataToRender.map((p, index) => (
                  <View style={styles.tableRow} key={p.id || index}> {/* Utiliser p.id pour la clé si disponible, sinon index */}
                    <Text style={styles.cell}>{p.matricule}</Text>
                    <Text style={styles.cell}>{p.nom}</Text>
                    <Text style={styles.cell}>{p.prenoms}</Text>
                    <Text style={styles.cell}>{p.fonction}</Text>
                  </View>
                ))}
            </Page>
        </Document>
    );
};

export default PersonnelsPDF;