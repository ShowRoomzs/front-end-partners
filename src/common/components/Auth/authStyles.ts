import { cn } from "@/lib/utils"

// ui-partner 스펙의 .inp 스타일 (40px 높이·n-300 보더·6px 라운드·13px 본문·n-200 포커스링).
// 텍스트/셀렉트/파일 등 auth 화면의 모든 컨트롤이 공유한다.
export const authInputClass = (hasError?: boolean, extra?: string) =>
  cn(
    "h-10 w-full rounded-[6px] border bg-white px-3 text-[13px] text-sz-n-900 outline-none",
    "placeholder:text-sz-n-400 transition-[color,box-shadow,border-color]",
    "disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
    hasError
      ? "border-sz-danger-text focus:border-sz-danger-text focus:ring-[3px] focus:ring-sz-danger-bg"
      : "border-sz-n-300 hover:enabled:border-sz-n-400 focus:border-sz-n-900 focus:ring-[3px] focus:ring-sz-n-200",
    extra
  )
