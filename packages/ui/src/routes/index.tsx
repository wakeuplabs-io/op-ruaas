import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const auth = useAuth()

  return (
    <div className="flex flex-1 items-center justify-center">
      <Button onClick={auth.signOut}>
        Logout
      </Button>
    </div>
  );
}
