import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  /**
   * `maxLength`가 있을 때 자동으로 붙는 "n/max" 카운터를 끈다.
   *
   * 이 컴포넌트는 maxLength만 있으면 입력창 **오른쪽 바깥**에 카운터를 하나
   * 그려준다. 그런데 시안이 카운터를 입력창 **안쪽**에 두라고 한 화면들은
   * 각자 절대위치 카운터를 따로 얹기 때문에 두 개가 겹쳐 보인다.
   * 그런 화면에서 이 값을 켜서 내장 카운터만 끈다.
   */
  hideBuiltInCounter?: boolean
}

function Input({
  className,
  type,
  hideBuiltInCounter = false,
  ...props
}: InputProps) {
  const showCounter =
    !hideBuiltInCounter && !!props?.maxLength && props.maxLength > 0

  return (
    <div className="flex flex-row gap-4 items-center">
      <input
        type={type}
        data-slot="input"
        className={cn(
          // 디자인시스템 `.inp` — 13px · 글자 n-900 · 테두리 n-300 · 모서리 6px · 플레이스홀더 n-400.
          // 높이 32px · 좌우 10px(디자인시스템 `input` — 11-20 사용자 결정으로 시안 36px 대신 디자인시스템을 따른다)
          "file:text-foreground placeholder:text-sz-n-400 selection:bg-primary selection:text-primary-foreground h-8 w-full min-w-0 rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1 text-[13px] text-sz-n-900 transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[13px] file:font-medium",
          // 디자인시스템: 비활성 입력은 옅게가 아니라 회색으로 확실히 채운다
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-500 disabled:opacity-100",
          "focus-visible:border-sz-accent-500 focus-visible:ring-sz-accent-50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        onWheel={e => (e.target as HTMLInputElement).blur()}
        {...props}
      />
      {showCounter && (
        <span className="text-[12px] text-sz-n-500">
          {typeof props.value === "string" ? props.value.length : 0}/
          {props.maxLength}
        </span>
      )}
    </div>
  )
}

export { Input }
