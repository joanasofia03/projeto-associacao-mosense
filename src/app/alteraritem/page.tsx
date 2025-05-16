'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Toast from '../components/toast';

//Import de icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit, MdKeyboardArrowDown } from "react-icons/md";

type Item = {
  id: string;
  nome: string;
  preco: number;
  tipo: string;
  criado_em: string;
  isMenu: boolean;
  IVA?: number;
  imagem_url?: string | null;
};

function AlterarItem() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tudo');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('itens')
        .select('id, nome, preco, tipo, criado_em, isMenu, IVA, imagem_url')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar itens:', error);
        showToast('Erro ao carregar os itens', 'error');
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
    
    // Reset o estado da imagem
    resetImagemInput();
    
    // Se o item tiver uma imagem, definir preview
    if (item.imagem_url) {
      setImagemPreview(item.imagem_url);
    }
  };

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagem(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImagemInput = () => {
    setImagem(null);
    setImagemPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Se estiver em modo de edição e o item tiver uma imagem_url, restaurar o preview
    if (editingItem?.imagem_url) {
      setImagemPreview(editingItem.imagem_url);
    }
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.nome || !editingItem.tipo) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
  
    const nomeTrimmed = editingItem.nome.trim();
    setToastVisible(false); // reset toast
    
    try {
      const { data: existingItems, error: fetchError } = await supabase
        .from('itens')
        .select('id')
        .ilike('nome', nomeTrimmed)
        .eq('tipo', editingItem.tipo);
  
      if (fetchError) {
        console.error('Erro ao verificar duplicação de nome:', fetchError);
        showToast('Erro ao verificar duplicação de nome', 'error');
        return;
      }
  
      const isDuplicate = existingItems.some(item => item.id !== editingItem.id);
      if (isDuplicate) {
        showToast('Já existe outro item com o mesmo nome e tipo', 'error');
        return;
      }
      
      // Upload da imagem se existir uma nova
      let imagemUrl = editingItem.imagem_url || null;
      if (imagem) {
        const imagemNome = `${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

        const { error: uploadError } = await supabase.storage
          .from('imagens')
          .upload(imagemNome, imagem, {
            contentType: imagem.type,
          });

        if (uploadError) {
          showToast('Erro ao fazer upload da imagem', 'error');
          console.error('Erro no upload:', uploadError);
          return;
        }

        // Espera 1 segundo para garantir consistência eventual
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('imagens')
          .createSignedUrl(imagemNome, 60 * 60 * 24 * 365 * 5);

        if (signedUrlError) {
          showToast('Erro ao gerar URL temporária da imagem', 'error');
          console.error('Erro URL temporária:', signedUrlError);
          return;
        }

        imagemUrl = signedUrlData?.signedUrl || null;
      }
  
      const { error } = await supabase
        .from('itens')
        .update({
          nome: nomeTrimmed,
          preco: editingItem.preco,
          tipo: editingItem.tipo,
          isMenu: editingItem.isMenu,
          IVA: editingItem.IVA || 23,
          imagem_url: imagemUrl,
        })
        .eq('id', editingItem.id);
  
      if (error) {
        console.error('Erro ao atualizar item:', error);
        showToast('Erro ao atualizar item', 'error');
      } else {
        console.log('Item atualizado com sucesso!');
        setItems(items.map(item => 
          item.id === editingItem.id ? { 
            ...item, 
            ...editingItem, 
            nome: nomeTrimmed,
            imagem_url: imagemUrl
          } : item
        ));
        showToast('Item atualizado com sucesso!', 'success');
        setIsModalOpen(false);
        setEditingItem(null);
        resetImagemInput();
      }
    } catch (err) {
      console.error('Erro ao guardar item:', err);
      showToast('Erro desconhecido ao salvar o item', 'error');
    }
  };  

    const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este item?');
    if (!confirmDelete) return;

    try {
      const { data: itemData, error: fetchError } = await supabase
        .from('itens')
        .select('imagem_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar item:', fetchError);
        showToast('Erro ao excluir item', 'error');
        return;
      }

      // Remover imagem do storage se existir
      if (itemData?.imagem_url) {
        // Extrair o nome do arquivo da URL assinada
        const url = new URL(itemData.imagem_url);
        const pathname = url.pathname;
        const regex = /\/imagens\/(.+)$/;
        const match = pathname.match(regex);
        if (match && match[1]) {
          const imageName = match[1];
          const { error: deleteError } = await supabase.storage
            .from('imagens')
            .remove([imageName]);
          if (deleteError) {
            console.error('Erro ao excluír imagem:', deleteError);
            // Pode mostrar toast, mas não interromper exclusão do item
          }
        }
      }

      const { error: deleteItemError } = await supabase.from('itens').delete().eq('id', id);

      if (deleteItemError) {
        console.error('Erro ao excluir item:', deleteItemError);
        showToast('Erro ao excluir o item', 'error');
      } else {
        setItems(items.filter(item => item.id !== id));
        showToast('Item excluído com sucesso!', 'success');
      }
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      showToast('Erro desconhecido ao excluir o item', 'error');
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
    } else if (name === 'IVA') {
      setEditingItem({ ...editingItem, [name]: parseInt(value) || 23 });
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
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
                        <h3 className="text-xl text-[#032221] font-semibold truncate">{item.nome}</h3>
                        <span className="px-3 py-1 bg-[#DDEB9D] text-[#032221] text-xs font-medium rounded-full">
                          {item.tipo}
                        </span>
                      </div>
                    </div>
                    
                    {/* Conteúdo do card */}
                    <div className="p-5 flex-grow">
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[#032221]">Preço:</span>
                          <span className="text-[#032221] font-semibold">€{item.preco.toFixed(2)}</span>
                        </div>
                        
                        {item.IVA !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-[#032221]">IVA:</span>
                            <span className="text-[#032221] font-semibold">{item.IVA}%</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[#032221]">Menu:</span>
                          <span className={`font-medium ${item.isMenu ? 'text-[#A4B465]' : 'text-[#D2665A]'}`}>
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
                          className="bg-[#DDEB9D] text-[#032221] cursor-pointer py-2 px-4 rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center"
                        >
                          <MdOutlineEdit size='4' className="h-4 w-4 mr-1"/>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-[rgba(210,102,90,0.1)] cursor-pointer text-[#D2665A] py-2 px-4 rounded-md font-medium hover:bg-[rgba(210,102,90,0.15)] transition-colors flex items-center justify-center"
                        >
                          <RiDeleteBin6Line size='4' className="h-4 w-4 mr-1"/>
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

      {/* Modal de Edição - Novo estilo baseado no AdicionarItem */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-[#eaf2e9] flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF6] rounded-lg w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="bg-[#032221] text-[#FFFDF6] py-4 px-6 rounded-t-lg">
              <h3 className="text-xl font-semibold">Editar Item</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="nome" className="block mb-1 text-sm font-medium text-[#032221]">
                  Nome do Item
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={editingItem.nome}
                  onChange={handleInputChange}
                  className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="preco" className="block mb-1 text-sm font-medium text-[#032221]">
                  Preço (€)
                </label>
                <input
                  type="number"
                  id="preco"
                  name="preco"
                  value={editingItem.preco}
                  onChange={handleInputChange}
                  className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              
              {/* Dropdown Estilizado - Tipo */}
              <div>
                <label htmlFor="tipo" className="block mb-1 text-sm font-medium text-[#032221]">
                  Tipo
                </label>
                <div className="relative">
                  <select
                    id="tipo"
                    name="tipo"
                    value={editingItem.tipo}
                    onChange={handleInputChange}
                    className="w-full border border-[#032221] rounded-lg px-3 py-2 appearance-none bg-transparent focus:outline-none focus:ring-1 focus:ring-[#032221]"
                    required
                  >
                    {filterCategories.filter(cat => cat !== 'Tudo').map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#032221]">
                    <MdKeyboardArrowDown size={4} className='fill-current h-4 w-4' />
                  </div>
                </div>
              </div>
              
              {/* Taxa de IVA */}
              <div>
                <label htmlFor="IVA" className="block mb-1 text-sm font-medium text-[#032221]">
                  IVA (%)
                </label>
                <div className="relative">
                  <select
                    id="IVA"
                    name="IVA"
                    value={editingItem.IVA || 23}
                    onChange={handleInputChange}
                    className="w-full border border-[#032221] rounded-lg px-3 py-2 appearance-none bg-transparent focus:outline-none focus:ring-1 focus:ring-[#032221]"
                  >
                    <option value="23">23% (Padrão)</option>
                    <option value="13">13% (Intermédio)</option>
                    <option value="6">6% (Reduzido)</option>
                    <option value="0">0% (Isento)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#032221]">
                    <MdKeyboardArrowDown size={4} className='fill-current h-4 w-4' />
                  </div>
                </div>
              </div>
              
              {/* Upload de Imagem */}
              <div>
                <label htmlFor="imagem" className="block mb-1 text-sm font-medium text-[#032221]">
                  Imagem do Item
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    id="imagem"
                    ref={fileInputRef}
                    onChange={handleImagemChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[rgba(3,98,76,0.2)] text-[#032221] rounded-lg transition-transform duration-200 hover:scale-101 cursor-pointer flex-grow"
                    >
                      {imagem ? 'Trocar Imagem' : 'Selecionar Imagem'}
                    </button>
                    {(imagem || imagemPreview) && (
                      <button
                        type="button"
                        onClick={() => {
                          resetImagemInput();
                          if (editingItem) {
                            setEditingItem({...editingItem, imagem_url: null});
                          }
                          setImagemPreview(null);
                        }}
                        className="px-4 py-2 bg-[#D2665A] text-white rounded-lg hover:bg-opacity-90 cursor-pointer transition-transform duration-200 hover:scale-101"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  {imagemPreview && (
                    <div className="mt-2 border border-[#032221] rounded-lg p-2">
                      <img
                        src={imagemPreview}
                        alt="Pré-visualização"
                        className="w-full h-48 object-contain rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {imagem ? imagem.name : 'Imagem atual'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMenu"
                  name="isMenu"
                  checked={editingItem.isMenu}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-[#032221] focus:ring-[#032221]"
                />
                <label htmlFor="isMenu" className="text-sm text-[#032221]">
                  Este item faz parte de um menu?
                </label>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetImagemInput();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer transition-transform duration-200 hover:scale-101"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#032221] text-white rounded-md hover:bg-opacity-90 cursor-pointer transition-transform duration-200 hover:scale-101"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
      />

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