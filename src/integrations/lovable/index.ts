// Replaces Lovable cloud auth with native Supabase OAuth
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri || window.location.origin,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error };
      }

      // signInWithOAuth triggers a redirect; return redirected signal
      return { redirected: true };
    },
  },
};
