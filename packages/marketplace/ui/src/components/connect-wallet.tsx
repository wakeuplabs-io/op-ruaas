import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogOut, Lock } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import cn from "classnames";

export default function CustomConnectButton() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="fixed bottom-4 left-4 flex space-x-2">
        <button
          onClick={()=>{disconnect()}}
          className="bg-black p-2 rounded-lg flex items-center justify-center"
          type="button"
        >
          <LogOut className="text-white w-5 h-5" />
        </button>

        <button
          className="bg-gray-200 p-2 rounded-lg flex items-center justify-center cursor-not-allowed"
          type="button"
        >
          <Lock className="text-gray-500 w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain,  openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            className={cn("fixed bottom-4 left-4 flex space-x-2", {
              "opacity-0 pointer-events-none select-none": !ready,
            })}
            aria-hidden={!ready}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="bg-black text-white font-bold py-2 px-4 rounded-lg"
                type="button"
              >
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                type="button"
              >
                Wrong network
              </button>
            ) : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
