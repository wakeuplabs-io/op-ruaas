import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogOut, ChevronDown } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import cn from "classnames";

export default function CustomConnectButton() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain && isConnected;

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
                className="w-full flex items-center justify-center bg-gray-100 text-black py-2 px-4 rounded-full shadow-sm border border-gray-300 hover:bg-gray-200"
                type="button"
              >
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-full"
                type="button"
              >
                Wrong network
              </button>
            ) : (
              <button
                className="w-full flex items-center gap-3 bg-gray-100 text-black py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-200"
                type="button"
              >
                <div className="w-5 h-5 bg-red-500 rounded-full" />
                <span className="font-medium">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <ChevronDown size={18} className="text-gray-500" />
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
