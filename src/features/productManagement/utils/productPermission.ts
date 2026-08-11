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
 * 시안이 정의한 7경우(§11-13). 배너·저장 안내가 모두 이 값에서 갈린다.
 *
 * 경우별로 문구가 미묘하게 다르다 — 특히 공구 진행 여부에 따라
 * "진행중 공구에 연결되어 있지만…"이라는 문맥이 붙고 안 붙고가 갈린다.
 * 그래서 상태 조합을 먼저 하나의 경우 번호로 좁힌 뒤 문구를 고른다.
 */
export type ProductEditCase = 1 | 2 | 3 | 4 | 5 | 6 | 7

export function getProductEditCase(
  displayStatus: ProductDisplayStatus | undefined,
  groupBuyStatus: ProductGroupBuyStatus | undefined,
  hideReasonType: ProductHideReasonType | undefined
): ProductEditCase | null {
  if (!displayStatus) {
    return null
  }

  const isGroupBuyRunning = groupBuyStatus === "IN_PROGRESS"

  // 경우 7 — 재검토 대기는 공구 상태와 무관하게 하나로 묶인다
  if (displayStatus === "PENDING_REVIEW") {
    return 7
  }

  /*
    진열 여부를 사유보다 **먼저** 본다.
    다시 진열된 뒤에도 hideReasonType이 남아 있으면(서버가 지우지 못한 경우 등)
    사유부터 검사할 때 진열 중인 상품이 "미진열(요청)"로 잘못 분류된다.
  */
  if (displayStatus === "DISPLAY") {
    return isGroupBuyRunning ? 2 : 1
  }

  /*
    "미진열"과 "미진열(요청)"은 진열 상태값으로는 같은 미진열이고
    차이는 사유뿐이다(rev.31). HIDDEN + 브랜드요청도 요청 계열로 본다.
  */
  const isBrandRequested =
    displayStatus === "HIDE_REQUEST" || hideReasonType === "BRAND_REQUEST"

  if (isBrandRequested) {
    return isGroupBuyRunning ? 6 : 5
  }

  // 남은 건 미진열(그 외 사유)
  return isGroupBuyRunning ? 4 : 3
}

/**
 * 상태별 안내 배너 (§11-13 표 문구 그대로).
 *
 * ⚠️ 미진열 계열(경우 3~6)은 전부 **info(파랑)**다. 소비자 노출이 막혀 있어
 * 오히려 자유롭게 고칠 수 있다는 안내이지 경고가 아니다. warn(노랑)은
 * 실제로 제약이 걸리는 경우 2(잠금)와 경우 7(재검토 대기) 둘뿐이다.
 */
const CASE_BANNERS: Record<ProductEditCase, ProductBanner | null> = {
  // 경우 1 — 진열 + 공구 진행 아님: 배너 없음
  1: null,
  2: {
    tone: "warn",
    message:
      "진행중 공구에 연결된 진열 상품입니다. 정보 변경 시 진행 중인 공구·계약 내용과 어긋날 수 있어 재고 수량을 제외한 모든 항목이 잠깁니다. 옵션 그룹·항목·옵션가·대표 옵션도 변경할 수 없습니다.",
  },
  3: {
    tone: "info",
    message:
      "미진열 상태입니다. 소비자에게 노출되지 않으므로 전체 항목을 수정할 수 있습니다. 저장하면 재검토 요청 상태로 전환되고, 운영자 검토 후 다시 진열됩니다.",
  },
  4: {
    tone: "info",
    message:
      '진행중 공구에 연결되어 있지만 진열 상태가 "진열"이 아니므로 소비자에게 노출되지 않아 전체 항목을 수정할 수 있습니다. 저장하면 재검토 요청 상태로 전환됩니다.',
  },
  5: {
    tone: "info",
    message:
      "브랜드 요청으로 미진열 처리된 상품입니다. 전체 항목을 수정할 수 있으며, 저장해도 재검토 요청으로 전환되지 않습니다. 다시 진열하려면 연결·소통 스레드에서 담당 운영자에게 진열 요청을 보내주세요.",
  },
  6: {
    tone: "info",
    message:
      "진행중 공구에 연결되어 있지만 브랜드 요청으로 미진열 처리되어 소비자에게 노출되지 않으므로 전체 항목을 수정할 수 있습니다. 저장해도 재검토로 전환되지 않으며, 다시 진열하려면 연결·소통 스레드에서 진열 요청을 보내주세요.",
  },
  7: {
    tone: "warn",
    message:
      "상품 정보 수정 내용이 운영자 재검토 대기 중입니다. 검토가 끝날 때까지 소비자에게 노출되지 않으며, 검토 중에도 계속 수정할 수 있습니다.",
  },
}

export function getProductBanner(
  displayStatus: ProductDisplayStatus | undefined,
  groupBuyStatus: ProductGroupBuyStatus | undefined,
  hideReasonType: ProductHideReasonType | undefined
): ProductBanner | null {
  const editCase = getProductEditCase(
    displayStatus,
    groupBuyStatus,
    hideReasonType
  )
  return editCase ? CASE_BANNERS[editCase] : null
}

/**
 * 저장 버튼 위에 붙는 한 줄 안내 (시안 `.save-hint`).
 * 저장을 눌렀을 때 무슨 일이 생기는지 — 경우 1만 예고할 게 없다.
 */
const CASE_SAVE_HINTS: Record<ProductEditCase, string | null> = {
  1: null,
  2: "저장해도 재고 수량만 반영됩니다",
  3: "저장하면 재검토 요청 상태로 전환됩니다 · 운영자 검토 후 다시 진열",
  4: "저장하면 재검토 요청 상태로 전환됩니다 · 운영자 검토 후 다시 진열",
  5: "저장해도 재검토로 전환되지 않습니다 · 다시 진열은 소통 스레드에서 요청",
  6: "저장해도 재검토로 전환되지 않습니다 · 다시 진열은 소통 스레드에서 요청",
  7: "이미 재검토 대기 상태입니다 · 저장하면 검토 대상 내용이 갱신됩니다",
}

export function getSaveHint(
  displayStatus: ProductDisplayStatus | undefined,
  groupBuyStatus: ProductGroupBuyStatus | undefined,
  hideReasonType: ProductHideReasonType | undefined
): string | null {
  const editCase = getProductEditCase(
    displayStatus,
    groupBuyStatus,
    hideReasonType
  )
  return editCase ? CASE_SAVE_HINTS[editCase] : null
}

/** 미진열 사유 패널에 쓸 라벨. 알 수 없는 코드는 코드 그대로 보여준다. */
export function getHideReasonLabel(reasonType: string): string {
  return PRODUCT_HIDE_REASON_LABELS[reasonType] ?? reasonType
}
