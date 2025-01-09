import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export const Pagination: React.FC<{
  className?: string;
  onNext?: () => void;
  onPrev?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}> = ({ className, onNext, onPrev, disableNext, disablePrev }) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Button
        onClick={onPrev}
        disabled={disablePrev}
        size="lg"
        variant="secondary"
        className="rounded-full justify-start md:w-full"
      >
        <ChevronLeftIcon className="md:ml-2" />
        <span className="hidden md:block">Previous</span>
      </Button>
      <Button
        disabled={disableNext}
        onClick={onNext}
        size="lg"
        className="rounded-full justify-end w-full"
      >
        <span>Next</span>
        <ChevronRightIcon className="ml-2" />
      </Button>
    </div>
  );
};
