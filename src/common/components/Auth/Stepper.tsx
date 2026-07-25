import { cn } from "@/lib/utils"

type StepperProps = {
  steps: string[]
  /** 현재 진행 중 단계(0-based). 이보다 앞 단계는 done. */
  current: number
}

// 다단계 폼 진행 표시(대기/진행중/완료). 회원가입 3단계에서 사용.
export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="mb-6 flex items-center justify-center">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo"
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                  state === "done" &&
                    "border-sz-success-text bg-sz-success-text text-white",
                  state === "active" &&
                    "border-sz-n-900 bg-sz-n-900 text-white",
                  state === "todo" &&
                    "border-sz-n-300 bg-sz-n-100 text-sz-n-500"
                )}
              >
                {state === "done" ? "✓" : i + 1}
              </div>
              <span
                className={cn(
                  "text-[12px]",
                  state === "active"
                    ? "font-semibold text-sz-n-900"
                    : state === "done"
                      ? "text-sz-n-700"
                      : "text-sz-n-500"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-1.5 h-px w-9 bg-sz-n-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}
