import { cn } from "@/lib/utils"

/*
  로그인 · 가입 화면의 큰 입력칸 — 세 앱 11-21 합의값(btn-lg와 한 줄 높이).
  38px · 13px · 좌우 12px · n-300 테두리 · 6px 라운드. 포커스는 디자인시스템 입력칸과 같다
  (accent-500 테두리 + 3px accent-50 링). 텍스트/셀렉트/파일 등 auth 화면의 모든 컨트롤이 공유한다.
*/
export const authInputClass = (hasError?: boolean, extra?: string) =>
  cn(
    "h-[38px] w-full rounded-[6px] border bg-white px-3 text-[13px] text-sz-n-900 outline-none",
    "placeholder:text-sz-n-400 transition-[color,box-shadow,border-color]",
    "disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
    hasError
      ? "border-sz-danger-text focus:border-sz-danger-text focus:ring-[3px] focus:ring-sz-danger-bg"
      : "border-sz-n-300 hover:enabled:border-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50",
    extra
  )
