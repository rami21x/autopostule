import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
    color: '#1f2937',
  },
  expediteur: {
    marginBottom: 30,
  },
  nomPrenom: {
    fontFamily: 'Times-Bold',
    marginBottom: 2,
  },
  destinataire: {
    marginBottom: 20,
    textAlign: 'right',
  },
  date: {
    textAlign: 'right',
    marginBottom: 20,
    fontStyle: 'italic',
    fontFamily: 'Times-Italic',
  },
  objet: {
    marginBottom: 20,
  },
  objetLabel: {
    fontFamily: 'Times-Bold',
  },
  appel: {
    marginBottom: 15,
  },
  paragraphe: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  signature: {
    marginTop: 30,
    fontFamily: 'Times-Bold',
  },
});

export default function LettrePDF({
  expediteur,
  destinataire,
  date,
  objet,
  accroche,
  parcours,
  adequation,
  conclusion,
  formulePolice,
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Expéditeur */}
        {expediteur && (
          <View style={styles.expediteur}>
            {expediteur.nom_prenom && <Text style={styles.nomPrenom}>{expediteur.nom_prenom}</Text>}
            {expediteur.ville && <Text>{expediteur.ville}</Text>}
            {expediteur.telephone && <Text>{expediteur.telephone}</Text>}
            {expediteur.email && <Text>{expediteur.email}</Text>}
          </View>
        )}

        {/* Destinataire */}
        {destinataire && (destinataire.entreprise || destinataire.ville) && (
          <View style={styles.destinataire}>
            {destinataire.entreprise && <Text style={styles.nomPrenom}>{destinataire.entreprise}</Text>}
            {destinataire.ville && <Text>{destinataire.ville}</Text>}
          </View>
        )}

        {/* Date */}
        {date && <Text style={styles.date}>{date}</Text>}

        {/* Objet */}
        {objet && (
          <Text style={styles.objet}>
            <Text style={styles.objetLabel}>Objet : </Text>
            {objet}
          </Text>
        )}

        {/* Formule d'appel */}
        <Text style={styles.appel}>Madame, Monsieur,</Text>

        {/* Corps */}
        {accroche && <Text style={styles.paragraphe}>{accroche}</Text>}
        {parcours && <Text style={styles.paragraphe}>{parcours}</Text>}
        {adequation && <Text style={styles.paragraphe}>{adequation}</Text>}
        {conclusion && <Text style={styles.paragraphe}>{conclusion}</Text>}

        {/* Formule de politesse */}
        {formulePolice && <Text style={styles.paragraphe}>{formulePolice}</Text>}

        {/* Signature */}
        {expediteur?.nom_prenom && <Text style={styles.signature}>{expediteur.nom_prenom}</Text>}
      </Page>
    </Document>
  );
}

/**
 * Version "texte brut" — utilisée quand on n'a que le contenu texte de la lettre
 * (depuis la DB), sans la structure en sections.
 */
export function LettrePDFFromText({ content, candidatName, companyName }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={{ whiteSpace: 'pre-wrap' }}>{content}</Text>
      </Page>
    </Document>
  );
}
