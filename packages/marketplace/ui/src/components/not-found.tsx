import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function NotFoundPage() {
  return (

    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 border-none">
      <Card className="p-12 shadow-none flex flex-col items-center justify-center max-w-md bg-transparent border-0">

        <div className="h-20 w-20 rounded-full bg-[#FFF1C7] flex items-center justify-center mb-6">
          <AlertCircle className="text-[#FFD813] h-12 w-12" />
        </div>

        <h1 className="text-2xl font-medium text-gray-900 mb-4">Not Found</h1>
        <p className="text-sm text-muted-foreground text-center">
          The page you are looking for doesn’t exist or has been moved.
        </p>
      </Card>
    </div>
  );
}
