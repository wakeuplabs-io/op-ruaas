import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import { Toaster } from "./components/ui/toaster.tsx";
import { RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />;
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>
);
