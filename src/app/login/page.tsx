'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Ocorreu um erro.');
        console.log(error.message)
        
      } else {
        setUser(data?.user);
        setSuccessMessage('Login efetuado com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Ocorreu um erro.');
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('nome, tipo')
          .eq('id', user.id)
          .single();
        if (error) {
          console.error('Error fetching user profile:', error.message);
        } else {
          setUserProfile(data);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <div className="min-h-screen overflow-hidden p-0 m-0 flex items-center justify-center flex-col">
      <div className="w-full max-w-lg text-[#032221] shadow-md rounded p-8">
        <h1 className="text-2xl text-[#032221] font-semibold mb-6">Iniciar sessão na sua conta </h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {successMessage && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-[#032221]">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-[#032221]">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#032221',
              color: '#f1f7f6',
            }}
          >
            Log In
          </button>
        </form>

        {/* {userProfile && (
          <div className="mt-6">
            <h2 className="font-semibold">User Info:</h2>
            <p>Name: {userProfile.nome}</p>
            <p>Type: {userProfile.tipo}</p>
          </div>
        )} */}
      </div>
    </div>
  );
}
