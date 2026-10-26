import { parseServerDateTime } from "@/common/utils/formatDate"
import type { MemberAccountSanction } from "@/features/suspension/types"
import dayjs from "dayjs"

/** 배너 제목 옆 통지 시각 — `now()`로 찍힌 값이라 UTC → 로컬 */
export const formatSuspendedAt = (sanction: MemberAccountSanction) =>
  parseServerDateTime(sanction.suspendedAt).format("YYYY.MM.DD HH:mm")

/** 정지 시작일 — 통지 시각의 날짜(로컬) */
export const formatSuspendedOn = (sanction: MemberAccountSanction) =>
  parseServerDateTime(sanction.suspendedAt).format("YYYY.MM.DD")

/** 종료일 · 자동 해제 · 이의 기한은 벽시계 그대로 읽는다 */
export const formatWallDate = (value: string | null | undefined) =>
  value ? dayjs(value).format("YYYY.MM.DD") : null
