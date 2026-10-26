import type { PageResponse } from "@/common/types/page"
import { mockDetail } from "@/features/groupBuy/services/groupBuy.mock"
import type {
  GroupBuyDetailResponse,
  GroupBuyListItem,
  GroupBuyStatus,
} from "@/features/groupBuy/types"
import type { SanctionHoldView } from "@/features/suspension"

/*
  개발 서버 전용 — 정지 시나리오(`?mock=suspended*` · `?mock=counterparty-suspended`)에서
  아직 배포되지 않은 서버가 내리지 않는 `sanctionHold`를 채운다.
  규칙은 백엔드 main `api/common/sanction/SanctionHoldView.forBrand(GroupBuy)` 그대로 — 오픈 전(준비중 · 준비완료)만.
  서버가 이미 값을 주면(배포 뒤) 건드리지 않는다. 서비스가 가드 안에서 동적 import한다 — 배포 번들에서 빠진다.
*/

function holdFor(
  status: GroupBuyStatus,
  counterparty: boolean
): SanctionHoldView | null {
  if (status !== "PREPARING" && status !== "READY") return null
  return counterparty
    ? {
        kind: "COUNTERPARTY",
        label: "승인 보류 · 상대 계정",
        tone: "NEUTRAL",
        party: null,
      }
    : {
        kind: "MINE",
        label: "승인 보류 · 계정 이용 정지",
        tone: "WARNING",
        party: null,
      }
}

export function withListHolds(
  page: PageResponse<GroupBuyListItem>,
  counterparty: boolean
): PageResponse<GroupBuyListItem> {
  return {
    ...page,
    content: page.content.map(item =>
      item.sanctionHold !== undefined
        ? item
        : { ...item, sanctionHold: holdFor(item.status, counterparty) }
    ),
  }
}

/**
 * 로컬은 로그인이 막혀 상세 실호출이 대개 실패한다 — 그때는 시안 상태 목업으로 본다.
 * 내 정지는 S3a(진행중 · 연장 차단), 상대 정지는 R2(준비완료 · 오픈 보류).
 */
export async function detailWithHold(
  real: () => Promise<GroupBuyDetailResponse>,
  groupBuyId: number,
  counterparty: boolean
): Promise<GroupBuyDetailResponse> {
  let detail: GroupBuyDetailResponse
  try {
    detail = await real()
  } catch {
    detail = await mockDetail(
      counterparty ? "gb-ready" : "gb-selling",
      groupBuyId
    )
  }
  if (detail.sanctionHold !== undefined) return detail
  return {
    ...detail,
    sanctionHold: holdFor(detail.groupBuy.status, counterparty),
  }
}
