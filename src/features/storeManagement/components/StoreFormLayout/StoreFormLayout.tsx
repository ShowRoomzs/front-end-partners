import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * 기본정보 관리 전용 레이아웃 프리미티브.
 *
 * `ProductFormLayout.tsx`(상품 관리)가 자기 파일 상단 주석에서 "다른 화면 재사용 금지"를
 * 명시해 뒀으므로 그대로 가져다 쓰지 않고 포크한다. 마크업 구조(.card/.sec/.frow/.flab/.hint)는
 * 같은 디자인시스템 원형에서 나왔지만, 이 화면(ui-partner-06 rev.8)은 라벨 폭(150px)과
 * 인풋 높이(32px, rev.8에서 36→32px로 컴팩트화)가 상품 관리(118px/36px)와 다르다.
 */

/** 시안 `.inp`/`.sel` — rev.8 컴팩트 규격(높이 32px, 패딩 6px 10px). 모든 필드 컨트롤에 붙인다 */
export const STORE_INPUT_CLASS = "h-8 px-2.5 py-1.5"

/** 시안 `.card` — 폼 전체를 감싸는 흰 카드. max-width:820px는 넣지 않는다(1440 캔버스 전용 수치). */
export function StoreFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      {children}
    </div>
  )
}

interface StoreSectionProps {
  title?: string
  /** 제목 없이 배너·본문만 있는 섹션에 쓴다(예: 변경요청 배너 바로 아래 섹션) */
  children: ReactNode
}

/** 시안 `.sec` — 20px 패딩 + 하단 구분선. 마지막 섹션은 구분선 없음(버튼 행이 형제로 붙어도 안전) */
export function StoreSection(props: StoreSectionProps) {
  const { title, children } = props

  return (
    <section className="border-b border-sz-n-100 p-5 last-of-type:border-b-0">
      {title && (
        <h2 className="mb-4 text-[13px] font-semibold text-sz-n-900">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

interface StoreFieldProps {
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string
  children: ReactNode
}

/** 시안 `.frow` — 150px 라벨 + 컨트롤. 필수 표시(*)는 항상 라벨 왼쪽 */
export function StoreField(props: StoreFieldProps) {
  const { label, required = false, hint, error, children } = props

  return (
    <div className="mb-3 flex items-start gap-3 last:mb-0">
      <div className="w-[150px] shrink-0 pt-[7px] text-[12px] text-sz-n-600">
        {required && <span className="mr-0.5 text-sz-danger-text">*</span>}
        {label}
      </div>
      <div className="min-w-0 flex-1">
        {children}
        {error && (
          <p className="mt-1.5 text-[12px] text-sz-danger-text">{error}</p>
        )}
        {hint && <StoreHint>{hint}</StoreHint>}
      </div>
    </div>
  )
}

/** 시안 `.hint` — 11px 회색 보조 설명 */
export function StoreHint({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-[11px] leading-[1.55] text-sz-n-500",
        className
      )}
    >
      {children}
    </p>
  )
}

/** 시안 `.btn-row` — 카드 하단 액션 행(오른쪽 정렬) */
export function StoreButtonRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2.5 p-5">{children}</div>
  )
}
