import { AppSidebar } from '@/components/app-sidebar'
import { Pagination } from '@/components/pagination'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/create/setup/')({
  component: Index,
})

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

          <Pagination className="mt-6" onNext={() => {}} onPrev={() => {}} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
