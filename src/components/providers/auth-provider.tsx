"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

import type { AppContextSnapshot } from "@/lib/app/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AuthContextValue = {
  user: User | null;
  household: AppContextSnapshot["household"];
  membership: AppContextSnapshot["membership"];
  subscription: AppContextSnapshot["subscription"];
  memberCount: number;
  isPreview: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
  initialContext: AppContextSnapshot;
};

export function AuthProvider({ children, initialContext }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialContext.user);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        household: initialContext.household,
        membership: initialContext.membership,
        subscription: initialContext.subscription,
        memberCount: initialContext.memberCount,
        isPreview: initialContext.isPreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthUser must be used within an AuthProvider.");
  }

  return context.user;
}

export function useAppContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAppContext must be used within an AuthProvider.");
  }

  return context;
}
