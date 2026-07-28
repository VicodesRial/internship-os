"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ProfileDatabaseRow } from "@/lib/database.types";

export type AccountIdentity = {
  email: string;
  id: string;
};

type AuthContextValue = {
  account: AccountIdentity | null;
  configured: boolean;
  nonce: string | undefined;
  profile: ProfileDatabaseRow | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  configured,
  initialAccount,
  initialProfile,
  nonce,
}: {
  children: ReactNode;
  configured: boolean;
  initialAccount: AccountIdentity | null;
  initialProfile: ProfileDatabaseRow | null;
  nonce: string | undefined;
}) {
  return (
    <AuthContext.Provider
      value={{
        account: initialAccount,
        configured,
        nonce,
        profile: initialProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
