import { Command } from '@/components/ui/command'
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import React, { useState } from 'react'
import { Pagination } from '@/components/pagination'

export const Route = createFileRoute('/create/deploy/')({
  component: DeployChain,
})

enum DeploymentStep {
  INSTALL_DEPENDENCIES = 1,
  RUN_DEV_MODE = 2,
  DEPLOY = 3,
}

const steps = [
  { step: DeploymentStep.INSTALL_DEPENDENCIES, label: 'Install Dependencies' },
  { step: DeploymentStep.RUN_DEV_MODE, label: 'Run Dev Mode' },
  { step: DeploymentStep.DEPLOY, label: 'Deploy' },
]

function DeployChain() {
  const [step, setStep] = useState<DeploymentStep>(
    DeploymentStep.INSTALL_DEPENDENCIES,
  )

  const currentStepIndex = steps.findIndex((s) => s.step === step)

  const next = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].step)
    } else {
      // TODO: create and navigate to inspect
    }
  }

  const previous = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].step)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-50 min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {steps.map((s, index) => (
                <React.Fragment key={s.step}>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      className={`${
                        index === currentStepIndex ? 'text-foreground' : ''
                      }`}
                    >
                      {s.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < steps.length - 1 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 pt-0">
          {step === DeploymentStep.INSTALL_DEPENDENCIES && (
            <InstallDependenciesStep />
          )}
          {step === DeploymentStep.RUN_DEV_MODE && <RunDevModeStep />}
          {step === DeploymentStep.DEPLOY && <DeployStep />}

          <Pagination
            disablePrev={currentStepIndex === 0}
            className="mt-6"
            onNext={next}
            onPrev={previous}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

const InstallDependenciesStep: React.FC = () => {
  return (
    <section className="space-y-6 border bg-white p-12 pt-8 rounded-xl">
      <h1 className="font-bold text-xl">Install Opruaas</h1>

      <ol className="space-y-6">
        <li className="space-y-2">
          <div>Install opruaas cli with</div>
          <Command command="npm i -g @wakeuplabs/opruaas" />
        </li>
        <li>
          <div>Install dependencies if needed</div>
          <ul className="list-disc pl-4 mt-2">
            <li>Docker</li>
            <li>Kubernettes</li>
            <li>Helm</li>
          </ul>
        </li>
      </ol>
    </section>
  )
}

const RunDevModeStep: React.FC = () => {
  return (
    <section className="space-y-6 border bg-white p-12 pt-8 rounded-xl">
      <h1 className="font-bold text-xl">Run in dev mode</h1>

      <ol>
        <li className="space-y-2">
          <div>Run from inside the project directory</div>
          <Command command="npx opruaas dev --default" />
        </li>
      </ol>
    </section>
  )
}

const DeployStep: React.FC = () => {
  return (
    <section className="space-y-6 border bg-white p-12 pt-8 rounded-xl">
      <h1 className="font-bold text-xl">Deploy</h1>

      <ol>
        <li className="space-y-2">
          <div>Run from inside the project directory</div>
          <Command command="opruaas deploy --name prod --target all" />
        </li>
      </ol>
    </section>
  )
}
