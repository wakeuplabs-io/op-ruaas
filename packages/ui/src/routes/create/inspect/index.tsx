import { AppSidebar } from '@/components/app-sidebar'
import { Pagination } from '@/components/pagination'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { Dropzone } from '@/components/ui/dropzone'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/create/inspect/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-50 min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Manage</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 pt-0">
          <div className="space-y-6 border bg-white p-12 pt-8 rounded-xl">
            <h1 className="font-bold text-xl">Manage your chain</h1>

            <Tabs defaultValue="deployment" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger className="w-full" value="deployment">
                  Deployment.json
                </TabsTrigger>
                <TabsTrigger className="w-full" value="artifact">
                  Artifact.zip
                </TabsTrigger>
              </TabsList>
              <TabsContent value="deployment">
                <Dropzone />
              </TabsContent>
              <TabsContent value="artifact">
                <Dropzone />
              </TabsContent>
            </Tabs>
          </div>

          <Pagination className="mt-6" disableNext disablePrev />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
