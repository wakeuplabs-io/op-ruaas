import { useEffect, useState } from "react";
import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  AuthUser,
} from "aws-amplify/auth";

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const signUp = (email: string, password: string) => {
    setLoading(true);

    amplifySignUp({ username: email, password })
      .then(() => getCurrentUser())
      .finally(() => setLoading(false));
  };

  const signIn = (email: string, password: string) => {
    setLoading(true);

    amplifySignIn({ username: email, password })
      .then(() => getCurrentUser())
      .finally(() => setLoading(false));
  };

  const signOut = () => {
    setLoading(true);

    amplifySignOut()
      .then(() => setUser(null))
      .finally(() => setLoading(false));
  };

  const getToken = async () => {
    (await fetchAuthSession()).tokens?.accessToken;
  };

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    getToken,
  };
};
