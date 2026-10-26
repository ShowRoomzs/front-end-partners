import { SUSPENSION_COPY } from "@/features/suspension/constants/copy"
import { useAccountSuspension } from "@/features/suspension/hooks/useAccountSuspension"

/**
 * 탑바 브랜드명 옆 「정지」 칩 — 시안 `.sz-st-stop`. 정상 계정은 칩을 두지 않는다(16 rule 「탑바 우측 순서」).
 */
export default function SuspensionChip() {
  const { isSuspended } = useAccountSuspension()
  if (!isSuspended) return null
  return (
    <span className="ml-1.5 inline-flex h-5 items-center rounded-[6px] bg-sz-danger-bg px-[7px] text-[11px] font-semibold text-sz-danger-text">
      {SUSPENSION_COPY.chip}
    </span>
  )
}
