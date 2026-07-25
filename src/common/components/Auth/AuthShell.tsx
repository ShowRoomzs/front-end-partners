import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import logoUrl from "@/common/assets/logo.svg"

type AuthShellProps = {
  /** 카드(콘텐츠 컬럼) 너비 — 로그인 400, 회원가입 480 */
  width?: 400 | 480
  /** 워드마크 아래 서피스 캡션 (예: "브랜드 파트너센터") */
  subtitle?: string
  /** center = 로그인(수직 중앙), top = 회원가입(상단 정렬 + 스크롤) */
  align?: "center" | "top"
  children: ReactNode
}

// 로그인·회원가입 공통 셸. 카드 보더·그림자·둥근모서리 없이 전체 페이지(스펙 rev.3/rev.7).
export function AuthShell({
  width = 400,
  subtitle,
  align = "center",
  children,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full justify-center bg-white px-4",
        align === "center" ? "items-center" : "items-start"
      )}
    >
      <div
        style={{ width, maxWidth: "100%" }}
        className={align === "top" ? "py-14" : "py-6"}
      >
        <div className="mb-6 text-center">
          <img src={logoUrl} alt="SHOWROOMZ" className="mx-auto h-5 w-auto" />
          {subtitle && (
            <p className="mt-2 text-[12px] text-sz-n-500">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
