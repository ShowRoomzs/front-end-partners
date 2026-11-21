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
        "flex gap-2 text-left rounded-[6px] bg-sz-info-bg px-[13px] py-[11px] text-[11px] leading-[1.6] text-sz-info-text [&_b]:font-semibold",
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
