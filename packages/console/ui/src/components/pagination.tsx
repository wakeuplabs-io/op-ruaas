import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";
import { cn } from "@/lib/utils";

export const Pagination: React.FC<{
  className?: string;
  prev?: ButtonProps;
  next?: ButtonProps;
}> = ({ className, prev, next }) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Button
        size="lg"
        variant="secondary"
        className="justify-start md:w-full"
        {...prev}
      >
        <ChevronLeftIcon className="md:ml-2" />
        <span className="hidden md:block">Previous</span>
      </Button>
      <Button
        size="lg"
        className=" justify-end w-full"
        {...next}
      >
        <span>Next</span>
        <ChevronRightIcon className="ml-2" />
      </Button>
    </div>
  );
};
