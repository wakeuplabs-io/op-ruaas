import { useEffect, useState } from "react";
import {
  resendSignUpCode,
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  confirmSignIn as amplifyConfirmSignIn,
  getCurrentUser,
  fetchAuthSession,
  AuthUser,
} from "aws-amplify/auth";

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const signUp = async (email: string, password: string) => {
    setLoading(true);

    try {
      const { isSignUpComplete, nextStep } = await amplifySignUp({
        username: email,
        password,
      });

      if (isSignUpComplete) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setLoading(false);
        return "DONE";
      } else {
        setLoading(false);
        return nextStep.signUpStep;
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmSignUp = (email: string, code: string) => {
    setLoading(true);

    return amplifyConfirmSignUp({
      username: email,
      confirmationCode: code,
    }).finally(() => setLoading(false));
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      const { isSignedIn, nextStep } = await amplifySignIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        return getCurrentUser()
          .then(setUser)
          .then(() => "DONE");
      } else {
        return Promise.resolve(nextStep.signInStep);
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmSignIn = (code: string) => {
    setLoading(true);

    return amplifyConfirmSignIn({ challengeResponse: code })
      .then(() => getCurrentUser())
      .then(setUser)
      .finally(() => setLoading(false));
  };

  const signOut = () => {
    setLoading(true);

    return amplifySignOut()
      .then(() => setUser(null))
      .finally(() => setLoading(false));
  };

  const getToken = async () => {
    return (await fetchAuthSession()).tokens?.idToken;
  };

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    getToken,
    confirmSignUp,
    confirmSignIn,
    resendSignUpCode,
  };
};
