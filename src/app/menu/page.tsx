'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type MenuItem = {
  id: number;
  nome: string;
  preco: number;
  tipo: string;
};

type GroupedMenu = {
  [tipo: string]: MenuItem[];
};

export default function Menu() {
  const [groupedMenuItems, setGroupedMenuItems] = useState<GroupedMenu>({});
  const [sortOrderMap, setSortOrderMap] = useState<Record<string, 'asc' | 'desc'>>({});

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('itens')
      .select('id, nome, preco, tipo')
      .eq('isMenu', true);

    if (error) {
      console.error('Erro ao carregar itens do menu', error);
      return;
    }

    const grouped: GroupedMenu = {};
    data.forEach((item: MenuItem) => {
      if (!grouped[item.tipo]) grouped[item.tipo] = [];
      grouped[item.tipo].push(item);
    });

    const sortedGrouped: GroupedMenu = {};
    for (const tipo in grouped) {
      const sortOrder = sortOrderMap[tipo] || 'asc';
      sortedGrouped[tipo] = grouped[tipo].sort((a, b) =>
        sortOrder === 'asc' ? a.preco - b.preco : b.preco - a.preco
      );
    }

    setGroupedMenuItems(sortedGrouped);
  };

  useEffect(() => {
    fetchMenuItems();
  }, [sortOrderMap]);

  const toggleSortOrder = (tipo: string) => {
    setSortOrderMap((prev) => ({
      ...prev,
      [tipo]: prev[tipo] === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <main className="w-full px-6 py-10 overflow-y-scroll" style={{ backgroundColor: '#e5e7eb' }}>
      <h1 className="text-3xl font-semibold mb-8" style={{ color: '#2f2f2f' }}>
        Menu
      </h1>

      {Object.entries(groupedMenuItems).map(([tipo, items]) => (
        <section key={tipo} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold" style={{ color: '#343a40' }}>
              {tipo}
            </h2>
            <button
              onClick={() => toggleSortOrder(tipo)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
            >
              Ordenar por Preço ({sortOrderMap[tipo] === 'desc' ? 'Menor a Maior' : 'Maior a Menor'})
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="p-6 rounded shadow-md bg-white">
                <h3 className="text-xl font-medium mb-1">{item.nome}</h3>
                <p className="text-sm mb-2 text-gray-500">{item.tipo}</p>
                <p className="font-semibold text-gray-800">€{item.preco.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
