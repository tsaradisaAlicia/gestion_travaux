import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoGauche from '../../assets/titre.png'; // Assurez-vous que c'est l'image "Thermocool Technology"
import logoDroite from '../../assets/marque.png'; // Assurez-vous que c'est l'image du logo "2T"

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        position: 'relative', // Nécessaire si on utilise un positionnement absolu pour certains éléments
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Aligne les éléments en haut
        marginBottom: 10,
    },
    companyInfo: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '60%', // Ajustez la largeur si nécessaire pour le texte de l'entreprise
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    companyDetails: {
        fontSize: 8,
        lineHeight: 1.2,
    },
    logoRightContainer: {
        width: 60, // Largeur fixe pour le conteneur du logo de droite
        height: 60, // Hauteur fixe
        borderWidth: 1,
        borderColor: '#000',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoRight: {
        width: '100%',
        height: '100%',
        objectFit: 'contain', // Assure que l'image s'adapte à la boîte bordée
    },
    titleBoxContainer: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
        marginVertical: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    bonNumber: {
        fontSize: 12, // Légèrement plus petit pour le numéro de bon
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 5,
        alignItems: 'flex-end', // Aligne le texte en bas pour l'effet de soulignement
    },
    infoLabel: {
        width: '25%',
        fontWeight: 'bold',
    },
    infoValue: {
        width: '75%',
        borderBottomWidth: 1, // Effet de soulignement
        borderColor: '#000',
        paddingBottom: 2, // Espace entre le texte et le soulignement
    },
    table: {
        display: "table",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#000',
        marginVertical: 10,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableColHeader: {
        width: "20%", // 5 colonnes, donc 100% / 5 = 20%
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f0f0f0',
        padding: 5,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tableCol: {
        width: "20%", // 5 colonnes
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
        textAlign: 'center',
    },
    sectionBox: {
        borderWidth: 1,
        borderColor: '#000',
        marginTop: 10,
    },
    sectionBoxTitle: {
        backgroundColor: '#f0f0f0', // Fond gris clair pour le titre
        padding: 5,
        textAlign: 'center',
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    sectionBoxContent: {
        padding: 5,
    },
    sectionBoxRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    sectionBoxLabel: {
        width: '25%',
        fontWeight: 'bold',
    },
    sectionBoxValue: {
        width: '75%',
        borderBottomWidth: 1,
        borderColor: '#000',
        paddingBottom: 2,
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Distribue l'espace uniformément
        marginTop: 30,
        width: '100%',
    },
    signatureText: {
        fontSize: 9,
        borderTopWidth: 1, // Ligne de signature au-dessus du texte
        borderColor: '#000',
        paddingTop: 5,
        textAlign: 'center',
        width: '30%', // Ajustez la largeur pour chaque signature
    }
});

const BonPage = ({ bon }) => (
    <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
            <View style={styles.companyInfo}>
                {/* Image gauche (Thermocool Technology) */}
                <Image src={logoGauche} style={{ width: 150, height: 20, marginBottom: 5 }} />
                
                <Text style={styles.companyDetails}>Spécialiste en équipements industriels</Text>
                <Text style={styles.companyDetails}>Lot 114 CI Behitsy Ambohimanagakely Antananarivo</Text>
                <Text style={styles.companyDetails}>Tél. : 034 60 931 03 - 034 21 310 81</Text>
                <Text style={styles.companyDetails}>Email : thermocool@thermocool-mg.com</Text>
            </View>
            <View style={styles.logoRightContainer}>
                {/* Image droite (logo 2T) */}
                <Image src={logoDroite} style={styles.logoRight} />
            </View>
        </View>

        {/* Boîte de titre "BON DE TRAVAIL" */}
        <View style={styles.titleBoxContainer}>
            <Text style={styles.titleText}>BON DE TRAVAIL</Text>
            <Text style={styles.bonNumber}>N° {bon.numero_bon}/2T</Text>
        </View>

        {/* Informations générales */}
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>N° Affaires :</Text>
            <Text style={styles.infoValue}>{bon.affaire}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client :</Text>
            <Text style={styles.infoValue}>{bon.client}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Désignation travaux :</Text>
            <Text style={styles.infoValue}>{bon.designation_travaux}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Adresse d’intervention :</Text>
            <Text style={styles.infoValue}>{bon.adresse}</Text>
        </View>

        {/* Tableau d’interventions */}
        <View style={styles.table}>
            <View style={styles.tableRow}>
                <Text style={styles.tableColHeader}>DATE</Text>
                <Text style={styles.tableColHeader}>Nom intervenants</Text>
                <Text style={styles.tableColHeader}>Heure début</Text>
                <Text style={styles.tableColHeader}>Heure fin</Text>
                <Text style={styles.tableColHeader}>Total heures</Text>
            </View>
            {/* Boucle sur les interventions, ou affiche des lignes vides si aucune intervention pour garder la structure */}
            {bon.interventions && bon.interventions.length > 0 ? (
                bon.interventions.map((i, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.tableCol}>{i.du}</Text>
                        <Text style={styles.tableCol}>{i.prenoms}{i.binome ? `, ${i.binome}` : ''}</Text>
                        <Text style={styles.tableCol}>{i.heure_debut}</Text>
                        <Text style={styles.tableCol}>{i.heure_fin}</Text>
                        <Text style={styles.tableCol}>{bon.heure_total || '-'}</Text>
                    </View>
                ))
            ) : (
                // Lignes de remplissage pour correspondre à la mise en page de l'image (5 lignes)
                Array.from({ length: 5 }).map((_, index) => (
                    <View key={`placeholder-${index}`} style={styles.tableRow}>
                        <Text style={styles.tableCol}></Text>
                        <Text style={styles.tableCol}></Text>
                        <Text style={styles.tableCol}></Text>
                        <Text style={styles.tableCol}></Text>
                        <Text style={styles.tableCol}></Text>
                    </View>
                ))
            )}
        </View>

        {/* OBSERVATIONS GÉNÉRALES */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>DETAILS DESCRIPTIONS</Text>
            <View style={styles.sectionBoxContent}>
                <Text>..............................................................................................................................................</Text>
                <Text>..............................................................................................................................................</Text>
            </View>
        </View>


        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>OBSERVATIONS GÉNÉRALES</Text>
            <View style={styles.sectionBoxContent}>
                <Text>..............................................................................................................................................</Text>
                <Text>..............................................................................................................................................</Text>
            </View>
        </View>

        {/* HSSE - TOOL BOX */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>HSSE - TOOL BOX</Text>
            <View style={styles.sectionBoxContent}>
                <View style={styles.sectionBoxRow}>
                    <Text style={styles.sectionBoxLabel}>Details :</Text>
                    <Text style={styles.sectionBoxValue}>.......................................................................</Text>
                </View>
                <View style={styles.sectionBoxRow}>
                    <Text style={styles.sectionBoxLabel}>Responsable :</Text>
                    <Text style={styles.sectionBoxValue}>.................................................</Text>
                </View>
            </View>
        </View>

        {/* RAPPORT D’INCIDENT */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>RAPPORT D’INCIDENT</Text>
            <View style={styles.sectionBoxContent}>
                <Text>..............................................................................................................................................</Text>
                <Text>..............................................................................................................................................</Text>
            </View>
        </View>

        {/* SUIVI DES DÉCHETS (ENVIRONNEMENT) */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>ENVIRONNEMENT</Text> {/* Le titre est "ENVIRONNEMENT" sur l'image */}
            <View style={styles.sectionBoxContent}>
                <View style={styles.sectionBoxRow}>
                    <Text style={styles.sectionBoxLabel}>Details :</Text>
                    <Text style={styles.sectionBoxValue}>.......................................................................</Text>
                </View>
                <View style={styles.sectionBoxRow}>
                    <Text style={styles.sectionBoxLabel}>Responsable :</Text>
                    <Text style={styles.sectionBoxValue}>.................................................</Text>
                </View>
            </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureRow}>
            <Text style={styles.signatureText}>Signature Technicien</Text>
            <Text style={styles.signatureText}>Responsable</Text>
            <Text style={styles.signatureText}>Client</Text>
        </View>
    </Page>
);

const BonsTravailPDF = ({ bon, bons }) => (
    <Document>
        {bon && <BonPage bon={bon} />}
        {bons && Array.isArray(bons) && bons.map((b) => <BonPage key={b.numero_bon} bon={b} />)}
        {!bon && (!bons || !bons.length) && (
            <Page size="A4" style={styles.page}>
                <Text>Aucun bon à afficher</Text>
            </Page>
        )}
    </Document>
);

export default BonsTravailPDF;
