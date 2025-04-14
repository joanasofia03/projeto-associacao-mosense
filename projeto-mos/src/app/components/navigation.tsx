'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('tipo')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setUserType(data.tipo);
        }
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('tipo')
          .eq('id', session.user.id)
          .single();
          
        if (data && !error) {
          setUserType(data.tipo);
        }
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserType(null);
    router.push('/login');
  };

  return (
    <nav className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: '#e9ecef' }}>
      <Link href="/" className="text-xl font-bold" style={{ color: '#2f2f2f' }}>
        Comissão de Festas das Mós
      </Link>

      <div className="flex items-center space-x-6">
        <Link href="/menu" className="hover:underline" style={{ color: '#6c757d' }}>
          Menu
        </Link>

        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <Link
            href="/anularpedido"
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#6c757d',
              color: '#ffffff',
            }}
          >
            Anular Pedido
          </Link>
        )}

        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <Link
            href="/registarpedido"
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#6c757d',
              color: '#ffffff',
            }}
          >
            Registar Pedido
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/adicionaritem"
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#6c757d',
              color: '#ffffff',
            }}
          >
            Adicionar Item
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/alteraritem"
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#6c757d',
              color: '#ffffff',
            }}
          >
            Alterar Item
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/adicionarutilizador"
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#6c757d',
              color: '#ffffff',
            }}
          >
            Adicionar Utilizador
          </Link>
        )}

        {!isLoggedIn ? (
          <Link
            href="/login"
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#343a40',
              color: '#ffffff',
            }}
          >
            Log In
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#dc3545',
              color: '#ffffff',
            }}
          >
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
};
