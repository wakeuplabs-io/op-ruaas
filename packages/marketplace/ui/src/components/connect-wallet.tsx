import { cn } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function CustomConnectButton() {
  const { isConnected, address } = useAccount();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        mounted,
        openAccountModal,
      }) => {
        const navigate = useNavigate()
        const [wasConnected, setWasConnected] = useState(false);

        const ready = mounted;
        const connected = ready && account && chain && isConnected;

        useEffect(() => {
          if (isConnected) {
            setWasConnected(true);
          } else if (wasConnected && !isConnected) {
            navigate({ to: "/" });
          }
        }, [isConnected, wasConnected, navigate]);
        
        return (
          <div
            className={cn("w-full", {
              "opacity-0 pointer-events-none select-none": !ready,
            })}
            aria-hidden={!ready}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="w-full flex items-center justify-center bg-gray-100 text-black py-2 px-4 rounded-md shadow-sm border hover:bg-gray-200"
                type="button"
              >
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md"
                type="button"
              >
                Wrong network
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                className="w-full flex items-center justify-between gap-3 bg-secondary text-black py-2 px-4 rounded-md border hover:bg-gray-200"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-md" />
                  <span className="font-medium text-gray-800">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <ChevronDown size={18} className="text-gray-500" />
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
