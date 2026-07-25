import { Checkbox } from "@/components/ui/checkbox"

export type Term = {
  key: string
  label: string
  /** "보기" 클릭 시 약관 원문 노출 */
  onView?: () => void
}

type TermsAgreementProps = {
  terms: Term[]
  checked: Record<string, boolean>
  onChange: (next: Record<string, boolean>) => void
}

// 전체 동의 + 개별 필수 약관. 미동의 시 에러 문구를 노출하지 않는다(스펙 확정: 버튼 비활성만).
export function TermsAgreement({
  terms,
  checked,
  onChange,
}: TermsAgreementProps) {
  const allChecked = terms.length > 0 && terms.every(t => checked[t.key])

  const toggleAll = () => {
    const next: Record<string, boolean> = {}
    terms.forEach(t => {
      next[t.key] = !allChecked
    })
    onChange(next)
  }
  const toggleOne = (key: string) =>
    onChange({ ...checked, [key]: !checked[key] })

  // 스펙 체크박스 on 색상은 n-900 (shadcn 기본 #5468CD 오버라이드)
  const boxOn =
    "data-[state=checked]:bg-sz-n-900 data-[state=checked]:border-sz-n-900"

  return (
    <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
      <div className="flex items-center gap-2.5 border-b border-sz-n-200 bg-sz-n-50 px-4 py-3.5">
        <Checkbox
          className={boxOn}
          checked={allChecked}
          onCheckedChange={toggleAll}
        />
        <span
          className="cursor-pointer text-[13px] font-semibold text-sz-n-900"
          onClick={toggleAll}
        >
          이용 약관에 모두 동의합니다.
        </span>
      </div>
      {terms.map(t => (
        <div
          key={t.key}
          className="flex items-center justify-between border-b border-sz-n-100 px-4 py-3 last:border-b-0"
        >
          <div className="flex items-center gap-2.5">
            <Checkbox
              className={boxOn}
              checked={!!checked[t.key]}
              onCheckedChange={() => toggleOne(t.key)}
            />
            <span
              className="cursor-pointer text-[13px] text-sz-n-900"
              onClick={() => toggleOne(t.key)}
            >
              {t.label}
              <span className="ml-1 text-[11px] text-sz-danger-text">
                (필수)
              </span>
            </span>
          </div>
          {t.onView && (
            <button
              type="button"
              onClick={t.onView}
              className="text-[12px] text-sz-n-500 hover:text-sz-n-700"
            >
              보기 ›
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
