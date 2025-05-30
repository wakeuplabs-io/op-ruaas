/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as AppImport } from './routes/app'
import { Route as IndexImport } from './routes/index'
import { Route as DeploymentsIdImport } from './routes/deployments/$id'
import { Route as MarketplaceRequestsIndexImport } from './routes/marketplace/requests.index'
import { Route as CreateVerifyIndexImport } from './routes/create/verify.index'
import { Route as CreateSetupIndexImport } from './routes/create/setup.index'
import { Route as CreateDeployIndexImport } from './routes/create/deploy.index'

// Create/Update Routes

const AppRoute = AppImport.update({
  id: '/app',
  path: '/app',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const DeploymentsIdRoute = DeploymentsIdImport.update({
  id: '/deployments/$id',
  path: '/deployments/$id',
  getParentRoute: () => rootRoute,
} as any)

const MarketplaceRequestsIndexRoute = MarketplaceRequestsIndexImport.update({
  id: '/marketplace/requests/',
  path: '/marketplace/requests/',
  getParentRoute: () => rootRoute,
} as any)

const CreateVerifyIndexRoute = CreateVerifyIndexImport.update({
  id: '/create/verify/',
  path: '/create/verify/',
  getParentRoute: () => rootRoute,
} as any)

const CreateSetupIndexRoute = CreateSetupIndexImport.update({
  id: '/create/setup/',
  path: '/create/setup/',
  getParentRoute: () => rootRoute,
} as any)

const CreateDeployIndexRoute = CreateDeployIndexImport.update({
  id: '/create/deploy/',
  path: '/create/deploy/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/app': {
      id: '/app'
      path: '/app'
      fullPath: '/app'
      preLoaderRoute: typeof AppImport
      parentRoute: typeof rootRoute
    }
    '/deployments/$id': {
      id: '/deployments/$id'
      path: '/deployments/$id'
      fullPath: '/deployments/$id'
      preLoaderRoute: typeof DeploymentsIdImport
      parentRoute: typeof rootRoute
    }
    '/create/deploy/': {
      id: '/create/deploy/'
      path: '/create/deploy'
      fullPath: '/create/deploy'
      preLoaderRoute: typeof CreateDeployIndexImport
      parentRoute: typeof rootRoute
    }
    '/create/setup/': {
      id: '/create/setup/'
      path: '/create/setup'
      fullPath: '/create/setup'
      preLoaderRoute: typeof CreateSetupIndexImport
      parentRoute: typeof rootRoute
    }
    '/create/verify/': {
      id: '/create/verify/'
      path: '/create/verify'
      fullPath: '/create/verify'
      preLoaderRoute: typeof CreateVerifyIndexImport
      parentRoute: typeof rootRoute
    }
    '/marketplace/requests/': {
      id: '/marketplace/requests/'
      path: '/marketplace/requests'
      fullPath: '/marketplace/requests'
      preLoaderRoute: typeof MarketplaceRequestsIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/app': typeof AppRoute
  '/deployments/$id': typeof DeploymentsIdRoute
  '/create/deploy': typeof CreateDeployIndexRoute
  '/create/setup': typeof CreateSetupIndexRoute
  '/create/verify': typeof CreateVerifyIndexRoute
  '/marketplace/requests': typeof MarketplaceRequestsIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/app': typeof AppRoute
  '/deployments/$id': typeof DeploymentsIdRoute
  '/create/deploy': typeof CreateDeployIndexRoute
  '/create/setup': typeof CreateSetupIndexRoute
  '/create/verify': typeof CreateVerifyIndexRoute
  '/marketplace/requests': typeof MarketplaceRequestsIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/app': typeof AppRoute
  '/deployments/$id': typeof DeploymentsIdRoute
  '/create/deploy/': typeof CreateDeployIndexRoute
  '/create/setup/': typeof CreateSetupIndexRoute
  '/create/verify/': typeof CreateVerifyIndexRoute
  '/marketplace/requests/': typeof MarketplaceRequestsIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/app'
    | '/deployments/$id'
    | '/create/deploy'
    | '/create/setup'
    | '/create/verify'
    | '/marketplace/requests'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/app'
    | '/deployments/$id'
    | '/create/deploy'
    | '/create/setup'
    | '/create/verify'
    | '/marketplace/requests'
  id:
    | '__root__'
    | '/'
    | '/app'
    | '/deployments/$id'
    | '/create/deploy/'
    | '/create/setup/'
    | '/create/verify/'
    | '/marketplace/requests/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AppRoute: typeof AppRoute
  DeploymentsIdRoute: typeof DeploymentsIdRoute
  CreateDeployIndexRoute: typeof CreateDeployIndexRoute
  CreateSetupIndexRoute: typeof CreateSetupIndexRoute
  CreateVerifyIndexRoute: typeof CreateVerifyIndexRoute
  MarketplaceRequestsIndexRoute: typeof MarketplaceRequestsIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AppRoute: AppRoute,
  DeploymentsIdRoute: DeploymentsIdRoute,
  CreateDeployIndexRoute: CreateDeployIndexRoute,
  CreateSetupIndexRoute: CreateSetupIndexRoute,
  CreateVerifyIndexRoute: CreateVerifyIndexRoute,
  MarketplaceRequestsIndexRoute: MarketplaceRequestsIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/app",
        "/deployments/$id",
        "/create/deploy/",
        "/create/setup/",
        "/create/verify/",
        "/marketplace/requests/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/app": {
      "filePath": "app.tsx"
    },
    "/deployments/$id": {
      "filePath": "deployments/$id.tsx"
    },
    "/create/deploy/": {
      "filePath": "create/deploy.index.tsx"
    },
    "/create/setup/": {
      "filePath": "create/setup.index.tsx"
    },
    "/create/verify/": {
      "filePath": "create/verify.index.tsx"
    },
    "/marketplace/requests/": {
      "filePath": "marketplace/requests.index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
