/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'

// Create Virtual Routes

const RollupsIdLazyImport = createFileRoute('/rollups/$id')()

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const RollupsIdLazyRoute = RollupsIdLazyImport.update({
  id: '/rollups/$id',
  path: '/rollups/$id',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/rollups/$id.lazy').then((d) => d.Route))

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
    '/rollups/$id': {
      id: '/rollups/$id'
      path: '/rollups/$id'
      fullPath: '/rollups/$id'
      preLoaderRoute: typeof RollupsIdLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/rollups/$id': typeof RollupsIdLazyRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/rollups/$id': typeof RollupsIdLazyRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/rollups/$id': typeof RollupsIdLazyRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/rollups/$id'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/rollups/$id'
  id: '__root__' | '/' | '/rollups/$id'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  RollupsIdLazyRoute: typeof RollupsIdLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  RollupsIdLazyRoute: RollupsIdLazyRoute,
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
        "/rollups/$id"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/rollups/$id": {
      "filePath": "rollups/$id.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
