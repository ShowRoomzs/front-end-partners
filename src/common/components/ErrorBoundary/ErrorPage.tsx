import React from "react"
import { useRouteError } from "react-router-dom"
import Sidebar from "@/common/components/Sidebar/Sidebar"
import Header from "@/common/components/MainLayout/Header"
import { COMMON_MENU, SELLER_MENU, CREATOR_MENU } from "@/common/constants/menu"
import { getMenuTypeByRole } from "@/common/types/role"
import { useMarketStore } from "@/common/stores/useMarketStore"

type Props = { error?: Error }

function ErrorContent({ error }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Unexpected Application Error</h2>
        <p className="mb-4 text-sm text-sz-n-600">
          예기치 않은 오류가 발생했습니다. 새로고침하거나 잠시 후 다시 시도해주세요.
        </p>
        {error && (
          <pre className="whitespace-pre-wrap rounded bg-sz-n-50 p-3 text-xs text-sz-n-700">
            {error.message}
          </pre>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-sz-blue-600 px-3 py-1 text-white"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage({ error: propError }: Props) {
  const routeError = useRouteError() as Error | undefined
  const error = propError ?? routeError
  const { role } = useMarketStore()
  const menuType = getMenuTypeByRole(role)
  const menus = [menuType === "SELLER" ? SELLER_MENU : CREATOR_MENU, COMMON_MENU]

  return (
    <div className="flex h-screen bg-sz-n-50">
      <Sidebar menus={menus} isOpen={true} badgeCounts={{ connections: 0 }} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header isSidebarOpen={true} onToggleSidebar={() => {}} onLogout={() => {}} />

        <main className="overflow-auto p-6">
          <h1 className="mb-4 text-[20px] font-semibold text-sz-n-900">기본정보 관리</h1>
          <ErrorContent error={error} />
        </main>
      </div>
    </div>
  )
}
