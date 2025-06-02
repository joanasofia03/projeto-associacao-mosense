import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image } from '@react-pdf/renderer';
import { FaRegFilePdf } from 'react-icons/fa';

// Estilos para o PDF - memoizados para evitar recriação
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
    fontSize: 20,
    marginBottom: 0,
    textAlign: 'center',
    color: '#032221',
    fontWeight: 'bold'
  },
  text: {
    fontSize: 12,
    color: '#032221',
  },
  logo: {
    width: 100,
    height: 32.58,
    marginRight: 20,
  },
  statisticsSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5
  },
  statisticsTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#032221',
    marginBottom: 15,
    textAlign: 'center'
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10
  },
  statisticsLabel: {
    fontSize: 12,
    color: '#032221',
    fontWeight: 'bold'
  },
  statisticsLabel2: {
    fontSize: 12,
    color: '#2A4759',
    fontWeight: 'medium'
  },
  statisticsValue: {
    fontSize: 12,
    color: '#032221',
    fontWeight: 'bold'
  }
});

// Cache para dados de usuário e evento
const cache = {
  user: null as any,
  userProfile: null as any,
  currentEvent: null as any,
  lastFetch: 0,
  cacheDuration: 5 * 60 * 1000 // 5 minutos
};

// Interface para tipagem melhorada
interface ItemPedido {
  quantidade: number;
  itens: {
    preco: number;
    IVA: number;
  };
}

interface EventData {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
}

interface UserProfile {
  nome: string;
  tipo: string;
}

interface Statistics {
  totalPedidos: number;
  pedidosConfirmados: number;
  pedidosAnulados: number;
  totalFaturado: number;
  subtotal: number;
  totalIVA: number;
}

//Função otimizada para buscar evento;
const fetchEventoEmExecucao = async (): Promise<EventData | null> => {
  try {
    // Verificar cache
    const now = Date.now();
    if (cache.currentEvent && (now - cache.lastFetch) < cache.cacheDuration) {
      return cache.currentEvent;
    }

    const { data, error } = await supabase
      .from('eventos')
      .select('id, nome, data_inicio, data_fim')
      .eq('em_execucao', true)
      .single();

    if (error?.code === 'PGRST116') {
      console.warn('Nenhum evento em execução encontrado');
      return null;
    }

    if (error) throw error;
    
    if (!data?.nome || !data?.data_inicio || !data?.data_fim || !data?.id) {
      console.error('Dados do evento incompletos:', data);
      throw new Error('Dados do evento incompletos');
    }
    
    // Atualizar cache
    cache.currentEvent = data;
    cache.lastFetch = now;
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return null;
  }
};

// Função otimizada para buscar perfil do usuário
const fetchPerfilUsuario = async (): Promise<UserProfile | null> => {
  try {
    // Verificar cache do usuário
    const now = Date.now();
    if (cache.userProfile && (now - cache.lastFetch) < cache.cacheDuration) {
      return cache.userProfile;
    }

    // Verificar se já temos o usuário em cache
    let user = cache.user;
    if (!user || (now - cache.lastFetch) > cache.cacheDuration) {
      const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !fetchedUser) {
        console.error('Erro ao obter usuário:', authError);
        return null;
      }
      
      user = fetchedUser;
      cache.user = user;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('nome, tipo')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    // Atualizar cache
    cache.userProfile = data;
    cache.lastFetch = now;

    return data;
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return null;
  }
};

//Função otimizada para buscar estatísticas
const fetchEstatisticasPedidos = async (eventoId: string): Promise<Statistics> => {
  const defaultStats: Statistics = {
    totalPedidos: 0,
    pedidosConfirmados: 0,
    pedidosAnulados: 0,
    totalFaturado: 0,
    subtotal: 0,
    totalIVA: 0
  };

  try {
    if (!eventoId) {
      console.warn('EventoId não fornecido ou inválido');
      return defaultStats;
    }

    //Query otimizada: buscar pedidos e itens em uma única consulta quando possível
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, estado_validade')
      .eq('id_evento', eventoId);

    if (pedidosError) {
      console.error('Erro ao buscar pedidos:', pedidosError);
      throw pedidosError;
    }

    if (!pedidosData || pedidosData.length === 0) {
      return defaultStats;
    }

    // Processamento otimizado dos dados
    const totalPedidos = pedidosData.length;
    const pedidosConfirmados = pedidosData.filter(p => p.estado_validade === 'Confirmado');
    const pedidosAnulados = pedidosData.filter(p => p.estado_validade === 'Anulado');

    const pedidosConfirmadosCount = pedidosConfirmados.length;
    const pedidosAnuladosCount = pedidosAnulados.length;

    let subtotal = 0;
    let totalIVA = 0;

    if (pedidosConfirmadosCount > 0) {
      const pedidosConfirmadosIds = pedidosConfirmados.map(p => p.id);

      // Query otimizada para calcular total faturado incluindo IVA
      const { data: itensData, error: itensError } = await supabase
        .from('pedidos_itens')
        .select('quantidade, itens!inner(preco, IVA)')
        .in('pedido_id', pedidosConfirmadosIds);

      if (itensError) {
        console.error('Erro ao buscar itens dos pedidos:', itensError);
      } else if (itensData) {
        // Cálculo otimizado do subtotal e IVA
        itensData.forEach((item: any) => {
          const quantidade = Number(item?.quantidade) || 0;
          const preco = Number(item?.itens?.preco) || 0;
          const ivaPercentage = Number(item?.itens?.IVA) || 0;
          
          const subtotalItem = quantidade * (preco-preco*(ivaPercentage / 100));
          const ivaItem = quantidade * (preco*(ivaPercentage / 100));
          
          subtotal += subtotalItem;
          totalIVA += ivaItem;
        });
      }
    }

    const totalFaturado = subtotal + totalIVA;

    return {
      totalPedidos,
      pedidosConfirmados: pedidosConfirmadosCount,
      pedidosAnulados: pedidosAnuladosCount,
      totalFaturado,
      subtotal,
      totalIVA
    };

  } catch (error) {
    console.error('Erro ao buscar estatísticas dos pedidos:', error);
    return defaultStats;
  }
};

// Função utilitária memoizada para formatação de data
const formatDateString = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('pt-PT');
  } catch {
    return 'Data inválida';
  }
};

// Função utilitária memoizada para data e hora atual
const getCurrentDateTimeFormatted = (): string => {
  const data = new Date();
  const dia = data.toLocaleDateString('pt-PT', { day: '2-digit' });
  const mes = data.toLocaleDateString('pt-PT', { month: 'long' });
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
  const ano = data.toLocaleDateString('pt-PT', { year: 'numeric' });
  const horas = data.getHours().toString().padStart(2, '0');
  const minutos = data.getMinutes().toString().padStart(2, '0');
  
  return `${dia} de ${mesCapitalizado}, ${ano} às ${horas}h${minutos}`;
};

// Componente do documento PDF otimizado
const MyDocument = ({ 
  nomeEvento, 
  data_inicio, 
  data_fim, 
  responsavel, 
  tipoResponsavel,
  estatisticas
}: { 
  nomeEvento: string; 
  data_inicio: string; 
  data_fim: string;
  responsavel: string;
  tipoResponsavel: string;
  estatisticas: Statistics;
}) => {
  // Memoizar a data atual para evitar recálculos
  const currentDateTime = useMemo(() => getCurrentDateTimeFormatted(), []);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <Image
              src="https://vmbqxeaccwcomeuwltwp.supabase.co/storage/v1/object/public/imagenspublicas//Os%20Mosenses%20Logo%20Reduzido.png"
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
            Emitido em: {currentDateTime}
          </Text>
          
          <View style={{ marginTop: 10 }}>
            <Text style={styles.text}>
              Gerado por: {responsavel || 'N/A'}
            </Text>
            <Text style={styles.text}>
              Cargo: {tipoResponsavel || 'N/A'}
            </Text>
          </View>

          {/* Seção de Estatísticas */}
          <View style={styles.statisticsSection}>
            <Text style={styles.statisticsTitle}>Estatísticas do Evento</Text>
            
            <View style={styles.statisticsRow}>
              <Text style={styles.statisticsLabel}>Total de Pedidos:</Text>
              <Text style={styles.statisticsValue}>{estatisticas.totalPedidos}</Text>
            </View>
            
            <View style={styles.statisticsRow}>
              <Text style={styles.statisticsLabel2}>Pedidos Confirmados:</Text>
              <Text style={styles.statisticsLabel2}>{estatisticas.pedidosConfirmados}</Text>
            </View>
            
            <View style={styles.statisticsRow}>
              <Text style={styles.statisticsLabel2}>Pedidos Anulados:</Text>
              <Text style={styles.statisticsLabel2}>{estatisticas.pedidosAnulados}</Text>
            </View>

            <View style={[styles.statisticsRow, { borderTop: '1px solid #032221', paddingTop: 8, color: '#879191'}]}>
              <Text style={styles.statisticsLabel2}>Subtotal (sem IVA):</Text>
              <Text style={styles.statisticsLabel2}>{estatisticas.subtotal.toFixed(2)}€</Text>
            </View>
            
            <View style={styles.statisticsRow}>
              <Text style={styles.statisticsLabel2}>Total IVA:</Text>
              <Text style={styles.statisticsLabel2}>{estatisticas.totalIVA.toFixed(2)}€</Text>
            </View>

            <View style={styles.statisticsRow}>
              <Text style={styles.statisticsLabel}>Total Faturado:</Text>
              <Text style={styles.statisticsValue}>{estatisticas.totalFaturado.toFixed(2)}€</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Componente principal otimizado
const PDFGenerator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportData, setReportData] = useState({
    nomeEvento: '',
    data_inicio: '',
    data_fim: '',
    responsavel: '',
    tipoResponsavel: '',
    estatisticas: {
      totalPedidos: 0,
      pedidosConfirmados: 0,
      pedidosAnulados: 0,
      totalFaturado: 0,
      subtotal: 0,
      totalIVA: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função otimizada para buscar todos os dados
  const fetchAllData = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar dados do evento e perfil do usuário em paralelo
      const [evento, perfil] = await Promise.all([
        fetchEventoEmExecucao(),
        fetchPerfilUsuario()
      ]);

      let estatisticas = {
        totalPedidos: 0,
        pedidosConfirmados: 0,
        pedidosAnulados: 0,
        totalFaturado: 0,
        subtotal: 0,
        totalIVA: 0
      };

      // Definir dados do evento e buscar estatísticas
      if (evento?.id) {
        estatisticas = await fetchEstatisticasPedidos(evento.id);
      }

      // Atualizar estado com todos os dados de uma vez
      setReportData({
        nomeEvento: evento?.nome || 'Evento não encontrado',
        data_inicio: evento?.data_inicio ? formatDateString(evento.data_inicio) : 'N/A',
        data_fim: evento?.data_fim ? formatDateString(evento.data_fim) : 'N/A',
        responsavel: perfil?.nome || 'Usuário não identificado',
        tipoResponsavel: perfil?.tipo || 'N/A',
        estatisticas
      });
        
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do relatório');
      
      // Dados de fallback
      setReportData({
        nomeEvento: 'Erro ao carregar',
        data_inicio: 'N/A',
        data_fim: 'N/A',
        responsavel: 'Erro ao carregar',
        tipoResponsavel: 'N/A',
        estatisticas: {
          totalPedidos: 0,
          pedidosConfirmados: 0,
          pedidosAnulados: 0,
          totalFaturado: 0,
          subtotal: 0,
          totalIVA: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  //Memorizar o componente PDF para evitar re-renders desnecessários
  const memoizedPDFDocument = useMemo(() => (
    <MyDocument 
      nomeEvento={reportData.nomeEvento} 
      data_inicio={reportData.data_inicio} 
      data_fim={reportData.data_fim}
      responsavel={reportData.responsavel}
      tipoResponsavel={reportData.tipoResponsavel}
      estatisticas={reportData.estatisticas}
    />
  ), [reportData]);

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
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p>Carregando dados...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <PDFViewer width="100%" height="100%">
                {memoizedPDFDocument}
              </PDFViewer>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFGenerator;