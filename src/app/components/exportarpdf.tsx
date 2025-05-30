import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { FaRegFilePdf } from 'react-icons/fa';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#032221'
  },
  text: {
    fontSize: 12,
    marginBottom: 10
  }
});

// Componente do documento PDF
const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Relatório Gerado</Text>
        <Text style={styles.text}>Data: {new Date().toLocaleDateString('pt-PT')}</Text>
        <Text style={styles.text}>Este é um relatório exemplo.</Text>
        <Text style={styles.text}>Conteúdo gerado automaticamente.</Text>
        
        <View style={{ marginTop: 20 }}>
          <Text style={styles.text}>Nome: João Silva</Text>
          <Text style={styles.text}>Email: joao@exemplo.com</Text>
          <Text style={styles.text}>Telefone: +351 123 456 789</Text>
        </View>
      </View>
    </Page>
  </Document>
);

// Componente principal - certifique-se que está declarado como const ou function
const PDFGenerator = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* O teu botão */}
      <Button variant="dark" onClick={() => setIsOpen(true)}>
        <FaRegFilePdf size={20}/>
      </Button>

      {/* Modal com o PDF */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-150 h-200">
          <DialogHeader>
            <DialogTitle>Visualizar PDF</DialogTitle>
          </DialogHeader>
          <div className="w-full h-180">
            <PDFViewer width="100%" height="100%">
              <MyDocument />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Exportação default
export default PDFGenerator;