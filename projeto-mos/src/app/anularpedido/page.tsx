'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

function AnularPedido() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id, numero_diario, nome_cliente, criado_em, estado_preparacao, estado_validade
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
                <th className="p-2">Preparação</th>
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
                  <td className="p-2">{pedido.estado_preparacao}</td>
                  <td className="p-2">{pedido.estado_validade}</td>
                    <td className="p-2">
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
    </div>
  );
}

export default VerificacaoDePermissoes(AnularPedido, ['Administrador', 'Funcionario de Banca']);
