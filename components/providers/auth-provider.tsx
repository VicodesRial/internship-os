"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { ProfileDatabaseRow } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

type AuthContextValue = {
  configured: boolean;
  isLoading: boolean;
  profile: ProfileDatabaseRow | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  configured,
  initialProfile,
  initialUser,
}: {
  children: ReactNode;
  configured: boolean;
  initialProfile: ProfileDatabaseRow | null;
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<ProfileDatabaseRow | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [supabase, setSupabase] = useState<BrowserSupabaseClient | null>(null);

  useEffect(() => {
    setSupabase(configured ? createClient() : null);
  }, [configured]);

  useEffect(() => {
    setUser(initialUser);
    setProfile(initialProfile);
    setIsLoading(false);
  }, [initialProfile, initialUser]);

  useEffect(() => {
    if (!supabase) return;

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoading(false);
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ configured, isLoading, profile, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
