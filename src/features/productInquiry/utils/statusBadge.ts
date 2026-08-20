import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  InquiryAnswerStatus,
  InquiryExposureStatus,
} from "@/features/productInquiry/types"

/**
 * 상태 배지 색 (§23-1).
 *
 * 어드민(§18)과 색이 하나 다르다 — **답변대기가 경고색**이다.
 * 상품 문의의 답변 주체는 브랜드라, 운영자에게는 정상 진행 중(정보)인 같은 상태가
 * 브랜드에게는 "내가 지금 조치해야 할 건"이다. 상태색 4원칙에서 경고는 화면 주체가
 * 조치해야 하는 상태를 뜻하므로 주체가 바뀌면 색도 바뀐다.
 *
 * - 답변대기 = 경고(브랜드 조치 필요)
 * - 답변완료 = 중립(종료)
 * - 삭제 요청 = 정보(운영자 검토 진행 중 — 브랜드가 더 할 일이 없다)
 * - 삭제 = 위험(소비자 노출이 실제로 막힘)
 *
 * 문구는 서버 `statusLabel`을 그대로 쓰고 여기서는 색만 정한다.
 */
export function getInquiryStatusVariant(
  status: InquiryAnswerStatus,
  exposureStatus: InquiryExposureStatus
): StatusBadgeVariant {
  if (exposureStatus === "DELETED") {
    return "danger"
  }

  if (exposureStatus === "DELETE_REQUESTED") {
    return "info"
  }

  return status === "ANSWERED" ? "neutral" : "warning"
}
