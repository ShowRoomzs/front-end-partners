import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { ContractDetailResponse } from "@/features/contracts/types"
import { formatMonthDayTime } from "@/features/contracts/utils/datetime"

/**
 * 상세 화면 13종의 분기(설계서 4-5). 상태 하나에 서명 조합·지급 여부를 곱해 화면을 고른다.
 * **버튼은 여기서 정하지 않는다** — `permissions`가 정한다. 이 값은 배너 톤·스텝퍼·메타 행·
 * 안내 문구처럼 레이아웃과 문구만 고른다.
 */
export type ContractViewState =
  | "draft" // B1·B2·B3·B2a — 작성 폼
  | "reviewPending" // B3c
  | "reviewRejected" // B3d
  | "signingNone" // B4 — 양측 미서명
  | "signingMine" // B4a — 내 서명 완료 · 상대 대기
  | "signingTheirs" // B4c — 상대 서명 완료 · 내 서명 필요
  | "conclusionPending" // B4b
  | "concludedNoFee" // B5 — 고정 지급비 0원
  | "concludedPaid" // B5a — 지급 완료 기록됨
  | "concludedFeeDue" // B5b — 지급 예정
  | "declined" // B6
  | "expired" // B7
  | "canceled" // B8

export function deriveContractView(
  detail: ContractDetailResponse
): ContractViewState {
  const { status, signature, fixedFee } = detail

  switch (status) {
    case "DRAFT":
      return "draft"
    case "REVIEW_PENDING":
      return "reviewPending"
    case "REVIEW_REJECTED":
      return "reviewRejected"
    case "SIGNING":
      if (signature.brandSignedAt && signature.creatorSignedAt) {
        // 양측 서명이 다 찼는데 아직 상태가 넘어가지 않은 찰나 — 체결 처리 대기로 그린다
        return "conclusionPending"
      }
      if (signature.brandSignedAt) {
        return "signingMine"
      }
      if (signature.creatorSignedAt) {
        return "signingTheirs"
      }
      return "signingNone"
    case "CONCLUSION_PENDING":
      return "conclusionPending"
    case "CONCLUDED":
      if (!fixedFee.amount) {
        return "concludedNoFee"
      }
      return fixedFee.paidAt ? "concludedPaid" : "concludedFeeDue"
    case "DECLINED":
      return "declined"
    case "EXPIRED":
      return "expired"
    case "CANCELED":
      return "canceled"
  }
}

export const CLOSED_VIEWS: ReadonlyArray<ContractViewState> = [
  "declined",
  "expired",
  "canceled",
]

export const CONCLUDED_VIEWS: ReadonlyArray<ContractViewState> = [
  "concludedNoFee",
  "concludedPaid",
  "concludedFeeDue",
]

export const SIGNING_VIEWS: ReadonlyArray<ContractViewState> = [
  "signingNone",
  "signingMine",
  "signingTheirs",
  "conclusionPending",
]

/** 시안 `.stp` 4단계 칩 */
export type StepTone = "todo" | "done" | "cur" | "stop" | "halt"

export interface StepChip {
  label: string
  who: string
  tone: StepTone
}

/**
 * 진행 단계 — 상태 배지와 같은 색 축을 쓴다(rev.2). 거절만 `stop`(위험), 만료·취소는 `halt`(중립).
 * 시각은 서버 값에서만 뽑고 없으면 `—`.
 */
export function buildStepper(
  view: ContractViewState,
  detail: ContractDetailResponse
): Array<StepChip> {
  const { review, signature, closure } = detail

  const approved: StepChip = {
    label: "어드민 검토 통과",
    who: formatMonthDayTime(review.approvedAt),
    tone: "done",
  }
  const sent: StepChip = {
    label: "서명 요청 발송",
    who: signature.requestedAt
      ? `양측 메일·문자 · ${formatMonthDayTime(signature.requestedAt)}`
      : "—",
    tone: "done",
  }
  const conclude: StepChip = {
    label: "어드민 체결 완료 처리",
    who: "PDF + 감사추적인증서",
    tone: "todo",
  }

  switch (view) {
    case "reviewPending":
      return [
        {
          label: "어드민 검토",
          who: `제출 ${formatMonthDayTime(review.requestedAt)} · 확인 중`,
          tone: "cur",
        },
        { label: "서명 요청 발송", who: "통과 시 양측 발송", tone: "todo" },
        { label: "양측 서명", who: "—", tone: "todo" },
        { label: "어드민 체결 완료 처리", who: "—", tone: "todo" },
      ]
    case "reviewRejected":
      return [
        {
          label: "어드민 검토 반려",
          who: `${formatMonthDayTime(review.rejectedAt)} · 어드민`,
          tone: "stop",
        },
        { label: "서명 요청 발송", who: "—", tone: "todo" },
        { label: "양측 서명", who: "—", tone: "todo" },
        { label: "어드민 체결 완료 처리", who: "—", tone: "todo" },
      ]
    case "signingNone":
    case "signingMine":
    case "signingTheirs": {
      const who =
        view === "signingNone"
          ? `브랜드 0 / 인플루언서 0`
          : view === "signingMine"
            ? "1 / 2 · 인플루언서 대기"
            : "1 / 2 · 내 서명 대기"
      return [
        approved,
        sent,
        { label: "양측 서명", who, tone: "cur" },
        conclude,
      ]
    }
    case "conclusionPending":
      return [
        approved,
        { ...sent, who: formatMonthDayTime(signature.requestedAt) },
        {
          label: "양측 서명 완료",
          who: `브랜드 ${formatMonthDayTime(signature.brandSignedAt)} · 인플루언서 ${formatMonthDayTime(signature.creatorSignedAt)}`,
          tone: "done",
        },
        { ...conclude, who: "확인 중", tone: "cur" },
      ]
    case "concludedNoFee":
    case "concludedPaid":
    case "concludedFeeDue":
      return [
        approved,
        { ...sent, who: formatMonthDayTime(signature.requestedAt) },
        {
          label: "양측 서명 완료",
          who: `브랜드 ${formatMonthDayTime(signature.brandSignedAt)} · 인플루언서 ${formatMonthDayTime(signature.creatorSignedAt)}`,
          tone: "done",
        },
        {
          label: "체결완료",
          who: `${formatMonthDayTime(concludedAt(detail))} · PDF·인증서 발급됨`,
          tone: "cur",
        },
      ]
    case "declined":
      return [
        approved,
        sent,
        {
          label: "인플루언서 거절",
          who: `${detail.counterparty.showroomName ?? "인플루언서"} · ${formatMonthDayTime(closure.closedAt)}`,
          tone: "stop",
        },
        { label: "체결완료", who: "진행되지 않음", tone: "todo" },
      ]
    case "expired":
      return [
        approved,
        sent,
        {
          label: "서명 기한 초과",
          who: `${formatMonthDayTime(signature.deadlineAt)}까지`,
          tone: "halt",
        },
        {
          label: "만료 처리",
          who: `어드민 · ${formatMonthDayTime(closure.closedAt)}`,
          tone: "halt",
        },
        { label: "체결완료", who: "진행되지 않음", tone: "todo" },
      ]
    case "canceled":
      return [
        approved,
        sent,
        {
          label: "어드민 직권 취소",
          who: `${formatMonthDayTime(closure.closedAt)}`,
          tone: "halt",
        },
        { label: "체결완료", who: "진행되지 않음", tone: "todo" },
      ]
    case "draft":
      return []
  }
}

/** 상세 헤더 설명 줄 — "CTR · 상대 · 시각 이벤트" */
export function headerMeta(
  detail: ContractDetailResponse,
  view: ContractViewState
): string {
  const parts: Array<string> = []
  if (detail.contractNumber) {
    parts.push(detail.contractNumber)
  }
  if (detail.counterparty.showroomName) {
    parts.push(detail.counterparty.showroomName)
  }

  const event = (() => {
    switch (view) {
      case "declined":
        return `${formatDateTimeShort(detail.closure.closedAt)} 거절`
      case "expired":
        return `${formatDateTimeShort(detail.closure.closedAt)} 만료`
      case "canceled":
        return `${formatDateTimeShort(detail.closure.closedAt)} 취소`
      case "concludedNoFee":
      case "concludedFeeDue":
        return `${formatDateTimeShort(concludedAt(detail))} 체결`
      case "concludedPaid":
        return `${formatDateTimeShort(concludedAt(detail))} 체결 · ${formatDateTimeShort(detail.fixedFee.paidAt)} 지급완료`
      default:
        return detail.review.requestedAt
          ? `${formatDateTimeShort(detail.review.requestedAt)} 검토 요청`
          : null
    }
  })()
  if (event) {
    parts.push(event)
  }

  return parts.join(" · ")
}

/**
 * 체결 시각 — 셀러 상세 응답엔 체결 시각 필드가 없고 `closure.closedAt`은 종결 3종에만 찬다.
 * 이력의 체결 이벤트 시각으로 대신한다.
 */
export function concludedAt(detail: ContractDetailResponse): string | null {
  return (
    detail.closure.closedAt ??
    detail.history.find(entry => entry.eventType === "CONCLUDED")?.occurredAt ??
    null
  )
}
