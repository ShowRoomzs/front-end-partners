import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type NoticeBoxProps = {
  children: ReactNode
  className?: string
}

// 정보색(info) 안내 박스. 좌측 원형 "i" 아이콘 + 본문.
export function NoticeBox({ children, className }: NoticeBoxProps) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-[6px] bg-sz-info-bg px-3.5 py-3 text-left text-[12px] leading-relaxed text-sz-n-700",
        className
      )}
    >
      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-sz-info-text text-[10px] font-bold text-white">
        i
      </span>
      <span>{children}</span>
    </div>
  )
}
