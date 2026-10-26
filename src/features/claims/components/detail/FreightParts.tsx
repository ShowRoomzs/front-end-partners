import Notice from "@/common/components/Notice/Notice"
import type { ReactNode } from "react"

/** 시안 `.mwarn` — 제출 전 확정 경고(반려 · 사유 번복 · 통과 확인) */
export const MWARN_CLASS =
  "rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700 [&_b]:font-semibold [&_b]:text-sz-n-900"

/**
 * 기-93 — 브랜드 귀책(착불)으로 신청한 건이 소비자 귀책으로 바뀔 때(사유 번복 B2b · 반려 B1r).
 * 운임 금액은 서버 미리보기가 없어 배포본에서는 이 안내만 보인다.
 */
export function CollectFreightNotice() {
  return (
    <Notice tone="neutral" className="mt-3">
      <div>
        귀책이 소비자로 바뀌면 <b>브랜드가 낸 착불 운임은 소비자에게 청구</b>
        됩니다(교환 = 재발송비에 포함 · 반품 = 환불액에서 차감).
      </div>
    </Notice>
  )
}

/** 시안 우 레일 금액 줄 — `.frow.ro` + 값 오른쪽 정렬 */
export function AmountRow(props: {
  label: string
  children: ReactNode
  sub?: ReactNode
}) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] last:border-b-0">
      <div className="w-[140px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="min-w-0 flex-1 text-right tabular-nums text-sz-n-900">
        {props.children}
        {props.sub && (
          <div className="mt-[2px] text-[11px] text-sz-n-500">{props.sub}</div>
        )}
      </div>
    </div>
  )
}
