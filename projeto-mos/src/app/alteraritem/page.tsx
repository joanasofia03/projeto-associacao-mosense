'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type Item = {
  id: string;
  nome: string;
  preco: number;
  tipo: string;
  criado_em: string;
  isMenu: boolean;
};

export default function AlterarItem() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Partial<Item>>({});

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('itens')
        .select('id, nome, preco, tipo, criado_em, isMenu')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar itens:', error);
      } else {
        setItems(data || []);
      }

      setLoading(false);
    };

    fetchItems();
  }, []);

  const handleEditClick = (index: number) => {
    setEditIndex(index);
    setEditItem({ ...items[index] });
  };

  const handleSave = async () => {
    if (editIndex === null || !editItem.nome) return;

    try {
      const { error } = await supabase
        .from('itens')
        .update({
          nome: editItem.nome,
          preco: editItem.preco,
          tipo: editItem.tipo,
          isMenu: editItem.isMenu,
        })
        .eq('id', items[editIndex].id);

      if (error) {
        console.error('Erro ao atualizar item:', error);
      } else {
        console.log('Item atualizado com sucesso!');
        const updatedItems = [...items];
        updatedItems[editIndex] = editItem as Item;
        setItems(updatedItems);
        setEditIndex(null);
      }
    } catch (err) {
      console.error('Erro ao guardar item:', err);
    }
  };

  const handleDelete = async (id: string, index: number) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este item?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('itens').delete().eq('id', id);

      if (error) {
        console.error('Erro ao excluir item:', error);
      } else {
        console.log('Item excluído com sucesso!');
        const updatedItems = [...items];
        updatedItems.splice(index, 1);
        setItems(updatedItems);
      }
    } catch (err) {
      console.error('Erro ao excluir item:', err);
    }
  };

  const comidas = items.filter((item) => item.tipo === 'Comida');
  const bebidas = items.filter((item) => item.tipo === 'Bebida');

  const ItemList = ({ titulo, lista }: { titulo: string; lista: Item[] }) => (
    <div className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">{titulo}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((item) => {
          const index = items.findIndex((i) => i.id === item.id);
          return (
            <div key={item.id} className="p-6 rounded shadow-md bg-white">
              {editIndex === index ? (
                <div className="space-y-2">
                  <input
                    className="w-full border px-2 py-1 rounded"
                    value={editItem.nome || ''}
                    onChange={(e) => setEditItem({ ...editItem, nome: e.target.value })}
                  />
                  <input
                    className="w-full border px-2 py-1 rounded"
                    type="number"
                    value={editItem.preco || ''}
                    onChange={(e) => setEditItem({ ...editItem, preco: Number(e.target.value) })}
                  />
                  <input
                    className="w-full border px-2 py-1 rounded"
                    value={editItem.tipo || ''}
                    onChange={(e) => setEditItem({ ...editItem, tipo: e.target.value })}
                  />
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editItem.isMenu || false}
                      onChange={(e) => setEditItem({ ...editItem, isMenu: e.target.checked })}
                    />
                    <span>Incluído no menu</span>
                  </label>
                  <button
                    onClick={handleSave}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditIndex(null)}
                    className="ml-2 text-sm text-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-medium mb-1">{item.nome}</h2>
                  <p className="text-sm mb-1 text-gray-500">{item.tipo}</p>
                  <p className="font-semibold text-gray-800">€{item.preco.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Criado em: {new Date(item.criado_em).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.isMenu ? 'Incluído no menu' : 'Não está no menu'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => handleEditClick(index)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, index)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen px-6 py-10" style={{ backgroundColor: '#f8f9fa' }}>
      <h1 className="text-3xl font-semibold mb-8 text-gray-800">Todos os Itens</h1>

      {loading ? (
        <p>A carregar...</p>
      ) : items.length === 0 ? (
        <p>Nenhum item encontrado.</p>
      ) : (
        <>
          <ItemList titulo="Comidas" lista={comidas} />
          <ItemList titulo="Bebidas" lista={bebidas} />
        </>
      )}
    </main>
  );
}
