import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image, Font } from '@react-pdf/renderer';
import { FaRegFilePdf } from 'react-icons/fa';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 18,
    marginBottom: 0,
    textAlign: 'center',
    color: '#032221'
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
    color: '#032221',
  },
   logo: {
    width: 100,
    height: 32.58,
    marginRight: 20,
  }
});

//Função que busca os eventos;
const fetchEventoEmExecucao = async () => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('em_execucao', true)
      .single();

    if (error?.code === 'PGRST116') {
      return null;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return null;
  }
};

// Componente do documento PDF
const MyDocument = ({ nomeEvento, data_inicio, data_fim }: { nomeEvento: string; data_inicio: string, data_fim: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <Image
            src="https://vmbqxeaccwcomeuwltwp.supabase.co/storage/v1/object/sign/imagens/Os%20Mosenses%20Logo%20Reduzido.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzhlYmVmN2Q5LTcxMzMtNDE2Yy04MDZhLWRhMDA2NmFhNDVjYSJ9.eyJ1cmwiOiJpbWFnZW5zL09zIE1vc2Vuc2VzIExvZ28gUmVkdXppZG8ucG5nIiwiaWF0IjoxNzQ4NjE5NzM2LCJleHAiOjE5MDYyOTk3MzZ9.SJL72Q4VwjJ3uZlon34a7NC4uxkCqN31PHoDM5ETUk4"
            style={styles.logo}
          />
          <View>
            <Text style={styles.title}>Relatório Oficial - {nomeEvento || 'N/A'}</Text>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Text style={styles.text}>Início: {data_inicio || 'N/A'}</Text>
              <Text style={styles.text}>Fim: {data_fim || 'N/A'}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.text, { marginTop: 20 }]}>
          Emitido em: {
            (() => {
              const data = new Date();
              const dia = data.toLocaleDateString('pt-PT', { day: '2-digit' });
              const mes = data.toLocaleDateString('pt-PT', { month: 'long' });
              const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
              const ano = data.toLocaleDateString('pt-PT', { year: 'numeric' });
              return `${dia} ${mesCapitalizado}, ${ano}`;
            })()
          }
        </Text>
      </View>
    </Page>
  </Document>
);

// Componente principal - certifique-se que está declarado como const ou function
const PDFGenerator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [nomeEvento, setNomeEvento] = useState('');
  const [data_inicio, setDataInicio] = useState('');
  const [data_fim, setDataFim] = useState('');

  useEffect(() => {
    const fetchDados = async () => {
      const evento = await fetchEventoEmExecucao();
      if (evento) {
        setNomeEvento(evento.nome);
        setDataInicio(new Date(evento.data_inicio).toLocaleDateString('pt-PT'));
        setDataFim(new Date(evento.data_fim).toLocaleDateString('pt-PT'));
      }
    };

    if (isOpen) {
      fetchDados();
    }
  }, [isOpen]);

  return (
    <>
      <Button variant="dark" onClick={() => setIsOpen(true)}>
        <FaRegFilePdf size={20} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-150 h-200">
          <DialogHeader>
            <DialogTitle>Visualizar PDF</DialogTitle>
          </DialogHeader>
          <div className="w-full h-180">
            <PDFViewer width="100%" height="100%">
              <MyDocument nomeEvento={nomeEvento} data_inicio={data_inicio} data_fim={data_fim}/>
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Exportação default
export default PDFGenerator;