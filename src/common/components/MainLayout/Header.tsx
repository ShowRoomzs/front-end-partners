import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import logo from "@/common/assets/logo.svg"
import { Button } from "@/components/ui/button"
import { HEADER_HEIGHT } from "./config"

interface HeaderProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onLogout: () => void
}

export default function Header(props: HeaderProps) {
  const { isSidebarOpen, onToggleSidebar, onLogout } = props
  const navigate = useNavigate()

  return (
    <header
      className="flex items-center justify-between gap-3 border-b border-sz-n-200 bg-white px-3"
      style={{ height: `${HEADER_HEIGHT}px` }}
    >
      <div className="flex items-center min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mr-4 shrink-0 cursor-pointer rounded-[6px] p-2 transition-colors hover:bg-sz-n-100"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            className="h-6 w-6 text-sz-n-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <img
          src={logo}
          alt="Showroom Logo"
          className="h-4 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <span className="ml-2.5 border-l border-sz-n-300 pl-2.5 text-[11px] font-medium text-sz-n-500">
          파트너센터
        </span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="h-8 shrink-0 px-2.5 text-sz-n-700 hover:bg-sz-n-100 hover:text-sz-n-900"
      >
        <LogOut className="size-4" aria-hidden />
        로그아웃
      </Button>
    </header>
  )
}
