import { cn } from '@/lib/utils';

export interface SidebarListButtonProps {
  isSelected?: boolean;
  isDisabled?: boolean;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function SidebarListButton({ isSelected, isDisabled = false, children, onClick, className }: SidebarListButtonProps) {
  return (
    <button
      className={cn(
        `group flex w-full items-center gap-2 rounded-[10px] text-secondary`,
        {
          'text-dark-high bg-mi-stone-300 [&_svg]:text-primary': isSelected,
          'hover:bg-mi-stone-300 hover:text-dark-high [&_svg]:hover:text-primary transition-colors duration-200': !isDisabled,
        },
        className,
      )}
      disabled={isDisabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
