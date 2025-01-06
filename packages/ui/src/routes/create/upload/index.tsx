import { AppSidebar } from '@/components/app-sidebar'
import { Pagination } from '@/components/pagination'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { Dropzone } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Upload } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/create/upload/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [deployment, setDeployment] = useState<File | null>(null)
  const [artifact, setArtifact] = useState<File | null>(null)

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
                <BreadcrumbLink href="#">Upload</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 pt-0">
          <div className="border bg-white p-12 pt-8 rounded-xl">
            <h1 className="font-bold text-xl">Upload chain artifacts</h1>

            <Input placeholder="Name" className="mt-6" />

            <Tabs defaultValue="deployment" className="w-full mt-4">
              <TabsList className="w-full">
                <TabsTrigger
                  className="w-full justify-between"
                  value="deployment"
                >
                  Deployment.json
                  {deployment ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  className="w-full justify-between"
                  value="artifact"
                >
                  Artifact.zip
                  {artifact ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="deployment">
                <Dropzone file={deployment} setFile={setDeployment} />
              </TabsContent>
              <TabsContent value="artifact">
                <Dropzone file={artifact} setFile={setArtifact} />
              </TabsContent>
            </Tabs>
          </div>

          <Pagination className="mt-6" disableNext disablePrev />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
