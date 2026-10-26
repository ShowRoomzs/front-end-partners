import { mockDelay, mockScenario } from "@/common/utils/devMock"
import type {
  Withdrawal,
  WithdrawalBreakdown,
  WithdrawalCondition,
  WithdrawalRequestBody,
  WithdrawalRequestResponse,
} from "@/features/storeManagement/services/withdrawalService"
import dayjs from "dayjs"

/*
  브랜드 탈퇴 목업(개발 서버 전용) — `withdrawalService`가 가드 안에서 동적 import한다.
  값의 모양 · 라벨은 백엔드 main `SellerBasicInfoDto.Withdrawal` · `BrandWithdrawalChecklist`와 같게 둔다.
  시나리오 목록은 `withdrawalService.ts` 머리 주석.
*/

const REASON_OPTIONS = [
  { code: "BUSINESS_CLOSED", label: "사업 종료" },
  { code: "LOW_PERFORMANCE", label: "공구 성과가 기대에 못 미침" },
  { code: "OPERATION_BURDEN", label: "운영 부담(배송·CS)" },
  { code: "OTHER_CHANNEL_FOCUS", label: "다른 채널에 집중" },
  { code: "OTHER", label: "기타" },
]

const GROUP_LABEL = {
  WAIT: "기다리면 풀림",
  MY_ACTION: "내 응답 필요",
  OPERATOR: "운영팀 문의",
} as const

/** 날짜 · 기한은 오늘 기준으로 잡는다 — 고정 날짜는 금방 과거가 된다 */
const dateAfter = (days: number) =>
  dayjs().add(days, "day").format("YYYY-MM-DD")
const deadlineAfter = (days: number) =>
  `${dayjs().add(days, "day").format("YYYY-MM-DD")}T23:59:59`

function row(
  key: string,
  label: string,
  count: number,
  group: WithdrawalBreakdown["group"],
  extra: Partial<WithdrawalBreakdown> = {}
): WithdrawalBreakdown {
  return {
    key,
    label,
    count,
    group,
    groupLabel: GROUP_LABEL[group],
    action: null,
    expectedDate: null,
    reasonCode: null,
    reasonLabel: null,
    dueNote: null,
    target: null,
    items: [],
    ...extra,
  }
}

function condition(
  code: string,
  label: string,
  target: WithdrawalCondition["target"],
  breakdown: Array<WithdrawalBreakdown> = []
): WithdrawalCondition {
  const count = breakdown.reduce((sum, item) => sum + item.count, 0)
  return { code, label, count, satisfied: count === 0, target, breakdown }
}

const groupBuys = (breakdown?: Array<WithdrawalBreakdown>) =>
  condition(
    "ACTIVE_GROUP_BUYS",
    "진행 중 · 준비 중 공구",
    "GROUP_BUYS",
    breakdown
  )
const contracts = (breakdown?: Array<WithdrawalBreakdown>) =>
  condition(
    "CONTRACTS_BEFORE_CONCLUSION",
    "체결 전 계약",
    "CONTRACTS",
    breakdown
  )
const orders = (count = 0) =>
  condition(
    "UNCLOSED_ORDERS",
    "미종결 주문(배송 · 반품 · 교환)",
    "ORDERS",
    count > 0
      ? [row("UNCLOSED", "미종결 주문(배송 · 반품 · 교환)", count, "MY_ACTION")]
      : []
  )
const settlements = (breakdown?: Array<WithdrawalBreakdown>) =>
  condition("UNSETTLED", "진행 중 정산", "SETTLEMENTS", breakdown)

function build(
  conditions: Array<WithdrawalCondition>,
  extra: Partial<Withdrawal> = {}
): Withdrawal {
  const satisfiedCount = conditions.filter(item => item.satisfied).length
  return {
    state: satisfiedCount === conditions.length ? "AVAILABLE" : "BLOCKED",
    suspensionBlockedReason: null,
    satisfiedCount,
    totalCount: conditions.length,
    conditions,
    draftContractCount: 0,
    operatorThreadId: 812,
    pendingRequest: null,
    lastRejection: null,
    reasonOptions: REASON_OPTIONS,
    ...extra,
  }
}

const allSatisfied = () => [groupBuys(), contracts(), orders(), settlements()]

const adjustingRow = (deadlines: Array<number>) =>
  row("ADJUSTING", "조정 협의", deadlines.length, "MY_ACTION", {
    items: deadlines.map((days, index) => ({
      settlementId: 512 + index,
      settlementNumber: `STL-20261001-000${3 + index}`,
      threadId: 903 + index,
      deadlineAt: deadlineAfter(days),
      turn: index === 0 ? "MY_TURN" : "THEIR_TURN",
    })),
  })

function scenarioWithdrawal(email: string): Withdrawal {
  switch (mockScenario()) {
    // 시안 4-G 예시 값
    case "withdraw-blocked":
      return build(
        [
          groupBuys([
            row("PREPARING", "준비중", 1, "WAIT"),
            row("IN_PROGRESS", "진행중", 1, "WAIT"),
          ]),
          contracts([
            row("REVIEW_REJECTED", "검토 반려", 1, "MY_ACTION", {
              action: "DELETE",
            }),
            row("SIGNING", "서명 진행중", 1, "OPERATOR", {
              action: "CONTACT_OPERATOR",
            }),
          ]),
          orders(18),
          settlements([
            row("PAYOUT_SCHEDULED", "지급 예정", 1, "WAIT", {
              expectedDate: dateAfter(6),
            }),
            adjustingRow([4]),
          ]),
        ],
        { draftContractCount: 1 }
      )

    case "withdraw-blocked-more":
      return build(
        [
          groupBuys([row("IN_PROGRESS", "진행중", 2, "WAIT")]),
          contracts([
            row("REVIEW_PENDING", "검토 대기", 1, "MY_ACTION", {
              action: "CANCEL_REVIEW",
            }),
            row("REVIEW_REJECTED", "검토 반려", 1, "MY_ACTION", {
              action: "DELETE",
            }),
            row("SIGNING", "서명 진행중", 1, "OPERATOR", {
              action: "CONTACT_OPERATOR",
            }),
            row("CONCLUSION_PENDING", "체결 처리 대기", 1, "OPERATOR", {
              action: "CONTACT_OPERATOR",
            }),
          ]),
          orders(3),
          settlements([
            row("REVIEWING", "정산 확인 중", 1, "WAIT", {
              expectedDate: dateAfter(3),
            }),
            adjustingRow([2, 5]),
            row("PAYOUT_SCHEDULED", "지급 예정", 1, "WAIT", {
              expectedDate: dateAfter(8),
            }),
            row("BLOCKED", "지급 보류", 1, "MY_ACTION", {
              reasonCode: "ACCOUNT_HOLDER_MISMATCH",
              reasonLabel: "예금주 불일치",
              dueNote: "계좌 변경 후 지급",
              target: "SETTLEMENT_ACCOUNT",
            }),
            row("BLOCKED", "지급 보류", 1, "OPERATOR", {
              reasonCode: "PARTNER_NOT_READY",
              reasonLabel: "PG 셀러 등록 대기",
              dueNote: "PG 셀러 등록 후 지급",
            }),
            row("FAILED", "분배 실패", 1, "OPERATOR"),
            row("CLAWBACK_PENDING", "차감 대기", 1, "OPERATOR"),
          ]),
        ],
        { draftContractCount: 2 }
      )

    // 시안 4-G2 — 정산 정보 불일치 정지로 브랜드 몫 지급이 멈춰 정산 조건만 남는다
    case "withdraw-suspended":
      return build(
        [
          groupBuys(),
          contracts(),
          orders(),
          settlements([
            row("BLOCKED", "지급 보류", 1, "MY_ACTION", {
              reasonCode: "BRAND_SUSPENDED",
              reasonLabel: "계정 이용 정지 · 지급 정지(정산 정보 불일치)",
              dueNote: "정지 해제 다음 영업일 지급",
              target: "SETTLEMENT_ACCOUNT",
            }),
          ]),
        ],
        { draftContractCount: 1 }
      )

    case "withdraw-suspended-blocked":
      return build(allSatisfied(), {
        state: "BLOCKED",
        suspensionBlockedReason:
          "계정 이용 정지 중에는 탈퇴를 신청할 수 없습니다. 운영팀 소통 스레드로 문의해 주세요.",
      })

    case "withdraw-pending":
      return build(allSatisfied(), {
        state: "PENDING",
        pendingRequest: {
          requestId: 31,
          // 시간대 없는 값은 UTC로 읽힌다(parseServerDateTime) — 화면에는 시안대로 14:20(KST)
          requestedAt: "2026-09-01T05:20:00",
          reason: "BUSINESS_CLOSED",
          reasonLabel: "사업 종료",
          message: null,
          requesterName: "김담당",
          requesterEmail: email,
        },
      })

    case "withdraw-rejected":
      return build(allSatisfied(), {
        lastRejection: {
          requestId: 30,
          rejectedAt: "2026-10-16T02:00:00",
          reasonCode: "UNCLOSED_ORDERS",
          reasonLabel: "미종결 주문 잔존",
          note: "반품 검수 2건을 마친 뒤 다시 신청해 주세요.",
        },
      })

    default:
      return build(allSatisfied())
  }
}

/** 신청 · 취소가 바꾼 상태 — 새로 열거나 시나리오(`?mock=`)를 바꾸면 시나리오 값으로 돌아간다 */
let current: Withdrawal | undefined
let currentScenario: string | null = null
/** 4-I 신청자 칸 — 서버는 현재 로그인 이메일을 내린다 */
let loginEmail = ""

export function getWithdrawalMock(email: string): Promise<Withdrawal> {
  loginEmail = email
  if (!current || currentScenario !== mockScenario()) {
    currentScenario = mockScenario()
    current = scenarioWithdrawal(email)
  }
  return mockDelay(current)
}

export async function requestWithdrawalMock(
  body: WithdrawalRequestBody
): Promise<WithdrawalRequestResponse> {
  const base = current ?? scenarioWithdrawal(loginEmail)
  const requestedAt = new Date().toISOString().slice(0, 19)
  current = {
    ...base,
    state: "PENDING",
    lastRejection: null,
    pendingRequest: {
      requestId: 99,
      // 서버 now()와 같은 UTC 벽시계(시간대 표기 없음)
      requestedAt,
      reason: body.reason ?? null,
      reasonLabel:
        REASON_OPTIONS.find(option => option.code === body.reason)?.label ??
        "선택하지 않음",
      message: body.message ?? null,
      requesterName: "김담당",
      requesterEmail: loginEmail,
    },
  }
  return mockDelay({ requestId: 99, requestedAt })
}

export async function cancelWithdrawalMock(): Promise<void> {
  if (current) {
    current = {
      ...current,
      state:
        current.satisfiedCount === current.totalCount ? "AVAILABLE" : "BLOCKED",
      pendingRequest: null,
    }
  }
  await mockDelay(null)
}
