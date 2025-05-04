'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

function AnularPedido() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itensDoPedido, setItensDoPedido] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<number | null>(null);
  const [numeroDiarioSelecionado, setNumeroDiarioSelecionado] = useState<string | null>(null);
  const [notaSelecionada, setNotaSelecionada] = useState<string | null>(null);

  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id, numero_diario, nome_cliente, criado_em, estado_validade
      `)
      .order('criado_em', { ascending: false });

    if (error) {
      setErro('Erro ao carregar pedidos');
      console.error(error);
    } else {
      setPedidos(data);
    }
    setLoading(false);
  };

  const anularPedido = async (id: number, index: number) => {
    const confirmDelete = window.confirm('Tem certeza que deseja anular este pedido?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado_validade: 'Anulado' })
        .eq('id', id);

      if (error) {
        console.error('Erro ao anular o pedido:', error);
        setErro('Erro ao anular o pedido');
      } else {
        console.log('Pedido anulado com sucesso!');
        const updatedPedidos = [...pedidos];
        updatedPedidos[index].estado_validade = 'Anulado';
        setPedidos(updatedPedidos);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setErro('Erro inesperado ao anular o pedido');
    }
  };

  const fetchItensDoPedido = async (pedidoId: number) => {
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('numero_diario, nota')
      .eq('id', pedidoId)
      .single();

    if (pedidoError) {
      console.error('Erro ao obter dados do pedido:', pedidoError);
      setErro('Erro ao obter dados do pedido');
      return;
    }

    const { data: itens, error } = await supabase
      .from('pedidos_itens')
      .select(`
        id, item_id, quantidade, para_levantar_depois,
        itens (nome)
      `)
      .eq('pedido_id', pedidoId);

    if (error) {
      console.error('Erro ao carregar itens do pedido:', error);
      setErro('Erro ao carregar itens do pedido');
      return;
    }

    setItensDoPedido(itens);
    setPedidoSelecionado(pedidoId);
    setNumeroDiarioSelecionado(pedido.numero_diario);
    setNotaSelecionada(pedido.nota || null);
    setMostrarModal(true);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-4xl text-gray-800 shadow-md rounded p-6 bg-white">
        <h1 className="text-2xl font-semibold mb-6">Pedidos Registados</h1>

        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}
        {loading ? (
          <p>A carregar pedidos...</p>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Nº</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Data</th>
                <th className="p-2">Validade</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido, index) => (
                <tr key={pedido.id} className="border-t">
                  <td className="p-2">{pedido.numero_diario}</td>
                  <td className="p-2">{pedido.nome_cliente}</td>
                  <td className="p-2">{new Date(pedido.criado_em).toLocaleString()}</td>
                  <td className="p-2">{pedido.estado_validade}</td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => fetchItensDoPedido(pedido.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      Ver Itens
                    </button>
                    {pedido.estado_validade !== 'Anulado' ? (
                      <button
                        onClick={() => anularPedido(pedido.id, index)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Anular
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">Anulado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h2 className="text-xl font-semibold mb-2">
              Itens do Pedido Nº {numeroDiarioSelecionado}
            </h2>
            {notaSelecionada && (
              <p className="text-gray-700 mb-4">
                <strong>Nota:</strong> {notaSelecionada}
              </p>
            )}
            <button
              onClick={() => setMostrarModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl"
            >
              &times;
            </button>

            {itensDoPedido.length === 0 ? (
              <p>Sem itens para mostrar.</p>
            ) : (
              <ul className="space-y-2">
                {itensDoPedido.map((item) => (
                  <li key={item.id} className="border p-2 rounded">
                    <p><strong>Item:</strong> {item.itens?.nome || `ID ${item.item_id}`}</p>
                    <p><strong>Quantidade:</strong> {item.quantidade}</p>
                    <p><strong>Para levantar depois:</strong> {item.para_levantar_depois ? 'Sim' : 'Não'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificacaoDePermissoes(AnularPedido, ['Administrador', 'Funcionario de Banca']);
