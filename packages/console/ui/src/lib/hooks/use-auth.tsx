import { useEffect, useState } from "react";

export type AuthUser = {
  id: string
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    window.alert("TODO:")
  };


  const signOut = () => {
    setLoading(true);

    window.alert("TODO:")
  };

  const getToken = async () => {
    return ""
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    getToken,
  };
};
