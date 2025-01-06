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
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <Button
        onClick={onPrev}
        disabled={disablePrev}
        size={"lg"}
        variant={"secondary"}
        className="rounded-full justify-start"
      >
        <ChevronLeftIcon className="ml-2" />
        <span>Previous</span>
      </Button>
      <Button
        disabled={disableNext}
        onClick={onNext}
        size={"lg"}
        className="rounded-full justify-end"
      >
        <span>Next</span>
        <ChevronRightIcon className="ml-2" />
      </Button>
    </div>
  );
};
