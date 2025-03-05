import "./index.css";
import '@rainbow-me/rainbowkit/styles.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "./components/ui/toaster.tsx";
import { RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {  RainbowKitProvider } from "@rainbow-me/rainbowkit";
import WagmiSetup from "./components/hocs/wagmi-provider";

export const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <WagmiSetup>
    <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
        >
          <RouterProvider router={router} />
          <Toaster />
        </RainbowKitProvider>
    </QueryClientProvider>
      </WagmiSetup>
  </React.StrictMode>
);
