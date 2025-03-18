import { SiweMessage } from "siwe";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { safeParseJSON } from "../utils";

export type AuthUser = {
  id: string;
};

export const useAuth = () => {
  const { address } = useAccount();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { signMessageAsync } = useSignMessage();

  function createSiweMessage(address: string, statement: string) {
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement,
      uri: origin,
      version: "1",
      chainId: 1,
    });
    return message.prepareMessage();
  }

  const signIn = async () => {
    setLoading(true);

    if (!address) {
      throw new Error("Wallet not connected");
    }

    const message = await createSiweMessage(
      address,
      "Sign in with Ethereum to the app."
    );

    const signature = await signMessageAsync({
      message,
      account: address,
    });

    window.localStorage.setItem(
      "siwe-token",
      JSON.stringify({ message, signature })
    );
    setUser({ id: address });
  };

  const signOut = () => {
    setLoading(true);

    window.localStorage.removeItem("siwe-token");
  };

  const getToken = () => {
    const { message, signature } = safeParseJSON(window.localStorage.getItem("siwe-token"));
    return btoa(`${message}||${signature}`);
  };

  useEffect(() => {
    try {
      const { message, signature } = safeParseJSON(window.localStorage.getItem("siwe-token"));

      const SIWEObject = new SiweMessage(message);
      SIWEObject.validate(signature).then((r) => {
        if (address !== r.address) {
          throw new Error("Address mismatch");
        }

        setUser({ id: r.address });
      });
    } catch (e) {
      window.localStorage.removeItem("siwe-token");
      setUser(null);
    }
  }, []);

  return {
    user,
    loading,
    signIn,
    signOut,
    getToken,
  };
};
