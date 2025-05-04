'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

function RegistarPedido() {
  const [itensMenu, setItensMenu] = useState<any[]>([]);
  const [itensSelecionados, setItensSelecionados] = useState<{ item_id: number; para_levantar_depois: boolean; quantidade: number; }[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [detalhesPedido, setDetalhesPedido] = useState<{
    pedido_numero_diario: number;
    nome_cliente: string;
    nota?: string | null;
    itens: {
      nome: string;
      preco: number;
      para_levantar_depois: boolean;
      quantidade: number;
    }[];
    total: number;
  } | null>(null);  

  useEffect(() => {
    const fetchItens = async () => {
      const { data, error } = await supabase
        .from('itens')
        .select('*')
        .eq('isMenu', true);

      if (error) setErro('Erro ao carregar itens do menu.');
      else setItensMenu(data || []);
    };

    fetchItens();
  }, []);

  const handleItemToggle = (itemId: number) => {
    setItensSelecionados((prev) => {
      const existe = prev.find((i) => i.item_id === itemId);
      if (existe) return prev.filter((i) => i.item_id !== itemId);
      return [
        ...prev,
        { item_id: itemId, para_levantar_depois: false, quantidade: 1 },
      ];
    });
  };  

  const handleCheckboxToggle = (itemId: number) => {
    setItensSelecionados((prev) =>
      prev.map((i) =>
        i.item_id === itemId
          ? { ...i, para_levantar_depois: !i.para_levantar_depois }
          : i
      )
    );
  };

  const handleQuantidadeChange = (itemId: number, novaQuantidade: number) => {
    setItensSelecionados((prev) =>
      prev.map((item) =>
        item.item_id === itemId
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    );
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    setErro(null);

    if (!nomeCliente || itensSelecionados.length === 0) {
      setErro('Preencha o nome e selecione pelo menos um item.');
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Utilizador não autenticado');

      const hoje = new Date();
      const hojeISO = hoje.toISOString().split('T')[0]; // "YYYY-MM-DD"

      const { data: pedidosHoje, error: errorPedidos } = await supabase
        .from('pedidos')
        .select('numero_diario')
        .eq('criado_em_truncado', hojeISO)
        .order('numero_diario', { ascending: false })
        .limit(1);

      const numeroDiario = pedidosHoje?.[0]?.numero_diario
        ? pedidosHoje[0].numero_diario + 1
        : 1;

      const { data: novoPedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([
            {
            numero_diario: numeroDiario,
            nome_cliente: nomeCliente,
            registado_por: user.id,
            estado_validade: 'Confirmado',
            criado_em_truncado: hojeISO,
            nota: nota || null,
            },
        ])
        .select()
        .single();


      if (pedidoError || !novoPedido) throw new Error('Erro ao criar pedido.');

      const itensParaInserir = itensSelecionados.map((item) => ({
        pedido_id: novoPedido.id,
        item_id: item.item_id,
        para_levantar_depois: item.para_levantar_depois,
        quantidade: item.quantidade,
      }));      

      const { error: itensError } = await supabase
        .from('pedidos_itens')
        .insert(itensParaInserir);

      if (itensError) throw new Error('Erro ao inserir itens.');

      const { data: itensComDetalhes, error: detalhesError } = await supabase
      .from('itens')
      .select('id, nome, preco')
      .in('id', itensSelecionados.map(i => i.item_id));

      if (detalhesError || !itensComDetalhes) throw new Error('Erro ao carregar detalhes dos itens.');

      const itensDetalhados = itensSelecionados.map((item) => {
      const info = itensComDetalhes.find((i) => i.id === item.item_id);
      return {
        nome: info?.nome || 'Item desconhecido',
        preco: info?.preco || 0,
        quantidade: item.quantidade,
        para_levantar_depois: item.para_levantar_depois,
      };
      });

      const total = itensDetalhados.reduce(
      (acc, item) => acc + item.preco * item.quantidade,
      0
      );

      setDetalhesPedido({
      pedido_numero_diario: novoPedido.numero_diario,
      nome_cliente: nomeCliente,
      nota: nota,
      itens: itensDetalhados,
      total,
      });

      setMensagem(`Pedido #${numeroDiario} registado com sucesso.`);
      setTimeout(() => {
      setMensagem(null);
      setDetalhesPedido(null);
      }, 20000);

      setNomeCliente('');
      setItensSelecionados([]);
      setNota('');

    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro desconhecido');
    }
  };

  const isItemSelecionado = (id: number) =>
    itensSelecionados.some((item) => item.item_id === id);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
    <div className="w-full max-w-md text-gray-800 shadow-md rounded p-8">
      <h1 className="text-2xl font-semibold mb-6">Registar Pedido</h1>

      {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

      {mensagem && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {mensagem}
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Nome do Cliente</label>
          <input
            type="text"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Itens do Menu</label>
          {itensMenu.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum item disponível.</p>
          ) : (
            itensMenu.map((item) => (
              <div key={item.id} className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={isItemSelecionado(item.id)}
                  onChange={() => handleItemToggle(item.id)}
                />
                <span>{item.nome} - €{item.preco.toFixed(2)}</span>

                {isItemSelecionado(item.id) && (
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-sm">
                      <input
                        type="checkbox"
                        checked={
                          itensSelecionados.find((i) => i.item_id === item.id)
                            ?.para_levantar_depois || false
                        }
                        onChange={() => handleCheckboxToggle(item.id)}
                      />{' '}
                      Para levantar depois
                    </label>

                    <input
                      type="number"
                      min={1}
                      value={
                        itensSelecionados.find((i) => i.item_id === item.id)?.quantidade || 1
                      }
                      onChange={(e) =>
                        handleQuantidadeChange(item.id, Number(e.target.value))
                      }
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div>
        <label className="block font-medium">Nota do Pedido (opcional)</label>
        <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            rows={3}
            placeholder="Escreve alguma observação ou detalhe extra..."
        />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded hover:opacity-90"
          style={{
            backgroundColor: '#343a40',
            color: '#ffffff',
          }}
        >
          Registar Pedido
        </button>
      </form>

      {detalhesPedido && (
  <div className="bg-white border border-gray-300 rounded p-4 text-sm text-gray-800 mb-4">
    <p><strong>Cliente:</strong> {detalhesPedido.nome_cliente}</p>
    <p><strong>Pedido ID:</strong> {detalhesPedido.pedido_numero_diario}</p>
    <div className="mt-2 space-y-1">
  {detalhesPedido.itens.flatMap((item, index) =>
    Array.from({ length: item.quantidade }).map((_, i) => (
      <div key={`${index}-${i}`} className="flex justify-between">
        <div>
          {item.nome}{' '}
          {item.para_levantar_depois && (
            <span className="text-xs text-gray-500">(Levantar depois)</span>
          )}
        </div>
        <div>€{item.preco.toFixed(2)}</div>
      </div>
    ))
  )}
</div>

    <div className="mt-2">
      <p><strong>Nota:</strong> {detalhesPedido.nota || '—'}</p>
      <p className="mt-2 font-semibold">Total: €{detalhesPedido.total.toFixed(2)}</p>
    </div>
  </div>
)}

    </div>
    </div>
  );
}

export default VerificacaoDePermissoes(RegistarPedido, ['Administrador', 'Funcionario de Banca']);
