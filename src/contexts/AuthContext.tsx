import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppRole = "student" | "creator" | "admin" | "lider" | "analista";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_role: string | null;
  team: string | null;
  regional: string | null;
  points: number;
  badges_count: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper to get untyped supabase client for tables not yet in types
const getSupabaseClient = () => supabase as unknown as SupabaseClient;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const validateEmailDomain = (email: string): boolean => {
    return email.endsWith("@addi.com");
  };

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`Timeout after ${ms}ms: ${label}`));
      }, ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const client = getSupabaseClient();
      
      const { data: profileData, error: profileError } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData as Profile);
        
        // Update last login
        await client
          .from("profiles")
          .update({ last_login: new Date().toISOString() })
          .eq("user_id", userId);
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        return;
      }

      if (rolesData) {
        setRoles((rolesData as { role: AppRole }[]).map((r) => r.role));
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session first
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          7000,
          "auth.getSession"
        );
        
        if (!mounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          if (!validateEmailDomain(session.user.email || "")) {
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
          
          setSession(session);
          setUser(session.user);

          // IMPORTANT: don't block initial render on profile/roles.
          // A slow/blocked profile query would keep the whole app stuck in "Cargando...".
          void withTimeout(fetchUserProfile(session.user.id), 7000, "fetchUserProfile").catch((e) => {
            console.error("Profile bootstrap failed:", e);
          });
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        // Skip if this is the initial session
        if (event === 'INITIAL_SESSION') return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Validate email domain
          if (!validateEmailDomain(newSession.user.email || "")) {
            await supabase.auth.signOut();
            toast({
              title: "Acceso denegado",
              description: "Solo se permiten correos con dominio @addi.com",
              variant: "destructive",
            });
            return;
          }

          // Keep UI responsive; load profile/roles in background.
          void withTimeout(fetchUserProfile(newSession.user.id), 7000, "fetchUserProfile").catch((e) => {
            console.error("Profile refresh failed:", e);
          });
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            hd: "addi.com", // Restrict to addi.com domain
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!validateEmailDomain(email)) {
        toast({
          title: "Acceso denegado",
          description: "Solo se permiten correos con dominio @addi.com",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      if (!validateEmailDomain(email)) {
        toast({
          title: "Acceso denegado",
          description: "Solo se permiten correos con dominio @addi.com",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Cuenta creada",
        description: "Tu cuenta ha sido creada exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al crear cuenta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
