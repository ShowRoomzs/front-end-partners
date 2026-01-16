import { RouterProvider } from "react-router-dom"
import { createRouter } from "@/common/router/router"
import { useMemo } from "react"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"

export default function App() {
  const [accessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)

  const router = useMemo(() => {
    return createRouter(Boolean(accessToken))
  }, [accessToken])

  return <RouterProvider router={router} />
}
