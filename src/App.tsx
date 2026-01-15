import { useRoutes } from "react-router-dom"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { authRoutes, mainRoutes } from "@/common/router/routes"

export default function App() {
  const [accessToken] = useCookie(COOKIE_NAME.ACCESS_TOKEN)
  const element = useRoutes(accessToken ? mainRoutes : authRoutes)
  return element
}
