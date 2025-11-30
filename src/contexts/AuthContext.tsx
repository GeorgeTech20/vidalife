import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/health";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        return true;
      } else {
        setProfile(null);
        return false;
      }
    } catch (err) {
      console.error("[AuthContext] Error fetching profile:", err);
      setProfile(null);
      return false;
    }
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          if (isMounted) {
            await fetchProfile(session.user.id);
            if (isMounted) {
              setLoading(false);
            }
          }
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
