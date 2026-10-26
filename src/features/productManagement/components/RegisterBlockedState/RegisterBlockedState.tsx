import { withObjectParticle } from "@/common/utils/korean"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  REGISTER_BLOCKED_DESCRIPTION,
  REGISTER_FEATURE_NAME,
} from "@/features/productManagement/constants/suspension"
import {
  appealPath,
  SUSPENSION_COPY,
  useAccountSuspension,
} from "@/features/suspension"
import { SUSPENDED_EMPTY_TITLE } from "@/features/suspension/constants/copy"
import { useNavigate } from "react-router-dom"

/**
 * 시안 15 S2b — 정지 중 `/product/register` 직접 진입. 상품 목록 표 본문 자리에 놓인다.
 * 공용 `SuspendedEmptyState`는 제목 + [운영팀에 소명하기]뿐이라, 설명 줄과 [상품 목록으로]가 있는
 * 이 화면은 같은 문구 상수로 따로 그린다(수정 · 품절은 계속된다는 걸 알려야 「상품 관리가 막혔다」로 읽히지 않는다).
 */
export default function RegisterBlockedState() {
  const navigate = useNavigate()
  const { sanction } = useAccountSuspension()
  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌀</div>
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {SUSPENDED_EMPTY_TITLE(withObjectParticle(REGISTER_FEATURE_NAME))}
      </div>
      <div className="text-[12px] text-sz-n-500">
        {REGISTER_BLOCKED_DESCRIPTION}
      </div>
      <div className="mt-[14px] flex justify-center gap-2">
        <Btn variant="secondary" onClick={() => navigate("/product/list")}>
          상품 목록으로
        </Btn>
        <Btn variant="primary" onClick={() => navigate(appealPath(sanction))}>
          {SUSPENSION_COPY.appealButton}
        </Btn>
      </div>
    </div>
  )
}
