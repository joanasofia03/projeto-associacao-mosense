'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function AdicionarItem() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState(0);
  const [tipo, setTipo] = useState('');
  const [isMenu, setIsMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setError(null);

    try {
      const { data, error } = await supabase.from('itens').insert([
        {
          nome,
          preco,
          tipo,
          isMenu,
          criado_em: new Date().toISOString(),
        },
      ]);

      setLoading(false);

      if (error) {
        setError('Ocorreu um erro ao adicionar o item.');
        console.error(error.message);
      } else {
        setSuccessMessage('Item adicionado com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setNome('');
        setPreco(0);
        setTipo('');
        setIsMenu(false);
      }
    } catch (err) {
      setLoading(false);
      setError('Erro desconhecido ao adicionar o item.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-gray-800 shadow-md rounded p-8">
        <h1 className="text-2xl font-semibold mb-6">Adicionar Novo Item</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {successMessage && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block mb-1 text-sm font-medium">
              Nome do Item
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="preco" className="block mb-1 text-sm font-medium">
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
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
              step="0.1"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="tipo" className="block mb-1 text-sm font-medium">
              Tipo
            </label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            >
              <option value="">Selecione...</option>
              <option value="Comida">Comida</option>
              <option value="Bebida">Bebida</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isMenu}
              onChange={(e) => setIsMenu(e.target.checked)}
              id="isMenu"
              className="mr-2"
            />
            <label htmlFor="isMenu" className="text-sm">Incluir no Menu</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded hover:opacity-90 ${
              loading ? 'cursor-not-allowed opacity-60' : ''
            }`}
            style={{
              backgroundColor: '#343a40',
              color: '#ffffff',
            }}
          >
            {loading ? 'Carregando...' : 'Adicionar Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
