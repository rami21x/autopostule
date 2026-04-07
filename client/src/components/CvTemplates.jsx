import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register a font that supports French accents
Font.register({
  family: 'Helvetica',
});

// ============================================
// TEMPLATE 1: CLASSIQUE
// Clean single-column, blue accents, traditional French CV
// ============================================
const classicStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { marginBottom: 20, borderBottom: '2 solid #2563eb', paddingBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 4 },
  contactRow: { flexDirection: 'row', gap: 16, fontSize: 9, color: '#4b5563' },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#2563eb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  divider: { borderBottom: '1 solid #e5e7eb', marginBottom: 8 },
  itemTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f' },
  itemSub: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  itemDesc: { fontSize: 9, color: '#374151', lineHeight: 1.4, marginBottom: 6 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillChip: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '3 8', borderRadius: 10, fontSize: 8 },
  softChip: { backgroundColor: '#f5f3ff', color: '#7c3aed', padding: '3 8', borderRadius: 10, fontSize: 8 },
});

export function CvClassique({ data }) {
  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <View style={classicStyles.header}>
          <Text style={classicStyles.name}>{data.first_name} {data.last_name}</Text>
          <View style={classicStyles.contactRow}>
            {data.city && <Text>{data.city}</Text>}
            {data.phone && <Text>{data.phone}</Text>}
          </View>
        </View>

        {data.formations?.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionTitle}>Formation</Text>
            <View style={classicStyles.divider} />
            {data.formations.map((f, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={classicStyles.itemTitle}>{f.diplome}</Text>
                <Text style={classicStyles.itemSub}>{f.etablissement} {f.annee && `| ${f.annee}`}</Text>
              </View>
            ))}
          </View>
        )}

        {data.experiences?.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionTitle}>Experience</Text>
            <View style={classicStyles.divider} />
            {data.experiences.map((e, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={classicStyles.itemTitle}>{e.poste}</Text>
                <Text style={classicStyles.itemSub}>{e.entreprise} {e.periode && `| ${e.periode}`}</Text>
                {e.description && <Text style={classicStyles.itemDesc}>{e.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {data.skills?.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionTitle}>Competences techniques</Text>
            <View style={classicStyles.divider} />
            <View style={classicStyles.skillsRow}>
              {data.skills.map((s, i) => (
                <Text key={i} style={classicStyles.skillChip}>{s}</Text>
              ))}
            </View>
          </View>
        )}

        {data.soft_skills?.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionTitle}>Soft Skills</Text>
            <View style={classicStyles.divider} />
            <View style={classicStyles.skillsRow}>
              {data.soft_skills.map((s, i) => (
                <Text key={i} style={classicStyles.softChip}>{s}</Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

// ============================================
// TEMPLATE 2: MODERNE
// Two-column layout with sidebar
// ============================================
const modernStyles = StyleSheet.create({
  page: { flexDirection: 'row', fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  sidebar: { width: '35%', backgroundColor: '#1e3a5f', color: '#ffffff', padding: 24 },
  main: { width: '65%', padding: 30 },
  sidebarName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#ffffff' },
  sidebarContact: { fontSize: 8, color: '#93c5fd', marginBottom: 20, lineHeight: 1.5 },
  sidebarSection: { marginBottom: 16 },
  sidebarTitle: { fontSize: 10, fontWeight: 'bold', color: '#93c5fd', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  sidebarItem: { fontSize: 8, color: '#dbeafe', marginBottom: 3, lineHeight: 1.3 },
  sidebarChip: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', padding: '2 6', borderRadius: 8, fontSize: 7, marginBottom: 3, marginRight: 3 },
  mainSection: { marginBottom: 16 },
  mainTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 8, borderBottom: '2 solid #2563eb', paddingBottom: 4 },
  entryTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f' },
  entrySub: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  entryDesc: { fontSize: 9, color: '#374151', lineHeight: 1.4, marginBottom: 8 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
});

export function CvModerne({ data }) {
  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        {/* Sidebar */}
        <View style={modernStyles.sidebar}>
          <Text style={modernStyles.sidebarName}>{data.first_name} {data.last_name}</Text>
          <Text style={modernStyles.sidebarContact}>
            {data.city && `${data.city}\n`}
            {data.phone && `${data.phone}\n`}
          </Text>

          {data.skills?.length > 0 && (
            <View style={modernStyles.sidebarSection}>
              <Text style={modernStyles.sidebarTitle}>Competences</Text>
              <View style={modernStyles.skillsRow}>
                {data.skills.map((s, i) => (
                  <Text key={i} style={modernStyles.sidebarChip}>{s}</Text>
                ))}
              </View>
            </View>
          )}

          {data.soft_skills?.length > 0 && (
            <View style={modernStyles.sidebarSection}>
              <Text style={modernStyles.sidebarTitle}>Qualites</Text>
              {data.soft_skills.map((s, i) => (
                <Text key={i} style={modernStyles.sidebarItem}>• {s}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Main content */}
        <View style={modernStyles.main}>
          {data.formations?.length > 0 && (
            <View style={modernStyles.mainSection}>
              <Text style={modernStyles.mainTitle}>Formation</Text>
              {data.formations.map((f, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={modernStyles.entryTitle}>{f.diplome}</Text>
                  <Text style={modernStyles.entrySub}>{f.etablissement} {f.annee && `| ${f.annee}`}</Text>
                </View>
              ))}
            </View>
          )}

          {data.experiences?.length > 0 && (
            <View style={modernStyles.mainSection}>
              <Text style={modernStyles.mainTitle}>Experience</Text>
              {data.experiences.map((e, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Text style={modernStyles.entryTitle}>{e.poste}</Text>
                  <Text style={modernStyles.entrySub}>{e.entreprise} {e.periode && `| ${e.periode}`}</Text>
                  {e.description && <Text style={modernStyles.entryDesc}>{e.description}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// TEMPLATE 3: MINIMAL
// Simple, clean, lots of whitespace
// ============================================
const minimalStyles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  header: { marginBottom: 30, textAlign: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#111827', letterSpacing: 2, marginBottom: 6 },
  contactRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, fontSize: 9, color: '#6b7280' },
  separator: { borderBottom: '0.5 solid #d1d5db', marginVertical: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  entryRow: { flexDirection: 'row', marginBottom: 6 },
  entryDate: { width: '25%', fontSize: 8, color: '#9ca3af' },
  entryContent: { width: '75%' },
  entryTitle: { fontSize: 10, fontWeight: 'bold', color: '#111827' },
  entrySub: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  entryDesc: { fontSize: 8, color: '#4b5563', lineHeight: 1.5, marginBottom: 4 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillItem: { fontSize: 9, color: '#374151' },
});

export function CvMinimal({ data }) {
  return (
    <Document>
      <Page size="A4" style={minimalStyles.page}>
        <View style={minimalStyles.header}>
          <Text style={minimalStyles.name}>{data.first_name?.toUpperCase()} {data.last_name?.toUpperCase()}</Text>
          <View style={minimalStyles.contactRow}>
            {data.city && <Text>{data.city}</Text>}
            {data.phone && <Text>{data.phone}</Text>}
          </View>
        </View>

        <View style={minimalStyles.separator} />

        {data.formations?.length > 0 && (
          <View style={minimalStyles.section}>
            <Text style={minimalStyles.sectionTitle}>Formation</Text>
            {data.formations.map((f, i) => (
              <View key={i} style={minimalStyles.entryRow}>
                <View style={minimalStyles.entryDate}>
                  <Text>{f.annee || ''}</Text>
                </View>
                <View style={minimalStyles.entryContent}>
                  <Text style={minimalStyles.entryTitle}>{f.diplome}</Text>
                  <Text style={minimalStyles.entrySub}>{f.etablissement}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {data.experiences?.length > 0 && (
          <View style={minimalStyles.section}>
            <Text style={minimalStyles.sectionTitle}>Experience</Text>
            {data.experiences.map((e, i) => (
              <View key={i} style={minimalStyles.entryRow}>
                <View style={minimalStyles.entryDate}>
                  <Text>{e.periode || ''}</Text>
                </View>
                <View style={minimalStyles.entryContent}>
                  <Text style={minimalStyles.entryTitle}>{e.poste}</Text>
                  <Text style={minimalStyles.entrySub}>{e.entreprise}</Text>
                  {e.description && <Text style={minimalStyles.entryDesc}>{e.description}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={minimalStyles.separator} />

        {data.skills?.length > 0 && (
          <View style={minimalStyles.section}>
            <Text style={minimalStyles.sectionTitle}>Competences</Text>
            <View style={minimalStyles.skillsRow}>
              {data.skills.map((s, i) => (
                <Text key={i} style={minimalStyles.skillItem}>{s}{i < data.skills.length - 1 ? '  •' : ''}</Text>
              ))}
            </View>
          </View>
        )}

        {data.soft_skills?.length > 0 && (
          <View style={minimalStyles.section}>
            <Text style={minimalStyles.sectionTitle}>Qualites</Text>
            <View style={minimalStyles.skillsRow}>
              {data.soft_skills.map((s, i) => (
                <Text key={i} style={minimalStyles.skillItem}>{s}{i < data.soft_skills.length - 1 ? '  •' : ''}</Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

export const TEMPLATES = [
  { id: 'classique', name: 'Classique', description: 'Format traditionnel, clair et professionnel', component: CvClassique, color: 'blue' },
  { id: 'moderne', name: 'Moderne', description: 'Deux colonnes avec sidebar colorée', component: CvModerne, color: 'indigo' },
  { id: 'minimal', name: 'Minimal', description: 'Épuré, beaucoup d\'espace, monochrome', component: CvMinimal, color: 'gray' },
];
