import { parseServerDateTime } from "@/common/utils/formatDate"
import dayjs from "dayjs"

/** 시안 표기 그대로 — "245KB", "1.8MB", "18.4MB" */
export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`
  }
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${Math.round(kb)}KB`
  }
  const mb = kb / 1024
  if (mb < 1024) {
    return `${mb.toFixed(1)}MB`
  }
  return `${(mb / 1024).toFixed(1)}GB`
}

/** 영상 재생시간 — "0:42", "1:05:30" */
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = Math.floor(seconds % 60)
  const paddedSeconds = String(rest).padStart(2, "0")

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`
  }
  return `${minutes}:${paddedSeconds}`
}

/** 메시지 전송 시각 — "14:02" */
export function formatMessageTime(date: string) {
  return parseServerDateTime(date).format("HH:mm")
}

/** 날짜 구분선 — "2026.08.05" */
export function formatDayMark(date: string) {
  return parseServerDateTime(date).format("YYYY.MM.DD")
}

/**
 * 목록의 최근 메시지 시각 — 시안 `.cs-time`("방금", "1시간", "3일전").
 * 좁은 칸이라 절대 시각 대신 상대 표기를 쓴다.
 */
export function formatRelativeTime(date: string | null) {
  if (!date) {
    return ""
  }

  const target = parseServerDateTime(date)
  const now = dayjs()
  const minutes = now.diff(target, "minute")

  if (minutes < 1) {
    return "방금"
  }
  if (minutes < 60) {
    return `${minutes}분`
  }

  const hours = now.diff(target, "hour")
  if (hours < 24) {
    return `${hours}시간`
  }

  const days = now.diff(target, "day")
  if (days < 7) {
    return `${days}일전`
  }
  return target.format("YYYY.MM.DD")
}

/** 팔로워 수 — 시안 "팔로워 1.2만", "팔로워 8천" */
export function formatFollowerCount(count: number | null) {
  if (count === null) {
    return null
  }
  if (count >= 10_000) {
    const value = count / 10_000
    return `팔로워 ${Number.isInteger(value) ? value : value.toFixed(1)}만`
  }
  if (count >= 1_000) {
    const value = count / 1_000
    return `팔로워 ${Number.isInteger(value) ? value : value.toFixed(1)}천`
  }
  return `팔로워 ${count.toLocaleString()}`
}
