
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getUserProfile, createUserProfile } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher';
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, role: 'student' | 'teacher') => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Загрузка профиля пользователя
  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Обновление профиля пользователя
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Получение текущей сессии и установка слушателя изменений авторизации
    const getSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      
      setLoading(false);

      // Настройка слушателя для изменений в авторизации
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log("Auth state changed:", _event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };

    getSession();
  }, []);

  const signUp = async (email: string, password: string, role: 'student' | 'teacher') => {
    console.log("Starting registration for:", email, "with role:", role);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: window.location.origin + '/login'
      }
    });

    if (!error && data.user) {
      console.log("User registered successfully:", data.user.id);
      
      // Создаем профиль пользователя сразу после успешной регистрации
      try {
        console.log("Creating user profile for:", data.user.id);
        
        const profileResult = await createUserProfile(data.user.id, {
          email,
          role,
          first_name: '',
          last_name: ''
        });
        
        if (profileResult.error) {
          console.error("Failed to create profile:", profileResult.error);
        } else {
          console.log("Profile created successfully");
        }
        
        // Автоматически входим в систему после регистрации
        const signInResult = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInResult.error) {
          console.error("Auto sign-in failed:", signInResult.error);
        } else {
          console.log("Auto sign-in successful");
        }
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    } else if (error) {
      console.error("Registration error:", error);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userProfile,
      signIn, 
      signUp, 
      signOut,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
