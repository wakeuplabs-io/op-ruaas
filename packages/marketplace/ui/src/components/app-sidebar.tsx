import * as React from "react";
import { Plus, CircleDot, MoreHorizontal } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import CustomConnectButton from "./connect-wallet";
import { buttonVariants } from "./ui/button";
import { useGetUserRollups } from "@/lib/hooks/use-get-user-orders";
import { Link } from "@tanstack/react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { rollups } = useGetUserRollups();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-6 px-4">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 space-y-4">
        <button className="w-full flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
          <Plus size={16} className="text-red-500" />
          <span className="font-medium">New Rollup</span>
        </button>

        <div className="mt-4">
          <h4 className="text-sm text-gray-500 font-medium mb-2">My Rollups</h4>
          <ul className="space-y-2">
            {rollups?.map((rollup) => (
              <li
                key={rollup}
                className="cursor-pointer hover:text-black transition"
              >
                <Link
                  to={`/app/rollups/${rollup}`}
                  className="flex items-center gap-2 text-gray-700 text-sm"
                >
                  <CircleDot size={12} className="text-gray-500" />
                  <span>Rollup</span>
                </Link>
              </li>
            ))}
          </ul>

          <button className="mt-2 flex items-center gap-1 text-gray-500 text-sm hover:text-black transition">
            <MoreHorizontal size={14} className="text-gray-500" />
            View all Rounds
          </button>
        </div>
      </SidebarContent>

      <div className="px-4 mt-auto text-sm text-gray-700">
        <h4 className="text-gray-500 text-xs mb-1">Provider</h4>
        <p className="font-medium">John Doe</p>
        <p className="text-xs text-gray-500">0x11247237...ashy760</p>
      </div>

      <div className="px-4 mt-4">
        <CustomConnectButton />
      </div>

      <SidebarFooter className="pb-4 px-4 flex flex-col items-center mt-4">
        <a
          href="https://www.wakeuplabs.io/"
          target="_blank"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-full h-[74px] flex justify-center items-center"
          )}
        >
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </a>
      </SidebarFooter>


    </Sidebar>
  );
}
