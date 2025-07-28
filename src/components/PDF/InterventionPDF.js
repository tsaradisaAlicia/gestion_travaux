// src/components/PDF/InterventionPDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoGauche from '../../assets/titre.png'; // Assurez-vous que c'est l'image "Thermocool Technology"
import logoDroite from '../../assets/marque.png'; // Assurez-vous que c'est l'image du logo "2T"

// Styles adaptés de BonsTravailPDF.js pour la fiche d'intervention
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    companyInfo: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '60%',
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
        width: 60,
        height: 60,
        borderWidth: 1,
        borderColor: '#000',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoRight: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
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
    interventionNumber: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 5,
        alignItems: 'flex-end',
    },
    infoLabel: {
        width: '35%',
        fontWeight: 'bold',
    },
    infoValue: {
        width: '65%',
        borderBottomWidth: 1,
        borderColor: '#000',
        paddingBottom: 2,
    },
    sectionBox: {
        borderWidth: 1,
        borderColor: '#000',
        marginTop: 10,
    },
    sectionBoxTitle: {
        backgroundColor: '#f0f0f0',
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
        justifyContent: 'space-around',
        marginTop: 30,
        width: '100%',
    },
    signatureText: {
        fontSize: 9,
        borderTopWidth: 1,
        borderColor: '#000',
        paddingTop: 5,
        textAlign: 'center',
        width: '30%',
    },
    emptyLine: {
        borderBottomWidth: 1,
        borderColor: '#000',
        marginBottom: 5,
        paddingBottom: 2,
        height: 12,
    },
    emptyLineSmall: {
        borderBottomWidth: 1,
        borderColor: '#000',
        marginBottom: 3,
        paddingBottom: 1,
        height: 10,
    }
});

// Fonction utilitaire pour formater la date
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
        return dateString; // Retourne la chaîne originale si non parsable
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const InterventionPage = ({ intervention }) => (
    <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
            <View style={styles.companyInfo}>
                <Image src={logoGauche} style={{ width: 150, height: 20, marginBottom: 5 }} />
                <Text style={styles.companyDetails}>Spécialiste en équipements industriels</Text>
                <Text style={styles.companyDetails}>Lot 114 CI Behitsy Ambohimanagakely Antananarivo</Text>
                <Text style={styles.companyDetails}>Tél. : 034 60 931 03 - 034 21 310 81</Text>
                <Text style={styles.companyDetails}>Email : thermocool@thermocool-mg.com</Text>
            </View>
            <View style={styles.logoRightContainer}>
                <Image src={logoDroite} style={styles.logoRight} />
            </View>
        </View>

        {/* Boîte de titre "FICHE D'INTERVENTION" */}
        <View style={styles.titleBoxContainer}>
            <Text style={styles.titleText}>FICHE D'INTERVENTION</Text>
            <Text style={styles.interventionNumber}>N° {intervention.id}</Text>
        </View>

        {/* Informations générales de l'intervention */}
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date d'intervention :</Text>
            <Text style={styles.infoValue}>{formatDate(intervention.du)}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lieu :</Text>
            <Text style={styles.infoValue}>{intervention.lieu}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Désignation :</Text>
            <Text style={styles.infoValue}>{intervention.designation}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description :</Text>
            <Text style={styles.infoValue}>{intervention.description}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Intervenant(s) :</Text>
            <Text style={styles.infoValue}>
                {intervention.prenoms}{intervention.binome ? `, ${intervention.binome}` : ''}
            </Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Heure début :</Text>
            <Text style={styles.infoValue}>{intervention.heure_debut}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Heure fin :</Text>
            <Text style={styles.infoValue}>{intervention.heure_fin}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total heures :</Text>
            <Text style={styles.infoValue}>{intervention.heure_total || '0'}</Text>
        </View>

        {/* OBSERVATIONS TECHNIQUES */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>OBSERVATIONS TECHNIQUES</Text>
            <View style={styles.sectionBoxContent}>
                <Text style={styles.emptyLine}></Text>
                <Text style={styles.emptyLine}></Text>
                <Text style={styles.emptyLine}></Text>
            </View>
        </View>

        {/* MATERIEL UTILISE */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>MATERIEL UTILISE</Text>
            <View style={styles.sectionBoxContent}>
                <Text style={styles.emptyLine}></Text>
                <Text style={styles.emptyLine}></Text>
                <Text style={styles.emptyLine}></Text>
            </View>
        </View>

        {/* RECOMMANDATIONS */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>RECOMMANDATIONS</Text>
            <View style={styles.sectionBoxContent}>
                <Text style={styles.emptyLine}></Text>
                <Text style={styles.emptyLine}></Text>
                <Text style={styles.emptyLine}></Text>
            </View>
        </View>

        {/* ETAT DU MATERIEL APRES INTERVENTION */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>ETAT DU MATERIEL APRES INTERVENTION</Text>
            <View style={styles.sectionBoxContent}>
                <Text style={styles.emptyLine}></Text>
                <Text style={styles.emptyLine}></Text>
            </View>
        </View>

        {/* HSSE */}
        <View style={styles.sectionBox}>
            <Text style={styles.sectionBoxTitle}>HSSE</Text>
            <View style={styles.sectionBoxContent}>
                <View style={styles.sectionBoxRow}>
                    <Text style={styles.sectionBoxLabel}>Type Observation :</Text>
                    <Text style={styles.sectionBoxValue}></Text> {/* Vide pour remplissage manuel */}
                </View>
                <View style={styles.sectionBoxRow}>
                    <Text style={styles.sectionBoxLabel}>Description :</Text>
                    <Text style={styles.sectionBoxValue}></Text>
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

const InterventionPDF = ({ intervention, interventions }) => (
    <Document>
        {intervention && <InterventionPage intervention={intervention} />}
        {interventions && Array.isArray(interventions) && interventions.map((i) => <InterventionPage key={i.id} intervention={i} />)}
        {!intervention && (!interventions || !interventions.length) && (
            <Page size="A4" style={styles.page}>
                <Text>Aucune intervention à afficher</Text>
            </Page>
        )}
    </Document>
);

export default InterventionPDF;
