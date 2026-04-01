import { RouterProvider } from "react-router-dom"
import { createRouter } from "@/common/router/router"
import { useEffect, useMemo } from "react"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { useGetMarketInfo } from "@/features/auth/hooks/useGetMarketInfo"
import { useMarketStore } from "@/common/stores/useMarketStore"

export default function App() {
  const [accessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  const { data: marketInfo } = useGetMarketInfo()
  const { market, setMarket } = useMarketStore()

  useEffect(() => {
    if (!marketInfo || market === marketInfo) {
      return
    }
    setMarket(marketInfo)
  }, [market, marketInfo, setMarket])

  const router = useMemo(() => {
    return createRouter(Boolean(accessToken))
  }, [accessToken])

  return <RouterProvider router={router} />
}
