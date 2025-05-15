'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

type Item = {
  id: string;
  nome: string;
  preco: number;
  tipo: string;
  criado_em: string;
  isMenu: boolean;
};

function AlterarItem() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tudo');

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

  const handleEditClick = (item: Item) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.nome || !editingItem.tipo) return;
  
    const nomeTrimmed = editingItem.nome.trim();
  
    try {
      const { data: existingItems, error: fetchError } = await supabase
        .from('itens')
        .select('id')
        .ilike('nome', nomeTrimmed)
        .eq('tipo', editingItem.tipo);
  
      if (fetchError) {
        console.error('Erro ao verificar duplicação de nome:', fetchError);
        return;
      }
  
      const isDuplicate = existingItems.some(item => item.id !== editingItem.id);
      if (isDuplicate) {
        alert('Já existe outro item com o mesmo nome e tipo.');
        return;
      }
  
      const { error } = await supabase
        .from('itens')
        .update({
          nome: nomeTrimmed,
          preco: editingItem.preco,
          tipo: editingItem.tipo,
          isMenu: editingItem.isMenu,
        })
        .eq('id', editingItem.id);
  
      if (error) {
        console.error('Erro ao atualizar item:', error);
      } else {
        console.log('Item atualizado com sucesso!');
        setItems(items.map(item => 
          item.id === editingItem.id ? { ...item, ...editingItem, nome: nomeTrimmed } : item
        ));
        setIsModalOpen(false);
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Erro ao guardar item:', err);
    }
  };  

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este item?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('itens').delete().eq('id', id);

      if (error) {
        console.error('Erro ao excluir item:', error);
      } else {
        console.log('Item excluído com sucesso!');
        setItems(items.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Erro ao excluir item:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (!editingItem) return;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditingItem({ ...editingItem, [name]: checked });
    } else if (name === 'preco') {
      setEditingItem({ ...editingItem, [name]: parseFloat(value) || 0 });
    } else {
      setEditingItem({ ...editingItem, [name]: value });
    }
  };

  // Filtros
  const filteredItems = activeFilter === 'Tudo' 
    ? items 
    : items.filter(item => item.tipo === activeFilter);

  // Categorias para os botões de filtro
  const filterCategories = ['Tudo', 'Sopas', 'Comida', 'Sobremesas', 'Bebida', 'Álcool', 'Brindes'];

  return (
    <main className="h-full bg-[#eaf2e9] overflow-y-scroll">
      {/* Cabeçalho */}
      <div className="bg-[#eaf2e9] text-[#032221] pt-5 px-10">
        <h1 className="text-3xl font-bold">Gerir Itens - Edição ou Exclusão</h1>
      </div>

      {/* Filtros - Estilo atualizado baseado no VerEstatisticas */}
      <div className="bg-[#eaf2e9] w-full h-12 flex flex-row justify-start items-center px-10 gap-4 mt-2">
        <div className="flex flex-row justify-start items-center gap-4">
          {filterCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`flex justify-center items-center px-3 py-2 text-sm font-semibold rounded-lg ease-in-out duration-200 shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1 cursor-pointer
                ${
                  activeFilter === category
                    ? 'bg-[#032221] text-[#FFFDF6]'
                    : 'bg-[#FFFDF6] text-[#032221] hover:bg-[#dce6e7]'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo principal */} 
      <div className="w-full py-2 px-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#032221]"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-lg text-gray-600">Nenhum item encontrado para esta categoria.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const dataFormatada = new Date(item.criado_em).toLocaleDateString();
              const horaFormatada = new Date(item.criado_em).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex flex-col">
                    {/* Cabeçalho do card */}
                    <div className="text-[#032221] p-4 border-b-1 border-[rgba(32,41,55,0.1)]">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold truncate">{item.nome}</h3>
                        <span className="px-3 py-1 bg-[#DDEB9D] text-[#032221] text-xs font-medium rounded-full">
                          {item.tipo}
                        </span>
                      </div>
                    </div>
                    
                    {/* Conteúdo do card */}
                    <div className="p-5 flex-grow">
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Preço:</span>
                          <span className="text-[#032221] font-bold">€{item.preco.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Menu:</span>
                          <span className={`font-medium ${item.isMenu ? 'text-green-600' : 'text-red-600'}`}>
                            {item.isMenu ? 'Incluído' : 'Não incluído'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Criado em:</span>
                          <span>{dataFormatada} às {horaFormatada}</span>
                        </div>
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="bg-[#DDEB9D] text-[#032221] py-2 px-4 rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-50 text-red-600 py-2 px-4 rounded-md font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="bg-[#032221] text-[#FFFDF6] py-4 px-6 rounded-t-lg">
              <h3 className="text-xl font-semibold">Editar Item</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    name="nome"
                    value={editingItem.nome}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#DDEB9D] focus:border-[#DDEB9D]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (€)</label>
                  <input
                    type="number"
                    name="preco"
                    step="0.01"
                    value={editingItem.preco}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#DDEB9D] focus:border-[#DDEB9D]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    name="tipo"
                    value={editingItem.tipo}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#DDEB9D] focus:border-[#DDEB9D]"
                  >
                    {filterCategories.filter(cat => cat !== 'Tudo').map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isMenu"
                    name="isMenu"
                    checked={editingItem.isMenu}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#032221] focus:ring-[#DDEB9D] border-gray-300 rounded"
                  />
                  <label htmlFor="isMenu" className="ml-2 block text-sm text-gray-700">
                    Incluído no Menu
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#032221] text-white rounded-md hover:bg-opacity-90"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos global para remover a barra de rolagem visível */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}

export default VerificacaoDePermissoes(AlterarItem, ['Administrador', 'Funcionario de Banca']);