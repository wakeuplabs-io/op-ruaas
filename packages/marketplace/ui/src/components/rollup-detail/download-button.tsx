import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadSection() {
  return (
    <Button variant="outline" className="w-full mt-6 py-6 flex gap-2 items-center justify-center bg-gray-200">
      <Download className="h-5 w-5" />
      Download zip
    </Button>
  );
}
