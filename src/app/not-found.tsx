'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#eaf2e9] px-6 text-center">
      <div className="bg-[#f1f6f7] p-10 rounded-2xl shadow-md max-w-md w-full">
        <h1 className="text-5xl font-semibold text-[#032221] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#032221] mb-2">Página Não Encontrada</h2>
        <p className="text-[#032221] mb-6">A página que procuras não existe ou foi movida.</p>
        <Link href="/">
          <button
            type="submit"
            className="w-full py-2 rounded flex items-center justify-center gap-2 hover:opacity-90"
            style={{
              backgroundColor: '#032221',
              color: '#f1f7f6',
            }}
          >
            <ArrowLeft size={18} />
            Voltar ao início
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
