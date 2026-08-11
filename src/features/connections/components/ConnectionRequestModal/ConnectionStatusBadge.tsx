import type { ConnectionStatus } from "@/features/connections/services/connectionService"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<
  ConnectionStatus,
  { label: string; className: string }
> = {
  REQUESTED: {
    label: "요청중",
    className: "bg-sz-info-bg text-sz-info-text",
  },
  CONNECTED: {
    label: "연결됨",
    className: "bg-sz-success-bg text-sz-success-text",
  },
  REJECTED: {
    label: "거절",
    className: "bg-sz-neutral-bg text-sz-neutral-text",
  },
  DISCONNECTED: {
    label: "해제",
    className: "bg-sz-neutral-bg text-sz-neutral-text",
  },
}

/**
 * 시안 `.badge` — 이미 연결됨·요청중인 상대는 [요청] 버튼 대신 이 배지를 보여준다.
 * 눌렀다 실패시키지 않고 애초에 막는 방식이다(§13-6).
 */
export default function ConnectionStatusBadge({
  status,
}: {
  status: ConnectionStatus
}) {
  const { label, className } = STATUS_STYLES[status]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-[10px] px-[9px] py-0.5 text-[11px] font-medium",
        className
      )}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current opacity-75" />
      {label}
    </span>
  )
}
