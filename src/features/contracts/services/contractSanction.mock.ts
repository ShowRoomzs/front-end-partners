import type { PageResponse } from "@/common/types/page"
import { mockContractDetail } from "@/features/contracts/services/contractDetail.mock"
import type {
  ContractDetailResponse,
  ContractListItem,
  ContractStatus,
} from "@/features/contracts/types"
import type { SanctionHoldView } from "@/features/suspension"

/*
  개발 서버 전용 — 정지 시나리오(`?mock=suspended*` · `?mock=counterparty-suspended`)에서
  아직 배포되지 않은 서버가 내리지 않는 `sanctionHold` · `signatureDeadlinePaused`를 채운다.
  규칙은 백엔드 main `api/common/sanction/SanctionHoldView.forBrand(Contract)` · `deadlinePaused` 그대로다.
  서버가 이미 값을 주면(배포 뒤) 건드리지 않는다. 서비스가 가드 안에서 동적 import한다 — 배포 번들에서 빠진다.
*/

const HOLDABLE: ReadonlyArray<ContractStatus> = [
  "REVIEW_PENDING",
  "SIGNING",
  "CONCLUSION_PENDING",
]

function stage(status: ContractStatus) {
  if (status === "REVIEW_PENDING") return "검토 보류"
  if (status === "CONCLUSION_PENDING") return "공구 생성 보류"
  return "체결 보류"
}

function holdFor(
  status: ContractStatus,
  counterparty: boolean
): SanctionHoldView | null {
  if (!counterparty && (status === "DRAFT" || status === "REVIEW_REJECTED")) {
    return { kind: "MINE", label: "편집 불가", tone: "NEUTRAL", party: null }
  }
  if (!HOLDABLE.includes(status)) return null
  return counterparty
    ? {
        kind: "COUNTERPARTY",
        label: `${stage(status)} · 상대 계정`,
        tone: "NEUTRAL",
        party: null,
      }
    : {
        kind: "MINE",
        label: `${stage(status)} · 계정 이용 정지`,
        tone: "WARNING",
        party: null,
      }
}

export function withListHolds(
  page: PageResponse<ContractListItem>,
  counterparty: boolean
): PageResponse<ContractListItem> {
  return {
    ...page,
    content: page.content.map(item =>
      item.sanctionHold !== undefined
        ? item
        : { ...item, sanctionHold: holdFor(item.status, counterparty) }
    ),
  }
}

export function withDetailHold(
  detail: ContractDetailResponse,
  counterparty: boolean
): ContractDetailResponse {
  if (detail.sanctionHold !== undefined) return detail
  return {
    ...detail,
    sanctionHold: holdFor(detail.status, counterparty),
    signatureDeadlinePaused: detail.status === "SIGNING",
  }
}

/** 로컬은 로그인이 막혀 상세 실호출이 대개 실패한다 — 그때는 서명 진행중 목업(S4b · R1)으로 본다 */
export async function detailOrSigningMock(
  real: () => Promise<ContractDetailResponse>,
  contractId: number
) {
  try {
    return await real()
  } catch {
    return mockContractDetail(contractId, "contract-signing")
  }
}
