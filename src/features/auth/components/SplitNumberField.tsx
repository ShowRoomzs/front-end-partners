import { cn } from "@/lib/utils"

type SplitNumberFieldProps = {
  year: string
  region: string
  seq: string
  onYearChange: (v: string) => void
  onRegionChange: (v: string) => void
  onSeqChange: (v: string) => void
  onBlur?: () => void
  hasError?: boolean
  /** 간이과세자: 기재 불필요(비활성) */
  exempt?: boolean
  disabled?: boolean
}

// 통신판매업신고번호 "제 [년도]-[지역]-[번호] 호" 3분할 입력 (이 화면 전용).
export function SplitNumberField({
  year,
  region,
  seq,
  onYearChange,
  onRegionChange,
  onSeqChange,
  onBlur,
  hasError,
  exempt = false,
  disabled = false,
}: SplitNumberFieldProps) {
  const isDisabled = disabled || exempt
  const boxClass = (filled: boolean) =>
    cn(
      "flex h-10 items-center justify-center rounded-[6px] border bg-white text-center text-[13px] outline-none",
      "disabled:cursor-not-allowed",
      // 면제(간이과세자)는 흰 배경 유지하고 컨테이너 opacity로만 딤(위 파일박스와 동일 톤).
      // 제출중(비면제) 비활성일 때만 회색 채움.
      !exempt && "disabled:bg-sz-n-100 disabled:text-sz-n-400",
      filled ? "text-sz-n-900" : "text-sz-n-400",
      hasError
        ? "border-sz-danger-text focus:ring-[3px] focus:ring-sz-danger-bg"
        : "border-sz-n-300 focus:border-sz-n-900 focus:ring-[3px] focus:ring-sz-n-200"
    )

  return (
    <div className={cn("flex items-center gap-1.5", exempt && "opacity-60")}>
      <span className="text-[12px] text-sz-n-600">제</span>
      <input
        type="text"
        inputMode="numeric"
        value={year}
        onChange={e => onYearChange(e.target.value)}
        onBlur={onBlur}
        disabled={isDisabled}
        placeholder="년도"
        className={cn(boxClass(!!year), "w-[72px]")}
      />
      <span className="text-sz-n-400">–</span>
      <input
        type="text"
        value={region}
        onChange={e => onRegionChange(e.target.value)}
        onBlur={onBlur}
        disabled={isDisabled}
        placeholder="지역"
        className={cn(boxClass(!!region), "w-[72px]")}
      />
      <span className="text-sz-n-400">–</span>
      <input
        type="text"
        value={seq}
        onChange={e => onSeqChange(e.target.value)}
        onBlur={onBlur}
        disabled={isDisabled}
        placeholder="번호"
        className={cn(boxClass(!!seq), "w-[72px]")}
      />
      <span className="text-[12px] text-sz-n-600">호</span>
    </div>
  )
}
