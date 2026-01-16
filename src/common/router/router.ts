import { createBrowserRouter } from "react-router-dom"
import { authRoutes, mainRoutes } from "@/common/router/routes"

export const createRouter = (isAuthenticated: boolean) => {
  return createBrowserRouter(isAuthenticated ? mainRoutes : authRoutes)
}
