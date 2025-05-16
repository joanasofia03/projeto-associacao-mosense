'use client';

import { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Toast from '../components/toast';

import { MdKeyboardArrowDown } from "react-icons/md";

function AdicionarItem() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState(0);
  const [tipo, setTipo] = useState('');
  const [isMenu, setIsMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taxaIVA, setTaxaIVA] = useState(23); // Default IVA em Portugal
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
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
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastVisible(false); // reset toast

    try {
      const { data: existingItems, error: fetchError } = await supabase
        .from('itens')
        .select('id')
        .ilike('nome', nome.trim());

      if (fetchError) {
        showToast('Erro ao verificar duplicação de nome.', 'error');
        console.error(fetchError);
        setLoading(false);
        return;
      }

      if (existingItems && existingItems.length > 0) {
        showToast('Já existe um item com esse nome.', 'error');
        setLoading(false);
        return;
      }

      // Upload da imagem se existir
      let imagemUrl = null;
      if (imagem) {
        const imagemNome = `${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

        console.log('Arquivo para upload:', imagem);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('imagens')
          .upload(imagemNome, imagem, {
            contentType: imagem.type,
          });

        if (uploadError) {
          showToast('Erro ao fazer upload da imagem.', 'error');
          console.error('Erro no upload:', uploadError);
          setLoading(false);
          return;
        }

        console.log('uploaded data', uploadData);

        // espera 1 segundo para garantir consistência eventual
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: listaArquivos, error: listError } = await supabase.storage
          .from('imagens')
          .list('');

        if (listError) {
          console.error('Erro ao listar arquivos no bucket:', listError);
        } else {
          console.log('Arquivos atualmente no bucket:', listaArquivos);
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('imagens')
          .createSignedUrl(imagemNome, 60 * 60 * 24 * 365 * 5);

        if (signedUrlError) {
          showToast('Erro ao gerar URL temporária da imagem.', 'error');
          console.error('Erro URL temporária:', signedUrlError);
          setLoading(false);
          return;
        }

        imagemUrl = signedUrlData?.signedUrl || null;

        console.log("imageurl:", imagemUrl);
      }

      const { error: insertError } = await supabase.from('itens').insert([
        {
          nome: nome.trim(),
          preco,
          tipo,
          isMenu,
          IVA: taxaIVA,
          imagem_url: imagemUrl,
          criado_em: new Date().toISOString(),
        },
      ]);

      setLoading(false);

      if (insertError) {
        showToast('Ocorreu um erro ao adicionar o item.', 'error');
        console.error(insertError.message);
      } else {
        showToast('Item adicionado com sucesso!', 'success');
        setNome('');
        setPreco(0);
        setTipo('');
        setIsMenu(false);
        setTaxaIVA(23);
        resetImagemInput();
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setLoading(false);
      showToast('Erro desconhecido ao adicionar o item.', 'error');
    }
  };

  const tiposOptions = [
    { value: "", label: "Selecione..." },
    { value: "Sopas", label: "Sopas" },
    { value: "Comida", label: "Comida" },
    { value: "Sobremesas", label: "Sobremesas" },
    { value: "Bebida", label: "Bebida" },
    { value: "Álcool", label: "Álcool" },
    { value: "Brindes", label: "Brindes" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <div className="w-full max-w-md bg-[#FFFDF6] rounded-lg p-8 shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
        <h1 className="text-2xl font-semibold mb-2 text-[#032221]">Adicionar Novo Item</h1>

        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block mb-1 text-sm font-medium text-[#032221]">
              Nome do Item
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
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
              value={preco}
              onChange={(e) => {
                const valor = parseFloat(e.target.value);
                setPreco(isNaN(valor) ? 0 : valor);
              }}
              className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              required
              step="0.1"
              min="0"
            />
          </div>

          {/* Dropdown Estilizado */}
          <div>
            <label htmlFor="tipo" className="block mb-1 text-sm font-medium text-[#032221]">
              Tipo
            </label>
            <div className="relative">
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border border-[#032221] rounded-lg px-3 py-2 appearance-none bg-transparent focus:outline-none focus:ring-1 focus:ring-[#032221]"
                required
              >
                {tiposOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#032221]">
                <MdKeyboardArrowDown size={4} className='fill-current h-4 w-4' />
              </div>
            </div>
          </div>

          {/* Novo Campo: Taxa de IVA */}
          <div>
            <label htmlFor="taxaIVA" className="block mb-1 text-sm font-medium text-[#032221]">
              IVA (%)
            </label>
            <div className="relative">
              <select
                id="taxaIVA"
                value={taxaIVA}
                onChange={(e) => setTaxaIVA(Number(e.target.value))}
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
                {imagem && (
                  <button
                    type="button"
                    onClick={resetImagemInput}
                    className="px-4 py-2 bg-[#D2665A] text-white rounded-lg hover:bg-opacity-90"
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
                  <p className="text-xs text-gray-500 mt-1">{imagem?.name || 'Imagem selecionada'}</p>
                </div>
              )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isMenu"
          checked={isMenu}
          onChange={() => setIsMenu(!isMenu)}
          className="w-4 h-4 rounded border-[#032221] focus:ring-[#032221]"
        />
        <label htmlFor="isMenu" className="text-sm text-[#032221]">
          Incluír no menu?
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d] transition-transform duration-200 hover:scale-101 cursor-pointer ${
          loading ? 'cursor-not-allowed opacity-60' : ''
        }`}
      >
        {loading ? 'Carregando...' : 'Adicionar Item'}
      </button>
    </form>
  </div>

  {/* Toast */}
  <Toast
    message={toastMessage}
    visible={toastVisible}
    onClose={() => setToastVisible(false)}
    type={toastType}
  />
</div>
);
}

export default VerificacaoDePermissoes(AdicionarItem, ['Administrador', 'Funcionario de Banca']);
