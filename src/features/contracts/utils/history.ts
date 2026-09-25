import type { HistoryItem } from "@/common/components/HistoryList/HistoryList"
import {
  ACTOR_LABEL,
  EVENT_LABEL,
  HISTORY_TONE,
} from "@/features/contracts/constants/labels"
import type { ContractHistoryEntry } from "@/features/contracts/types"

/**
 * 서버 이력(오래된순) → 처리 이력 목록(최신순).
 *
 * 브랜드·인플루언서는 표시명 스냅샷을, 운영자·시스템은 호칭을 쓴다(§25-10).
 * 상세(detail)가 있으면 "문구 · 상세"로 한 줄에 붙인다 — 무엇을 했는지와 왜 했는지가
 * 떨어져 있으면 이력을 두 번 읽어야 한다.
 */
export function toHistoryItems(
  history: Array<ContractHistoryEntry>
): Array<HistoryItem> {
  return [...history].reverse().map(entry => {
    const label = EVENT_LABEL[entry.eventType] ?? entry.eventType
    return {
      label: entry.detail ? `${label} · ${entry.detail}` : label,
      processedAt: entry.occurredAt,
      tone: HISTORY_TONE[entry.eventType] ?? "muted",
      processorName: entry.actorDisplayName ?? ACTOR_LABEL[entry.actorType],
    }
  })
}
