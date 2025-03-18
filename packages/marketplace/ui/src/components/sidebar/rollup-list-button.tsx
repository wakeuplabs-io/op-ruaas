import { Link } from "@tanstack/react-router";
import { CircleDot } from "lucide-react";
import { SidebarListButton } from "./sidebar-list-button";
import { RollupItem } from "@/types";
import { cn } from "@/lib/utils";

type RollupListButtonProps = {
  rollup: RollupItem;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  isSelected?: boolean;
};

export function RollupListButton({
  rollup,
  onClick,
  isSelected = false,
}: RollupListButtonProps) {
  return (
    <SidebarListButton isSelected={isSelected} onClick={onClick}>
      <Link
        to="/rollups/$id"
        params={{ id: rollup.id.toString(16) }}
        className={cn("flex items-center gap-2 text-sm w-full p-3 text-gray-700", isSelected && "text-black")}
      >
        <CircleDot size={12} />
        <span className="hover:text-black transition">{rollup.name}</span>
      </Link>
    </SidebarListButton>
  );
}
