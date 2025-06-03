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
  },
  // Novos estilos para a tabela
  tableSection: {
    marginTop: 20,
    padding: 15,
    borderRadius: 5
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#032221',
    marginBottom: 5,
    textAlign: 'center'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#032221',
    padding: 8,
    borderRadius: 3,
    marginBottom: 5
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1px solid #e0e0e0',
    marginBottom: 2
  },
  tableCell: {
    fontSize: 9,
    color: '#032221',
    textAlign: 'left',
    paddingHorizontal: 4
  },
  tableCellCenter: {
    fontSize: 9,
    color: '#032221',
    textAlign: 'center',
    paddingHorizontal: 4
  },
  tableCellRight: {
    fontSize: 9,
    color: '#032221',
    textAlign: 'right',
    paddingHorizontal: 4
  },
  // Estilos para a seção de assinatura
  signatureSection: {
    marginTop: 40,
    padding: 20,
    borderRadius: 5,
    alignItems: 'center'
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#032221',
    marginBottom: 30,
    textAlign: 'center'
  },
  signatureLine: {
    borderBottom: '1px solid #032221',
    width: 250,
    height: 40,
    marginBottom: 10
  },
  signatureLabel: {
    fontSize: 12,
    color: '#032221',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  signatureDate: {
    fontSize: 11,
    color: '#2A4759',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic'
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

// Nova interface para pratos populares
interface PratoPopular {
  id: number;
  nome: string;
  tipo: string;
  preco: number;
  quantidade_pedida: number;
  preco_faturado: number;
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

// Nova função para buscar pratos populares
const fetchPratosPopulares = async (eventoId: string): Promise<PratoPopular[]> => {
  try {
    if (!eventoId) {
      console.warn('EventoId não fornecido para pratos populares');
      return [];
    }

    // Primeiro, buscamos todos os itens disponíveis
    const { data: todosItens, error: itensError } = await supabase
      .from('itens')
      .select('id, nome, tipo, preco')
      .order('nome');

    if (itensError) {
      console.error('Erro ao buscar itens:', itensError);
      return [];
    }

    if (!todosItens || todosItens.length === 0) {
      return [];
    }

    // Buscamos pedidos confirmados do evento
    const { data: pedidosConfirmados, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('id_evento', eventoId)
      .eq('estado_validade', 'Confirmado');

    if (pedidosError) {
      console.error('Erro ao buscar pedidos confirmados:', pedidosError);
      return [];
    }

    let pratosPopulares: PratoPopular[] = [];

    if (pedidosConfirmados && pedidosConfirmados.length > 0) {
      const pedidosIds = pedidosConfirmados.map(p => p.id);

      // Buscamos os itens pedidos com suas quantidades
      const { data: itensPedidos, error: itensPedidosError } = await supabase
        .from('pedidos_itens')
        .select('item_id, quantidade')
        .in('pedido_id', pedidosIds);

      if (itensPedidosError) {
        console.error('Erro ao buscar itens pedidos:', itensPedidosError);
      }

      // Criamos um mapa de quantidades por item
      const quantidadesPorItem = new Map<number, number>();
      
      if (itensPedidos) {
        itensPedidos.forEach((pedidoItem: any) => {
          const itemId = pedidoItem.item_id;
          const quantidade = Number(pedidoItem.quantidade) || 0;
          
          if (quantidadesPorItem.has(itemId)) {
            quantidadesPorItem.set(itemId, quantidadesPorItem.get(itemId)! + quantidade);
          } else {
            quantidadesPorItem.set(itemId, quantidade);
          }
        });
      }

      // Montamos a lista final com todos os itens
      pratosPopulares = todosItens.map((item: any) => {
        const quantidadePedida = quantidadesPorItem.get(item.id) || 0;
        const precoFaturado = quantidadePedida * (Number(item.preco) || 0);
        
        return {
          id: item.id,
          nome: item.nome || 'Nome não disponível',
          tipo: item.tipo || 'Tipo não disponível',
          preco: Number(item.preco) || 0,
          quantidade_pedida: quantidadePedida,
          preco_faturado: precoFaturado
        };
      });

      // Ordenamos por quantidade pedida (descendente) e depois por nome
      pratosPopulares.sort((a, b) => {
        if (b.quantidade_pedida !== a.quantidade_pedida) {
          return b.quantidade_pedida - a.quantidade_pedida;
        }
        return a.nome.localeCompare(b.nome);
      });
    } else {
      // Se não há pedidos confirmados, ainda mostramos todos os itens com quantidade 0
      pratosPopulares = todosItens.map((item: any) => ({
        id: item.id,
        nome: item.nome || 'Nome não disponível',
        tipo: item.tipo || 'Tipo não disponível',
        preco: Number(item.preco) || 0,
        quantidade_pedida: 0,
        preco_faturado: 0
      }));
      
      pratosPopulares.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return pratosPopulares;
    
  } catch (error) {
    console.error('Erro ao buscar pratos populares:', error);
    return [];
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

// Nova função para formatação da data completa por escrito
const getFullWrittenDate = (): string => {
  const data = new Date();
  const dia = data.getDate();
  const mes = data.toLocaleDateString('pt-PT', { month: 'long' });
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
  const ano = data.getFullYear();
  
  return `${dia} de ${mesCapitalizado} de ${ano}`;
};

// Componente do documento PDF otimizado
const MyDocument = ({ 
  nomeEvento, 
  data_inicio, 
  data_fim, 
  responsavel, 
  tipoResponsavel,
  estatisticas,
  pratosPopulares
}: { 
  nomeEvento: string; 
  data_inicio: string; 
  data_fim: string;
  responsavel: string;
  tipoResponsavel: string;
  estatisticas: Statistics;
  pratosPopulares: PratoPopular[];
}) => {
  // Memoizar a data atual para evitar recálculos
  const currentDateTime = useMemo(() => getCurrentDateTimeFormatted(), []);
  const fullWrittenDate = useMemo(() => getFullWrittenDate(), []);
  
  return (
    <Document>
      {/* PRIMEIRA PÁGINA */}
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

          {/* Seção dos Pratos Populares - MOVIDA PARA A PRIMEIRA PÁGINA */}
          <View style={styles.tableSection}>
            <Text style={styles.tableTitle}>Análise dos Produtos</Text>
            <Text style={[styles.text, { marginBottom: 10, fontWeight: 'light', fontSize: 10, textAlign: 'center'}]}>Verificação e análise dos produtos consumidos, com base na quantidade e respetiva faturação.</Text>
            
            {/* Cabeçalho da tabela */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Nome do Item</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Tipo</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Preço</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Qtd.</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Faturado</Text>
            </View>

            {/* Linhas da tabela */}
            {pratosPopulares.map((prato, index) => (
              <View key={prato.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {prato.nome}
                </Text>
                <Text style={[styles.tableCellCenter, { flex: 1.5 }]}>
                  {prato.tipo}
                </Text>
                <Text style={[styles.tableCellRight, { flex: 1 }]}>
                  {prato.preco.toFixed(2)}€
                </Text>
                <Text style={[styles.tableCellCenter, { flex: 1 }]}>
                  {prato.quantidade_pedida}
                </Text>
                <Text style={[styles.tableCellRight, { flex: 1.5 }]}>
                  {prato.preco_faturado.toFixed(2)}€
                </Text>
              </View>
            ))}

            {pratosPopulares.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellCenter, { flex: 1 }]}>
                  Nenhum item encontrado
                </Text>
              </View>
            )}
          </View>
        </View>
      </Page>

      {/* SEGUNDA PÁGINA */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Seção de Estatísticas - MOVIDA PARA O INÍCIO DA SEGUNDA PÁGINA */}
          <View style={[styles.statisticsSection, { marginTop: 0 }]}>
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

          {/* Seção de Assinatura */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>Assinatura do Presidente</Text>
            
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>Presidente da Associação</Text>
            
            <Text style={styles.signatureDate}>
              Data de assinatura: {fullWrittenDate}
            </Text>
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
    },
    pratosPopulares: [] as PratoPopular[]
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

      let pratosPopulares: PratoPopular[] = [];

      // Definir dados do evento e buscar estatísticas
      if (evento?.id) {
        [estatisticas, pratosPopulares] = await Promise.all([
          fetchEstatisticasPedidos(evento.id),
          fetchPratosPopulares(evento.id)
        ]);
      }

      // Atualizar estado com todos os dados de uma vez
      setReportData({
        nomeEvento: evento?.nome || 'Evento não encontrado',
        data_inicio: evento?.data_inicio ? formatDateString(evento.data_inicio) : 'N/A',
        data_fim: evento?.data_fim ? formatDateString(evento.data_fim) : 'N/A',
        responsavel: perfil?.nome || 'Usuário não identificado',
        tipoResponsavel: perfil?.tipo || 'N/A',
        estatisticas,
        pratosPopulares
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
        },
        pratosPopulares: []
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
      pratosPopulares={reportData.pratosPopulares}
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