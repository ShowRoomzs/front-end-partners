import { mockDelay } from "@/common/utils/devMock"
import type {
  NotificationItem,
  NotificationPage,
  NotificationSummary,
} from "@/features/home/types"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

/*
  개발 서버 전용 목업 — `notificationService`가 DEV 가드 뒤에서 동적 import한다.
  문구는 시안 ui-partner-16 H1 드롭다운 5줄 그대로. 시각은 지금 기준 상대값(서버처럼 UTC 벽시계).
  읽음 처리는 이 모듈 안 메모리에만 남는다(새로고침하면 처음으로 돌아간다).
*/

const utcAgo = (hours: number) =>
  dayjs().subtract(hours, "hour").utc().format("YYYY-MM-DDTHH:mm:ss")

function row(
  id: number,
  actorType: NotificationItem["actorType"],
  actorLabel: string,
  category: string,
  title: string,
  target: NotificationItem["target"],
  hoursAgo: number,
  read: boolean
): NotificationItem {
  return {
    notificationId: id,
    type: "MOCK",
    category,
    actorType,
    actorLabel,
    title,
    body: null,
    emphasis: null,
    target,
    imageKind: null,
    imageUrl: null,
    liveGroupBuy: false,
    advertising: false,
    todoDueAt: null,
    read,
    createdAt: utcAgo(hoursAgo),
  }
}

function build(allRead: boolean): Array<NotificationItem> {
  return [
    row(
      5,
      "OPERATOR",
      "운영팀",
      "계약",
      "계약 「아이크림 신제품 공구」가 반려되었습니다 — 리워드율 표기 확인 필요",
      { type: "CONTRACT", id: 102, sub: null },
      18,
      allRead
    ),
    row(
      4,
      "CREATOR",
      "뷰티로그",
      "계약",
      "「비타 세럼 공구」 계약서에 서명했습니다",
      { type: "CONTRACT", id: 101, sub: "SIGNATURE" },
      47,
      allRead
    ),
    row(
      3,
      "SYSTEM",
      "시스템",
      "판매",
      "「수분 크림 공구」 취소 요청 1건이 응답 기한 경과로 자동 승인되었습니다",
      { type: "ORDER_GROUP", id: 5001, sub: null },
      49,
      allRead
    ),
    row(
      2,
      "OPERATOR",
      "운영팀",
      "공구",
      "「수분 크림 리필 공구」 게시물 오픈 승인이 완료되었습니다",
      { type: "GROUP_BUY", id: 202, sub: null },
      92,
      true
    ),
    row(
      1,
      "CREATOR",
      "글로우살롱",
      "정산",
      "「글로우 크림 앵콜 공구」 정산 조정 요청에 동의했습니다",
      { type: "ADJUSTMENT", id: 301, sub: null },
      140,
      true
    ),
  ]
}

let state: { scenario: string | null; items: Array<NotificationItem> } | null =
  null

/** H2(처리할 일 없음)는 시안에서 종 배지가 없다 — 그 시나리오만 처음부터 모두 읽음 */
function items(scenario: string | null) {
  if (!state || state.scenario !== scenario) {
    state = { scenario, items: build(scenario === "home-empty") }
  }
  return state.items
}

export function getSummaryMock(
  scenario: string | null
): Promise<NotificationSummary> {
  return mockDelay({
    unreadCount: items(scenario).filter(item => !item.read).length,
  })
}

export function getListMock(
  unreadOnly: boolean,
  scenario: string | null
): Promise<NotificationPage> {
  const content = items(scenario).filter(item => !unreadOnly || !item.read)
  return mockDelay({
    content,
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: content.length,
      limit: 20,
      hasNext: false,
    },
  })
}

export function markReadMock(notificationId: number): Promise<void> {
  state?.items.forEach(item => {
    if (item.notificationId === notificationId) item.read = true
  })
  return mockDelay(undefined, 100)
}

export function markAllReadMock(): Promise<void> {
  state?.items.forEach(item => {
    item.read = true
  })
  return mockDelay(undefined, 100)
}
