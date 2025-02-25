
import { createLazyFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Marketplace</h1>
    </div>
  );

}
