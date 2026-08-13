import type { BannerTone } from "@/features/storeManagement/components/RequestBanner/RequestBanner"
import type {
  ChangeRequestBannerResponse,
  ChangeRequestStatus,
} from "@/features/storeManagement/services/changeRequestService"

/** §9 상태색 3원칙 — 검토중은 정상 대기라 경고색이 아니라 정보색이다 */
export function getBannerTone(status: ChangeRequestStatus): BannerTone {
  if (status === "APPROVED") return "success"
  if (status === "REJECTED") return "danger"
  return "info"
}

export function getBannerTitle(
  status: ChangeRequestStatus,
  subjectLabel: string
): string {
  if (status === "APPROVED") return "변경 요청이 승인되었습니다"
  if (status === "REJECTED") return "변경 요청이 반려되었습니다"
  return `${subjectLabel} 변경 요청 검토 중`
}

/** PENDING만 "요청 취소"(cancelable) — 승인·반려는 1회성 알림이라 "확인"으로 닫는다 */
export function getBannerActionLabel(status: ChangeRequestStatus): string {
  return status === "PENDING" ? "요청 취소" : "확인"
}

/** 검토중은 요청 시각, 승인·반려는 처리 시각을 보여준다 */
export function getBannerDate(banner: ChangeRequestBannerResponse): string {
  return banner.status === "PENDING"
    ? banner.requestedAt
    : (banner.processedAt ?? banner.requestedAt)
}
