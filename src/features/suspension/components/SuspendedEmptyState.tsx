import NotReady from "@/common/components/NotReady/NotReady"
import { withObjectParticle } from "@/common/utils/korean"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  SUSPENDED_EMPTY_TITLE,
  SUSPENSION_COPY,
} from "@/features/suspension/constants/copy"
import { useAccountSuspension } from "@/features/suspension/hooks/useAccountSuspension"
import { appealPath } from "@/features/suspension/utils/paths"
import { useNavigate } from "react-router-dom"

/**
 * 정지 중 URL로 직접 들어온 차단 화면(상품 등록 · 계약 작성 등)의 빈 상태 —
 * 15 rule 「URL 직접 진입은 빈 상태 + [운영팀에 소명하기]」.
 *
 * @param feature 기능 이름(조사 없이) — 예: "상품 등록" → 「…상품 등록을 이용할 수 없습니다」
 */
export default function SuspendedEmptyState(props: { feature: string }) {
  const { sanction } = useAccountSuspension()
  const navigate = useNavigate()
  return (
    <NotReady
      title={SUSPENDED_EMPTY_TITLE(withObjectParticle(props.feature))}
      action={
        <Btn onClick={() => navigate(appealPath(sanction))}>
          {SUSPENSION_COPY.appealButton}
        </Btn>
      }
    />
  )
}
