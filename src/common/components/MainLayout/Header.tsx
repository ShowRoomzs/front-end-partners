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
      className="bg-white border-b border-[#e3e6f0] flex items-center justify-between gap-3 px-3"
      style={{ height: `${HEADER_HEIGHT}px` }}
    >
      <div className="flex items-center min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mr-4 p-2 hover:bg-[#f7f8fa] rounded transition-colors cursor-pointer shrink-0"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            className="w-6 h-6 text-[#2e3547]"
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
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="shrink-0 h-8 px-2.5 text-[#2e3547] hover:bg-[#f7f8fa] hover:text-[#2e3547]"
      >
        <LogOut className="size-4" aria-hidden />
        로그아웃
      </Button>
    </header>
  )
}
