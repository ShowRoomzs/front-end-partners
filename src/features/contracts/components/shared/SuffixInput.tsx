import {
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
} from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"
import type { InputHTMLAttributes } from "react"

interface SuffixInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  /** 표시 문자열 — 숫자 포맷은 호출부가 한다(천 단위 콤마 등) */
  value: string
  onChange: (raw: string) => void
  /** 시안 `.sfx-u` — %, 원, 개, 개월 */
  suffix: string
  isError?: boolean
  /** 래퍼 폭 — 기본은 부모 폭을 채운다(`.iw.w-full`) */
  wrapperClassName?: string
}

/** 시안 `.iw` — 입력 오른쪽 안에 단위가 붙은 숫자 입력 */
export default function SuffixInput(props: SuffixInputProps) {
  const {
    value,
    onChange,
    suffix,
    isError = false,
    wrapperClassName,
    className,
    ...rest
  } = props

  return (
    <span className={cn("relative flex items-center", wrapperClassName)}>
      <input
        {...rest}
        value={value}
        onChange={event => onChange(event.target.value)}
        className={cn(
          INPUT_CLASS,
          "w-full pr-[26px]",
          isError && INPUT_ERROR_CLASS,
          className
        )}
      />
      <span className="pointer-events-none absolute right-[9px] text-[12px] text-sz-n-500">
        {suffix}
      </span>
    </span>
  )
}
