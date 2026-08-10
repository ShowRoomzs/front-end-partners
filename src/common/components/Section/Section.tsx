import type { ReactNode } from "react"

interface SectionProps {
  title?: string
  children: ReactNode
  required?: boolean
  className?: string
}

export default function Section(props: SectionProps) {
  const { title, children, required = false, className = "" } = props

  // 제목은 디자인시스템 H3(13px/600) — 카드·모달 제목 등급이다.
  // 예전엔 text-base(16px)를 썼는데 그건 H2(페이지 안 큰 구획) 등급이라 한 칸 컸다.
  return (
    <section
      className={`relative mb-5 rounded-[8px] border border-sz-n-200 bg-white ${className}`}
    >
      {title && (
        <div className="border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            {title}
            {required && <span className="ml-1 text-sz-danger-text">*</span>}
          </h2>
        </div>
      )}
      <div className="flex flex-col gap-5 p-5">{children}</div>
    </section>
  )
}
