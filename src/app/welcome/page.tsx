'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Welcome () {
  const [profile, setProfile] = useState<{ nome: string; tipo: string } | null>(null);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, tipo')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    fetchProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile();
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!profile) return null;

  return (
    <div className="text-center flex p-2 flex-col bg-gray-200 w-full h-full">
      <p className="text-sm text-gray-500">{profile.tipo}</p>
      <h1 className="text-3xl font-bold text-gray-800 mt-1">Bem-vindo/a, {profile.nome}!</h1>
    </div>
  );
};
