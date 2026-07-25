import { forwardRef, useState, type ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { authInputClass } from "./authStyles"

type PasswordInputProps = ComponentProps<"input"> & { hasError?: boolean }

// 비밀번호 입력 + 표시/숨김 토글. FormField의 relative 래퍼 안에서 눈 버튼이 절대배치된다.
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ hasError, className, disabled, ...props }, ref) => {
    const [show, setShow] = useState(false)
    return (
      <>
        <input
          ref={ref}
          type={show ? "text" : "password"}
          disabled={disabled}
          className={authInputClass(hasError, cn("pr-14", className))}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          disabled={disabled}
          aria-label={show ? "비밀번호 숨김" : "비밀번호 표시"}
          className="absolute right-2 h-7 rounded px-2 text-[11px] text-sz-n-500 hover:enabled:bg-sz-n-100 hover:enabled:text-sz-n-700 disabled:cursor-not-allowed disabled:text-sz-n-400"
        >
          {show ? "숨김" : "표시"}
        </button>
      </>
    )
  }
)
PasswordInput.displayName = "PasswordInput"
