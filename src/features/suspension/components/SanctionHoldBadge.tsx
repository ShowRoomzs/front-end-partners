import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import type { SanctionHoldView } from "@/features/suspension/types"

/**
 * 정지 보류 보조 배지 — 서버 `hold`(SanctionHoldView)를 그대로 그린다.
 * 내 정지는 경고(내가 소명해야 한다), 상대 사정 · 편집 불가는 중립(내 조치 없음).
 * 문구도 서버 것이다(「체결 보류 · 계정 이용 정지」 · 「승인 보류 · 상대 계정」) — FE가 판정하지 않는다.
 */
export default function SanctionHoldBadge(props: {
  hold: SanctionHoldView | null | undefined
}) {
  const { hold } = props
  if (!hold) return null
  return (
    <StatusBadge variant={hold.tone === "WARNING" ? "warning" : "neutral"}>
      {hold.label}
    </StatusBadge>
  )
}
