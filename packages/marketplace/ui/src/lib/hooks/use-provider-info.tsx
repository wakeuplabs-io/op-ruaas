import { useMemo } from "react";
import envParsed from "@/envParsed";

export function useProviderInfo() {
  const provider = useMemo(() => {
    const name =  envParsed().PROVIDER_NAME as string;
    return { name };
  }, []);

  return provider;
}
