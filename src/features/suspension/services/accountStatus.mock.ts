import { mockDelay } from "@/common/utils/devMock"
import type {
  MemberAccountSanction,
  MemberAccountStatusResponse,
} from "@/features/suspension/types"

/*
  개발 서버 전용 목업 — `accountStatusService`가 DEV 가드 뒤에서 동적 import한다(배포 번들에 들어가지 않는다).
  숫자는 시안 ui-partner-15 rev.3 예시 그대로: 2026.10.08 14:20 통지 → 10.09 한글날 · 주말 제외 3영업일 = 10.14.
  `suspendedAt`은 서버처럼 UTC 벽시계로 둔다(14:20 KST = 05:20 UTC).
*/

const BASE_SANCTION: MemberAccountSanction = {
  reason: "PRODUCT_INFO_FALSE",
  reasonLabel: "상품 정보 허위·과장",
  reasonDetail: null,
  suspendedAt: "2026-10-08T05:20:00",
  payoutHeld: false,
  operatorChannelThreadId: null,
  suspendCardMessageId: null,
  term: {
    endsOn: "2026-11-07",
    autoReleaseAt: "2026-11-08T00:00:00",
    // 시안 표기(30일)를 따른다 — 서버 공식(시작 · 종료일 포함)이면 31일이다
    periodDays: 30,
    appealDeadlineAt: "2026-10-14T23:59:59",
    appealReviewBusinessDays: null,
  },
}

const ACTIVE: MemberAccountStatusResponse = {
  status: "ACTIVE",
  sanction: null,
  withdrawalPending: false,
}

function suspended(
  sanction: Partial<MemberAccountSanction>
): MemberAccountStatusResponse {
  return {
    status: "SUSPENDED",
    sanction: { ...BASE_SANCTION, ...sanction },
    withdrawalPending: false,
  }
}

export function getAccountStatusMock(scenario: string | null) {
  switch (scenario) {
    case "suspended":
      return mockDelay(suspended({}))
    case "suspended-payout":
      return mockDelay(
        suspended({
          reason: "SETTLEMENT_INFO_MISMATCH",
          reasonLabel: "정산 정보 불일치",
          reasonDetail:
            "정산 계좌 예금주(김○○)가 사업자등록증 상호(주식회사 ○○)와 일치하지 않습니다. 사업자 명의 계좌로 변경 요청 후 운영팀 채널로 알려 주세요.",
          payoutHeld: true,
        })
      )
    case "suspended-open":
      return mockDelay(
        suspended({
          term: {
            endsOn: null,
            autoReleaseAt: null,
            periodDays: null,
            appealDeadlineAt: "2026-10-14T23:59:59",
            appealReviewBusinessDays: null,
          },
        })
      )
    default:
      return mockDelay(ACTIVE)
  }
}
