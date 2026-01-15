import { createBrowserRouter } from "react-router-dom"
import { authRoutes, mainRoutes } from "@/common/router/routes"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { cookie } from "@/common/lib/cookie"

const isAuthenticated = () => {
  return Boolean(cookie.get(COOKIE_NAME.ACCESS_TOKEN))
}

export const router = createBrowserRouter(
  isAuthenticated() ? mainRoutes : authRoutes
)
