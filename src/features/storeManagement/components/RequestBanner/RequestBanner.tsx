import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type BannerTone = "info" | "success" | "danger"

const TONE_STYLES: Record<
  BannerTone,
  { bg: string; iconBg: string; titleColor: string; icon: string }
> = {
  info: {
    bg: "bg-sz-info-bg",
    iconBg: "bg-sz-info-text",
    titleColor: "text-sz-info-text",
    icon: "i",
  },
  success: {
    bg: "bg-sz-success-bg",
    iconBg: "bg-sz-success-text",
    titleColor: "text-sz-success-text",
    icon: "✓",
  },
  danger: {
    bg: "bg-sz-danger-bg",
    iconBg: "bg-sz-danger-text",
    titleColor: "text-sz-danger-text",
    icon: "!",
  },
}

interface RequestBannerProps {
  tone: BannerTone
  title: string
  /** 시안 `.bd` — 날짜+요청 항목 문구. 반려 사유 박스는 별도 prop으로 넘긴다 */
  body: ReactNode
  rejectReason?: string | null
  /** 미입력이면 null — 행 자체를 렌더링하지 않는다(§15-8, 빈칸으로 두지 않는다) */
  rejectReasonDetail?: string | null
  actionLabel: string
  onAction: () => void
  isSubmitting?: boolean
}

/**
 * 시안 `.banner`(§9 상태색 3원칙) — 검토중=정보색(브랜드 조치 불필요한 정상 대기),
 * 승인=성공색, 반려=위험색(브랜드가 서류를 고쳐 다시 요청해야 하는 조치 필요 상태).
 * "검토 중"을 경고색으로 바꾸지 않는다 — 대기는 정상 진행이지 경고가 아니다(§9 원칙).
 */
export default function RequestBanner(props: RequestBannerProps) {
  const {
    tone,
    title,
    body,
    rejectReason,
    rejectReasonDetail,
    actionLabel,
    onAction,
    isSubmitting = false,
  } = props
  const style = TONE_STYLES[tone]

  return (
    <div
      className={cn(
        "mx-5 mt-5 flex items-start gap-2.5 rounded-[6px] p-3.5",
        style.bg
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
          style.iconBg
        )}
      >
        {style.icon}
      </span>
      <div className="flex-1">
        <div className={cn("text-[12px] font-semibold", style.titleColor)}>
          {title}
        </div>
        <div className="mt-0.5 text-[11px] leading-[1.6] text-sz-n-600">
          {body}
          {rejectReason && (
            <div className="mt-2 rounded-[6px] border border-sz-danger-bg bg-white px-[11px] py-[9px] text-[11px] leading-[1.65] text-sz-n-700">
              <span className="mb-0.5 block font-semibold text-sz-danger-text">
                반려 사유
              </span>
              <span className="block font-medium text-sz-n-900">
                {rejectReason}
              </span>
              {rejectReasonDetail && (
                <div className="mt-2 border-t border-dashed border-sz-n-200 pt-2">
                  <span className="mr-1 font-semibold text-sz-n-600">
                    상세 사유
                  </span>
                  {rejectReasonDetail}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={isSubmitting}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  )
}
