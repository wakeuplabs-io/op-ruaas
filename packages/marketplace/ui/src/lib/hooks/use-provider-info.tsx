import { useMemo } from "react";

export function useProviderInfo() {
  const provider = useMemo(() => {
    const name = "John Doe";
    const address = "0x1124723723A010C7d01b50e0d17dc79C8ashy760";

    const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return { name, address, formattedAddress };
  }, []);

  return provider;
}
