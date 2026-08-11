import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * 상품 등록·수정 폼 전용 레이아웃 프리미티브.
 *
 * 공용 `Section`/`FormItem`은 14px 라벨·24px 패딩의 예전 규격이라 디자인시스템 v1.2의
 * Compact 스케일(13px 제목·12px 라벨·11px 힌트·4px 그리드)과 어긋난다. 그 두 컴포넌트는
 * 쿠폰·문의·기본정보 등 다른 화면이 이미 물고 있어 손대면 범위가 번지므로,
 * 상품 관리 화면에서만 쓰는 프리미티브를 따로 둔다.
 *
 * 마크업은 시안 ui-partner-04의 `.card` / `.sec` / `.frow` / `.flab` / `.hint` 구조를 그대로 옮겼다.
 */

/**
 * 시안 `.card` — 폼 전체를 감싸는 흰 카드. 섹션들이 구분선으로 나뉜다.
 *
 * 시안의 `max-width:820px`는 넣지 않는다. 그 값은 1440px 캔버스에서
 * 카드 820 + 우측 레일 300 + 여백이 딱 맞아떨어지도록 잡은 수치라,
 * 실제 1920px 화면에 그대로 옮기면 오른쪽이 크게 비어 보인다.
 * 어드민 상세와 동일하게 남는 폭을 채우도록 둔다.
 */
export function ProductFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      {children}
    </div>
  )
}

interface ProductSectionProps {
  title: string
  /** 제목 앞에 * 를 붙인다(섹션 단위 필수) */
  required?: boolean
  /** 제목 오른쪽 회색 보조 문구 (시안 `.sec-note`) */
  note?: string
  /** 제목 바로 아래에 오는 안내 문구 — 개별 필드가 아니라 섹션 전체에 걸릴 때 */
  description?: ReactNode
  children: ReactNode
}

/**
 * 시안 `.sec` — 20px 패딩 + 하단 구분선. 마지막 섹션은 구분선이 없다.
 *
 * `last:`(=`:last-child`)가 아니라 `last-of-type:`(=`:last-of-type`)이어야 한다 —
 * 카드 안에서 마지막 섹션 **뒤에 버튼 행 `<div>`가 형제로 하나 더** 붙기 때문에
 * `:last-child`로는 어떤 섹션도 매치되지 않아 구분선이 그대로 남는다.
 * 버튼 행은 `<div>`라 `:last-of-type`(section 기준) 계산에서 자동으로 빠진다.
 */
export function ProductSection(props: ProductSectionProps) {
  const { title, required = false, note, description, children } = props

  return (
    <section className="border-b border-sz-n-100 p-5 last-of-type:border-b-0">
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className="text-[13px] font-semibold text-sz-n-900">
          {required && <span className="mr-0.5 text-sz-danger-text">*</span>}
          {title}
        </h2>
        {note && <span className="text-[11px] text-sz-n-500">{note}</span>}
      </div>
      {description && (
        <p className="-mt-2 mb-3 text-[11px] leading-[1.55] text-sz-n-500">
          {description}
        </p>
      )}
      {children}
    </section>
  )
}

interface ProductFieldProps {
  label: string
  required?: boolean
  /** 라벨 아래 작은 보조 문구 (시안 `.flab .sub`) — 예: "(선택)", "(최대 3)" */
  sub?: string
  hint?: ReactNode
  error?: string
  children: ReactNode
}

/** 시안 `.frow` — 118px 라벨 + 컨트롤. 라벨은 컨트롤 첫 줄에 맞춰 위쪽 정렬 */
export function ProductField(props: ProductFieldProps) {
  const { label, required = false, sub, hint, error, children } = props

  return (
    <div className="mb-3 flex items-start gap-3 last:mb-0">
      {/* 필수 표시(*)는 언제나 라벨 왼쪽 — 시안 `.flab`의 `<span class="req">*</span> 상품명` */}
      <div className="w-[118px] shrink-0 pt-[9px] text-[12px] text-sz-n-600">
        {required && <span className="mr-0.5 text-sz-danger-text">*</span>}
        {label}
        {sub && (
          <span className="mt-0.5 block text-[11px] text-sz-n-500">{sub}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {children}
        {error && (
          <p className="mt-1.5 text-[11px] font-medium text-sz-danger-text">
            {error}
          </p>
        )}
        {hint && <FormHint>{hint}</FormHint>}
      </div>
    </div>
  )
}

/** 시안 `.hint` — 11px 회색 보조 설명 */
export function FormHint({
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

/** 시안 `.img-sub-lab` — 이미지 섹션 안의 소제목 */
export function ImageSubLabel({
  children,
  required = false,
  note,
  className,
}: {
  children: ReactNode
  required?: boolean
  note?: string
  className?: string
}) {
  return (
    <div className={cn("mb-2 text-[12px] text-sz-n-700", className)}>
      {required && <span className="mr-0.5 text-sz-danger-text">*</span>}
      {children}
      {note && <span className="ml-1 text-sz-n-400">{note}</span>}
    </div>
  )
}
