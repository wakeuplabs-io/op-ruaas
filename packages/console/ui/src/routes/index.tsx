import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

// TODO: why we don't use the app as the default route????

function RouteComponent() {
  return <Navigate to="/app" />
}
