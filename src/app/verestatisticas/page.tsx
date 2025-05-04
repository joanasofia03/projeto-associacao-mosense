'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

function VerEstatisticas() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [ordem, setOrdem] = useState<'data' | 'cliente'>('data');
  const [filtroValidade, setFiltroValidade] = useState<string>('Todos');
  const [totais, setTotais] = useState({
    total: 0,
    totalFaturado: 0,
    porEstadoValidade: {} as Record<string, number>,
  });

  const fetchPedidos = async () => {
    let query = supabase
      .from('pedidos')
      .select(`
        id,
        numero_diario,
        nome_cliente,
        criado_em,
        estado_validade,
        pedidos_itens (
          item_id,
          itens (
            preco
          )
        )
      `);

    if (ordem === 'data') {
      query = query.order('criado_em', { ascending: false });
    } else {
      query = query.order('nome_cliente', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar pedidos:', error);
      return;
    }

    const filtrados = data.filter((p) => {
      const passaValidade =
        filtroValidade === 'Todos' || p.estado_validade === filtroValidade;
      return passaValidade;
    });

    const contagemValidade: Record<string, number> = {};
    let totalFaturado = 0;

    filtrados.forEach((p) => {
      contagemValidade[p.estado_validade] =
        (contagemValidade[p.estado_validade] || 0) + 1;

        if (p.estado_validade === 'Confirmado') {
            const soma = p.pedidos_itens?.reduce((s: number, item: any) => {
              return s + (item.itens?.preco || 0);
            }, 0);
            totalFaturado += soma || 0;
          }    
    });

    setTotais({
      total: filtrados.length,
      totalFaturado,
      porEstadoValidade: contagemValidade,
    });

    setPedidos(filtrados);
  };

  useEffect(() => {
    fetchPedidos();
  }, [ordem, filtroValidade]);

  const estadosValidade = ['Todos', 'Confirmado', 'Anulado'];

  return (
    <main className="min-h-screen px-6 py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Estatísticas dos Pedidos</h1>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <label>
              Ordenar por:{' '}
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as 'data' | 'cliente')}
                className="border rounded px-2 py-1 ml-1"
              >
                <option value="data">Data (mais recente)</option>
                <option value="cliente">Cliente</option>
              </select>
            </label>
            <label>
              Estado Validade:{' '}
              <select
                value={filtroValidade}
                onChange={(e) => setFiltroValidade(e.target.value)}
                className="border rounded px-2 py-1 ml-1"
              >
                {estadosValidade.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-sm text-gray-700">
            <p><strong>Total Pedidos:</strong> {totais.total}</p>
            <p><strong>Total Faturado:</strong> {totais.totalFaturado.toFixed(2)} €</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Contagem por Estado de Validade</h2>
            <ul className="text-sm">
              {Object.entries(totais.porEstadoValidade).map(([estado, count]) => (
                <li key={estado}>
                  {estado}: <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Nº</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Data</th>
              <th className="p-2">Validade</th>
              <th className="p-2">Total (€)</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => {
              const totalPedido = pedido.pedidos_itens?.reduce((s: number, item: any) => {
                return s + (item.itens?.preco || 0);
              }, 0) || 0;

              return (
                <tr key={pedido.id} className="border-t">
                  <td className="p-2">{pedido.numero_diario}</td>
                  <td className="p-2">{pedido.nome_cliente}</td>
                  <td className="p-2">{new Date(pedido.criado_em).toLocaleString()}</td>
                  <td className="p-2">{pedido.estado_validade}</td>
                  <td className="p-2">{totalPedido.toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default VerificacaoDePermissoes(VerEstatisticas, ['Administrador', 'Funcionario de Banca']);
