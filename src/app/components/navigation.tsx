'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

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

        {userType === 'Administrador' && (
          <Link
            href="/verestatisticas"
            className="px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#6c757d',
              color: '#ffffff',
            }}
          >
            Ver Estatísticas
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
