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
 * 표시 라벨을 서버 값보다 앞세우는 상태(기-05). main은 이미 「공구 생성 대기」로 바꿨지만
 * 배포 전 개발 서버가 옛 「체결 처리 대기」를 주므로, 목록 · 상세 · 작성 폼 배지가 모두 이 한 곳을 거친다.
 * 배포 뒤에도 같은 문구라 걷어 내지 않아도 된다.
 */
const LABEL_OVERRIDE: Partial<Record<ContractStatus, string>> = {
  CONCLUSION_PENDING: "공구 생성 대기",
}

export function contractStatusLabel(
  status: ContractStatus,
  serverLabel: string
): string {
  return LABEL_OVERRIDE[status] ?? serverLabel
}
