import {
  DELETE_BLOCKED_GROUP_BUY_STATUSES,
  PRODUCT_HIDE_REASON_LABELS,
} from "@/features/productManagement/constants/params"
import type {
  ProductDisplayStatus,
  ProductGroupBuyStatus,
  ProductHideReasonType,
} from "@/features/productManagement/services/productService"

/**
 * 수정 폼의 동작은 **진열 상태 × 공구 진행 여부** 두 축으로만 결정된다(§11-13).
 * 옵션 그룹 사용 여부는 권한과 무관하며 표 형태만 바꾼다.
 *
 * 세 규칙의 판단 축이 서로 다르다는 점이 이 화면에서 가장 틀리기 쉬운 부분이다:
 *   - 잠금        = 진열 상태 + 공구 진행 여부
 *   - 삭제 차단   = 공구 상태만 (진열 상태 무관)
 *   - 재검토 전환 = 미진열 사유만
 * 조합에 따라 "수정은 되는데 삭제는 안 되는" 경우가 실제로 존재한다.
 */

/**
 * 진행중 공구 잠금 — **"진열 AND 진행중"일 때 단 하나**.
 *
 * ⚠️ "미진열이면 해제"가 아니라 **"진열이 아니면 해제"**로 계산해야 한다.
 * 그래야 재검토 대기·미진열(요청)까지 정확히 잠금 해제된다(§11-9).
 * 소비자에게 노출되지 않는 상태는 공구·계약 내용과 어긋날 위험이 없기 때문이다.
 */
export function isProductLocked(
  displayStatus: ProductDisplayStatus | undefined,
  groupBuyStatus: ProductGroupBuyStatus | undefined
): boolean {
  return displayStatus === "DISPLAY" && groupBuyStatus === "IN_PROGRESS"
}

/**
 * 삭제 차단 여부 — **공구 상태만으로** 판단한다(§11-10).
 * 진열 상태와 무관하다. 재검토 대기 상품이 삭제 안 되는 이유도
 * "재검토 대기라서"가 아니라 "공구가 진행중이라서"다.
 */
export function isDeleteBlocked(
  groupBuyStatus: ProductGroupBuyStatus | undefined
): boolean {
  if (!groupBuyStatus) {
    return false
  }
  return DELETE_BLOCKED_GROUP_BUY_STATUSES.includes(groupBuyStatus)
}

/**
 * 저장 시 재검토 대기로 전환되는지 — **미진열 사유만으로** 판단한다(§12-5).
 * 브랜드 요청으로 인한 미진열은 정보 오류가 아니므로 운영자 재검수가 불필요하다.
 */
export function willTransitionToPendingReview(
  displayStatus: ProductDisplayStatus | undefined,
  hideReasonType: ProductHideReasonType | undefined
): boolean {
  if (displayStatus !== "HIDDEN" && displayStatus !== "HIDE_REQUEST") {
    return false
  }
  return hideReasonType !== "BRAND_REQUEST"
}

export type ProductBannerTone = "warn" | "info"

export interface ProductBanner {
  tone: ProductBannerTone
  message: string
}

/**
 * 상태별 안내 배너 (§11-13 "상태별 안내 배너 문구 기준" 표 그대로).
 * 진열 + 공구 진행 아님(경우 1)은 배너가 없다.
 */
export function getProductBanner(
  displayStatus: ProductDisplayStatus | undefined,
  groupBuyStatus: ProductGroupBuyStatus | undefined,
  hideReasonType: ProductHideReasonType | undefined
): ProductBanner | null {
  if (!displayStatus) {
    return null
  }

  // 경우 7 — 재검토 대기(공구 상태 무관)
  if (displayStatus === "PENDING_REVIEW") {
    return {
      tone: "warn",
      message:
        "상품 정보 수정 내용이 운영자 재검토 대기 중입니다. 검토가 끝날 때까지 소비자에게 노출되지 않으며, 검토 중에도 계속 수정할 수 있습니다.",
    }
  }

  // 경우 5·6 — 미진열(브랜드 요청). 저장해도 재검토로 전환되지 않는다
  if (displayStatus === "HIDE_REQUEST" || hideReasonType === "BRAND_REQUEST") {
    return {
      tone: "info",
      message:
        "브랜드 요청으로 미진열 처리된 상품입니다. 전체 항목을 수정할 수 있으며, 저장해도 재검토 요청으로 전환되지 않습니다. 다시 진열하려면 연결·소통 스레드에서 담당 운영자에게 진열 요청을 보내주세요.",
    }
  }

  // 경우 3·4 — 미진열(그 외 사유). 저장 시 재검토 요청으로 전환된다
  if (displayStatus === "HIDDEN") {
    return {
      tone: "warn",
      message:
        "미진열 상태입니다. 소비자에게 노출되지 않으므로 전체 항목을 수정할 수 있습니다. 저장하면 재검토 요청 상태로 전환되고, 운영자 검토 후 다시 진열됩니다.",
    }
  }

  // 경우 2 — 진열 + 공구 진행중
  if (groupBuyStatus === "IN_PROGRESS") {
    return {
      tone: "warn",
      message:
        "진행중 공구에 연결된 진열 상품입니다. 정보 변경 시 진행 중인 공구·계약 내용과 어긋날 수 있어 재고 수량을 제외한 모든 항목이 잠깁니다. 옵션 그룹·항목·옵션가·대표 옵션도 변경할 수 없습니다.",
    }
  }

  // 경우 1 — 진열 + 공구 진행 아님: 배너 없음
  return null
}

/** 미진열 사유 패널에 쓸 라벨. 알 수 없는 코드는 코드 그대로 보여준다. */
export function getHideReasonLabel(reasonType: string): string {
  return PRODUCT_HIDE_REASON_LABELS[reasonType] ?? reasonType
}
