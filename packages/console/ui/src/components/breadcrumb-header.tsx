import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const BreadcrumbHeader: React.FC<{
  title: string;
  breadcrumb?: { id: number; label: string }[];
  onBreadcrumbClick?: (id: number) => void;
}> = ({ title, breadcrumb = [], onBreadcrumbClick }) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1 md:pointer-events-none" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="font-semibold">{title}</BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumb.length ? <BreadcrumbSeparator /> : null}

          {breadcrumb.map((s, index) => (
            <React.Fragment key={s.id}>
              <BreadcrumbItem
                className={cn({
                  "hidden md:block": index !== breadcrumb.length - 1,
                })}
              >
                <BreadcrumbLink
                  onClick={() => onBreadcrumbClick && onBreadcrumbClick(s.id)}
                  className={cn("cursor-pointer", {
                    "font-semibold": index === breadcrumb.length - 1,
                  })}
                >
                  {s.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < breadcrumb.length - 1 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};
