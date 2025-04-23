'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 text-center">
      <div className="bg-white p-10 rounded-2xl shadow-md max-w-md w-full">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página Não Encontrada</h2>
        <p className="text-gray-500 mb-6">A página que procuras não existe ou foi movida.</p>
        <Link href="/">
          <button className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition">
            <ArrowLeft size={18} />
            Voltar ao início
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
