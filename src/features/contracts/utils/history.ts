import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { HistoryItem } from "@/common/components/HistoryList/HistoryList"
import {
  ACTOR_LABEL,
  EVENT_LABEL,
  HISTORY_TONE,
} from "@/features/contracts/constants/labels"
import type { ContractHistoryEntry } from "@/features/contracts/types"
import { formatKRW } from "@/features/contracts/utils/format"

/**
 * 서버 이력(오래된순) → 처리 이력 목록(최신순).
 *
 * 브랜드·인플루언서는 표시명 스냅샷을, 운영자·시스템은 호칭을 쓴다(§25-10).
 * 상세(detail)가 있으면 "문구 · 상세"로 한 줄에 붙인다 — 무엇을 했는지와 왜 했는지가
 * 떨어져 있으면 이력을 두 번 읽어야 한다.
 */
export function toHistoryItems(
  history: Array<ContractHistoryEntry>,
  fixedFeeAmount: number | null = null
): Array<HistoryItem> {
  // 서버 정렬에 기대지 않는다 — 스튜디오 응답은 최신순, 셀러 응답은 오래된순으로 온다
  return newestFirst(history)
    .filter(entry => !HIDDEN_EVENTS.has(entry.eventType))
    .map(entry => {
      // 시안 B5a 「고정 지급비 300,000원 지급 완료 기록 · 브랜드 직접 지급」 — 금액을 문구에 넣는다
      const label =
        entry.eventType === "FIXED_FEE_PAID" && fixedFeeAmount
          ? `고정 지급비 ${formatKRW(fixedFeeAmount)} 지급 완료 기록 · 브랜드 직접 지급`
          : (EVENT_LABEL[entry.eventType] ?? entry.eventType)
      // 반려 사유는 서명 진행 카드가 따로 보여준다 — 시안 이력은 「어드민 검토 반려 · 편집 재개」까지만
      const detail =
        // 반려 사유·확인한 경고 코드(W1…)는 이력 문구에 붙이지 않는다(시안 B3c·B6)
        entry.eventType === "REVIEW_REJECTED" ||
        entry.eventType === "REVIEW_REQUESTED"
          ? null
          : humanizeHistoryDetail(entry.detail)
      return {
        // 시안 B8 「계약 취소 · 조건 재검토 필요 · 상대 통지」
        label:
          entry.eventType === "CANCELED"
            ? `${label}${detail ? ` · ${detail}` : ""} · 상대 통지`
            : detail
              ? `${label} · ${detail}`
              : label,
        processedAt: entry.occurredAt,
        tone: HISTORY_TONE[entry.eventType] ?? "muted",
        processorName: entry.actorDisplayName ?? ACTOR_LABEL[entry.actorType],
      }
    })
}

/**
 * 어드민이 운영하며 남기는 장부성 이벤트 — 시안 이력(B3c~B8)에 한 번도 나오지 않고,
 * 같은 사실을 「브랜드 서명 완료」·「체결완료」 같은 이벤트가 이미 말한다.
 */
const HIDDEN_EVENTS = new Set<string>([
  "SIGNATURE_UPDATED",
  "BOTH_SIGNED_CONFIRMED",
  "CONTRACT_PDF_GENERATED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DELETED",
])

/** 이력 상세 문자열에 서버 시각(ISO)·null이 그대로 섞여 오면 화면 표기로 바꾼다 */
const ISO_IN_TEXT =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/g

export function humanizeHistoryDetail(detail: string | null) {
  return detail
    ? detail
        .replace(ISO_IN_TEXT, match => formatDateTimeShort(match))
        // 「브랜드 서명: null → …」처럼 빈 값이 서버 표기 그대로 온다
        .replace(/\bnull\b/g, "없음")
    : detail
}

/**
 * 최신순으로 맞춘다. 같은 분에 찍힌 이벤트(검토 통과 → 서명 요청 발송)는 서버가 준 순서의
 * 역순이 곧 최신순이므로, 먼저 서버 방향을 최신순으로 뒤집은 뒤 시각으로 안정 정렬한다.
 */
function newestFirst<T extends { occurredAt: string }>(history: Array<T>) {
  const ascending =
    history.length > 1 &&
    history[0].occurredAt <= history[history.length - 1].occurredAt
  const base = ascending ? [...history].reverse() : [...history]
  return base.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}
