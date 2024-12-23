import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import React from "react";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        }))
      );

export const Route = createRootRoute({
  component: () => (
    <div className="w-screen h-screen flex flex-col">
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/configure" className="[&.active]:font-bold">
          Configure
        </Link>
        <Link to="/deploy" className="[&.active]:font-bold">
          Deploy
        </Link>
        <Link to="/inspect" className="[&.active]:font-bold">
          Inspect
        </Link>
      </div>
      <hr />
      <main className="flex flex-1">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
});
