import { cn } from "@/lib/utils";

export const StepCard: React.FC<{
    className?: string;
    isActive?: boolean;
    isComplete?: boolean;
    title?: string;
    description?: string;
    children?: React.ReactNode;
  }> = ({ className, isActive, isComplete, children, title, description }) => {
    return (
      <div
        className={cn(
          "border rounded-xl p-4",
          isComplete
            ? "bg-[#F5FFE6] border-[#5E7440] text-[#5E7440]"
            : "bg-gray-50",
          className
        )}
      >
        <div className="font-medium">{title}</div>
        {!isComplete && (
          <div className="text-muted-foreground text-sm mt-2">{description}</div>
        )}
        {isActive && children}
      </div>
    );
  };
  