import "./index.css";
import ProvidersWrapper from "@/hoc/ProvidersWrapper.tsx";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import { Toaster } from "./components/ui/toaster.tsx";

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
    <ProvidersWrapper>
      <App />
      <Toaster />
    </ProvidersWrapper>
  </React.StrictMode>
);
