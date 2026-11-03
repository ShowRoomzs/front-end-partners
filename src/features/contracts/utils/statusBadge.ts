import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  ContractStatus,
  ContractStatusTone,
} from "@/features/contracts/types"

/** 서버 배지 색 → 공용 StatusBadge variant. 상태→색 판단은 서버가 하고 여기선 이름만 바꾼다 */
const TONE_TO_VARIANT: Record<ContractStatusTone, StatusBadgeVariant> = {
  NEUTRAL: "neutral",
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  DANGER: "danger",
}

export function toneToVariant(tone: ContractStatusTone): StatusBadgeVariant {
  return TONE_TO_VARIANT[tone] ?? "neutral"
}

/**
 * 표시 라벨을 서버 값보다 앞세우는 상태 — 목록 · 상세 · 작성 폼 · 홈 배지가 모두 이 한 곳을 거친다.
 * - `CONCLUSION_PENDING` 「공구 생성 대기」(기-05) — 옛 서버 「체결 처리 대기」 대비
 * - `CONCLUDED` 「체결완료」 — 서버가 「계약 성립」으로 바꿨지만(58 6-8) 파트너 시안 08(rev.32)은 상태 이름을
 *   「체결완료」로 두고 「계약 성립」은 양측 서명 완료 시각(`establishedAt`) 행 이름으로 쓴다
 */
const LABEL_OVERRIDE: Partial<Record<ContractStatus, string>> = {
  CONCLUSION_PENDING: "공구 생성 대기",
  CONCLUDED: "체결완료",
}

export function contractStatusLabel(
  status: ContractStatus,
  serverLabel: string
): string {
  return LABEL_OVERRIDE[status] ?? serverLabel
}
