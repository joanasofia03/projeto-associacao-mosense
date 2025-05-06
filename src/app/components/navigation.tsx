'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkSession = async () => {
      //Tenta recuperar o estado do localStorage - permite que a sessão seja restabelecida mesmo quando se muda de aba;
      const savedSession = localStorage.getItem('session');
      
      if (savedSession) {
        const session = JSON.parse(savedSession);
        const user = session?.user;
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
      }
      
      setLoading(false);
    };
    
    checkSession();
  }, []);

  //Função de Logout
  const handleLogout = async () => { 
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserType(null);
    localStorage.removeItem('session');
    router.push('/login');
  };

  //Função de Login
  const handleLogin = async (session: any) => {
    localStorage.setItem('session', JSON.stringify(session));
    setIsLoggedIn(true);
  
    const { data, error } = await supabase
      .from('profiles')
      .select('tipo')
      .eq('id', session?.user.id)
      .single();
    
    if (data && !error) {
      setUserType(data.tipo);
    }
  };

  //Listener de mudanças na autenticação tanto de login como de logout;
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleLogin(session); //Guardar a sessão ao fazer login;
      } else {
        localStorage.removeItem('session'); //Remover a sessão ao fazer logout;
        setIsLoggedIn(false);
        setUserType(null);
      }
    });
    
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="text-center">A carregar...</div>;

  return (
    <nav className="flex-col flex items-center min-w-75 sticky fixed" style={{ backgroundColor: '#f1f6f7' }}>
      <Link href="/" className='py-6'>
        <Image src="/OsMosenses.png" alt="Logo" width={150} height={150} />
      </Link>
      <div className="border-b-1 border-gray-200 py-0 w-65"></div>

      <div className="flex flex-col space-y-6 items-center py-6 h-full">
        <Link href="/menu" className="hover:underline" style={{ color: '#2cc295' }}>
          Menu
        </Link>

        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <Link
            href="/anularpedido"
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Anular Pedido
          </Link>
        )}

        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <Link
            href="/registarpedido"
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Registar Pedido
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/adicionaritem"
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Adicionar Item
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/alteraritem"
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Alterar Item
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/adicionarutilizador"
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Adicionar Utilizador
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/verestatisticas"
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Ver Estatísticas
          </Link>
        )}

        {!isLoggedIn ? (
          <Link
            href="/login"
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Log In
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="flex justify-center w-50 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#dc3545',
              color: '#f1f7f6',
            }}
          >
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
};
