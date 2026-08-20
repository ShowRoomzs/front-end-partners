import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  InquiryAnswerStatus,
  InquiryExposureStatus,
} from "@/features/productInquiry/types"

/**
 * 상태 배지 색 (§23-1) — 어드민 §18과 같은 매핑이다.
 *
 * - 답변대기 = 정보(진행 중). 브랜드가 답할 차례지만 아직 문제가 생긴 건 아니다 —
 *   지연 관리는 목록 정렬(답변대기 우선)과 툴바 건수가 맡는다.
 * - 답변완료 = 중립(종료)
 * - 삭제 요청 = 경고(운영자 검토 대기 — 결과에 따라 게시물이 내려간다)
 * - 삭제 = 위험. "종료는 중립"의 의도적 예외다 — 소비자 노출이 실제로 막힌 상태는
 *   목록에서 즉시 눈에 띄어야 한다.
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
    return "warning"
  }

  return status === "ANSWERED" ? "neutral" : "info"
}
