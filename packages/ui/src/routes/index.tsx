import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-50 min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 pt-0">
          <div className="border rounded-xl py-8 px-10 bg-white">
            <h1 className="font-bold text-xl">L1 chain</h1>
            <p className="mt-6 text-sm">
              The L1 chain to which your rollup will be posting transactions.
              Think of it as an exchange between costs and security.
            </p>

            <div className="flex items-center justify-between mt-10 px-4 py-3 border rounded-lg">
              <span>Ethereum testnet</span>
              <Switch />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button
              size={"lg"}
              variant={"secondary"}
              className="rounded-full justify-start"
            >
              <ChevronLeftIcon className="ml-2" />
              <span>Previous</span>
            </Button>
            <Button size={"lg"} className="rounded-full justify-end">
              <span>Next</span>
              <ChevronRightIcon className="ml-2" />
            </Button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
