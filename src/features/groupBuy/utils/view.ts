import {
  formatDateOnly,
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate"
import type { GroupBuyDetailResponse } from "@/features/groupBuy/types"
import dayjs from "dayjs"

export type Detail = GroupBuyDetailResponse

/*
  상세 화면 분기 — 서버가 상태·권한을 판정해 내려주고, FE는 그 값으로 시안 B1~B7a 중
  어느 화면인지를 고른다. 조건을 새로 만들지 않고 응답에 있는 값만 읽는다.
*/

/** "08.14 10:00" — 스텝퍼 `.who`, 체크리스트 시각 */
export function md(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("MM.DD HH:mm") : "—"
}

/** "08.19" */
export function mdDate(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("MM.DD") : "—"
}

export const dt = (value: string | null | undefined) =>
  formatDateTimeShort(value ?? null)
export const d = (value: string | null | undefined) =>
  formatDateOnly(value ?? null)

/** 서버 LocalDate(yyyy-MM-dd) — 시간대와 무관한 날짜 */
export function localDate(value: string | null | undefined): string {
  return value ? dayjs(value).format("YYYY.MM.DD") : "—"
}

/** 기한까지 남은 날 — 「D-3」 · 당일 「D-day」 · 지나면 null */
export function dDay(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }
  const diff = parseServerDateTime(value)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day")
  if (diff < 0) {
    return null
  }
  return diff === 0 ? "D-day" : `D-${diff}`
}

export function isSelling(detail: Detail) {
  return (
    detail.groupBuy.status === "IN_PROGRESS" ||
    detail.groupBuy.status === "SUSPENSION_SCHEDULED"
  )
}

/** 인플루언서 콘텐츠 의무 — 「쇼룸 공구 게시물 · 인스타그램 피드 1 · 릴스 1 · 스토리 3」 */
export function contentDutyText(detail: Detail): string {
  const { feed, reels, story } = detail.contentDuty
  const insta = [
    feed ? `피드 ${feed}` : null,
    reels ? `릴스 ${reels}` : null,
    story ? `스토리 ${story}` : null,
  ].filter(Boolean)
  return insta.length > 0
    ? `쇼룸 공구 게시물 · 인스타그램 ${insta.join(" · ")}`
    : "쇼룸 공구 게시물"
}

/** 브랜드 의무(인플루언서가 확인하는 대상) — 계약 조건이라 고정 문구다 */
export const BRAND_DUTY_TEXT = "주문 배송 완료 · 고정 지급비 지급"

/** 「300,000원 · 게시물 등록 후」 — 상태 카드 한 줄용(지급 시점 앞의 「공구 」를 줄인다) */
export function fixedFeeShort(detail: Detail): string {
  const { amount, triggerLabel } = detail.fixedFee
  if (amount === null) {
    return "없음"
  }
  const when = triggerLabel?.replace(/^공구\s/, "")
  return when
    ? `${amount.toLocaleString("ko-KR")}원 · ${when}`
    : `${amount.toLocaleString("ko-KR")}원`
}

/** 판매 수량 합계와 상품별 내역 — 「크림 130 · 세럼 88」 */
export function quantityText(detail: Detail) {
  const quantities = detail.sales?.itemQuantities ?? []
  const total = quantities.reduce((sum, item) => sum + item.quantity, 0)
  const breakdown = quantities
    .map(item => {
      const name =
        detail.items.find(product => product.productId === item.productId)
          ?.productName ?? "상품"
      return `${name} ${item.quantity.toLocaleString("ko-KR")}`
    })
    .join(" · ")
  return { total, breakdown }
}

/** 이름 있는 옵션이 있는가 — 옵션 없는 상품은 이름 없는 1행으로 온다 */
export function hasNamedOptions(item: Detail["items"][number]): boolean {
  return (item.options ?? []).some(option => option.variantName !== null)
}

/**
 * 최소 준비 물량 — 「글로우 크림 50ml 300개(단품 200 · 2개 세트 100) · 글로우 세럼 30ml 200개」.
 * 옵션별 최소 물량은 다른 옵션으로 대체 충족할 수 없어(계약서 제5조 제2항) 옵션 내역까지 적는다 —
 * 서버가 물량 확보 이력에 남기는 문구와 같은 형식이다.
 */
export function minQuantityText(detail: Detail): string {
  return detail.items
    .filter(item => item.minQuantity !== null)
    .map(item => {
      const base = `${item.productName} ${item.minQuantity!.toLocaleString("ko-KR")}개`
      if (!hasNamedOptions(item)) {
        return base
      }
      const breakdown = item.options
        .map(
          option =>
            `${option.variantName ?? "단품"} ${(option.minQuantity ?? 0).toLocaleString("ko-KR")}`
        )
        .join(" · ")
      return `${base}(${breakdown})`
    })
    .join(" · ")
}

/**
 * 진행중에 무엇이 걸려 있는지 — 시안 B4 변종을 하나만 고른다.
 * 직권 중단 통지 > 검토 중 요청 > (연장·반려 중 더 최근 것) 순이다.
 */
export type SellingSituation =
  | { kind: "notice" }
  | { kind: "myRequest"; type: "SUSPEND" | "EARLY_CLOSE" }
  | { kind: "theirRequest" }
  | { kind: "decisionRejected"; type: "SUSPEND" | "EARLY_CLOSE" }
  | { kind: "extensionPending" }
  | { kind: "extensionAccepted" }
  | { kind: "extensionRejected" }
  | { kind: "none" }

export function sellingSituation(detail: Detail): SellingSituation {
  const { adminSuspension, activeRequest, lastDecision, extension } = detail
  if (
    detail.groupBuy.status === "SUSPENSION_SCHEDULED" &&
    adminSuspension?.status === "NOTICED"
  ) {
    return { kind: "notice" }
  }
  if (activeRequest) {
    return activeRequest.requesterType === "SELLER"
      ? { kind: "myRequest", type: activeRequest.type }
      : { kind: "theirRequest" }
  }

  const decisionAt =
    lastDecision?.result === "REJECTED" && lastDecision.decidedAt
      ? parseServerDateTime(lastDecision.decidedAt).valueOf()
      : null
  const extensionAt = extension.status
    ? parseServerDateTime(
        extension.respondedAt ?? extension.requestedAt ?? ""
      ).valueOf()
    : null

  if (
    decisionAt !== null &&
    lastDecision &&
    (extensionAt === null || decisionAt >= extensionAt)
  ) {
    return { kind: "decisionRejected", type: lastDecision.type }
  }
  switch (extension.status) {
    case "PENDING":
      return { kind: "extensionPending" }
    case "ACCEPTED":
      return { kind: "extensionAccepted" }
    case "REJECTED":
    case "EXPIRED":
      return { kind: "extensionRejected" }
    default:
      return { kind: "none" }
  }
}

/** 상세 헤더 `.page-d` — 「GB-… · 글로우_지민 · 2026.08.06 생성 · 시작까지 8일」 */
export function headerMeta(detail: Detail): string {
  const { groupBuy, timeline, counterparty, afterEnd, extension } = detail
  const head = [groupBuy.groupBuyNumber, counterparty.name]

  switch (groupBuy.status) {
    case "PREPARING":
      return [
        ...head,
        `${d(groupBuy.createdAt)} 생성`,
        timeline.daysUntilStart !== null
          ? `시작까지 ${timeline.daysUntilStart}일`
          : "시작 시각 경과",
      ].join(" · ")
    case "READY":
      return [
        ...head,
        `${d(groupBuy.readyAt)} 준비완료`,
        timeline.daysUntilStart !== null
          ? `시작까지 ${timeline.daysUntilStart}일`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    case "IN_PROGRESS":
    case "SUSPENSION_SCHEDULED":
      return [
        ...head,
        `진행 ${timeline.elapsedDays}일차`,
        timeline.daysUntilEnd !== null
          ? `종료까지 ${timeline.daysUntilEnd}일`
          : null,
        extension.status === "ACCEPTED" ? "연장 1회" : null,
      ]
        .filter(Boolean)
        .join(" · ")
    case "ENDED":
      return [
        ...head,
        `${d(groupBuy.endedAt)} 종료`,
        afterEnd?.openIssue ? "이슈 스레드 진행 중" : "정산 대기",
      ].join(" · ")
    case "SETTLED":
      return [
        ...head,
        `${d(afterEnd?.settledAt ?? groupBuy.endedAt)} 정산완료`,
      ].join(" · ")
    case "SUSPENDED":
      return [
        ...head,
        detail.closure?.source === "REQUEST" || !detail.closure?.source
          ? `${d(groupBuy.endedAt)} 중단`
          : `${d(groupBuy.endedAt)} 운영자 직권 중단`,
      ].join(" · ")
    default:
      return head.join(" · ")
  }
}

/** 이력에서 특정 사건의 가장 최근 시각 — 응답에 전용 필드가 없는 시각(반려·실적 확정)을 찾는다 */
export function lastEventAt(
  detail: Detail,
  eventType: Detail["history"][number]["eventType"]
): string | null {
  return (
    detail.history.find(entry => entry.eventType === eventType)?.occurredAt ??
    null
  )
}
