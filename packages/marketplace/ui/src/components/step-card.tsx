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
            ? "bg-green-100 border-green-300 text-green-700"
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
  