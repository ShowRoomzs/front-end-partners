interface ComingSoonPageProps {
  title: string
  description?: string
}

/**
 * 아직 기능이 없는 GNB 항목의 자리표시 화면.
 *
 * 시안 GNB는 9항목이 고정 순서를 갖는데 계약 관리(#4)·공구 관리(#5)는 이 프로젝트에
 * 구현 자체가 없다. 메뉴에서 빼면 뒤 항목들의 번호가 시안과 어긋나므로, 항목은 두되
 * 눌렀을 때 빈 화면 대신 "준비중"임을 알려준다.
 */
export default function ComingSoonPage(props: ComingSoonPageProps) {
  const { title, description } = props

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold text-sz-n-900">{title}</h1>
      </div>

      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center">
        <p className="text-[13px] font-medium text-sz-n-700">
          준비 중인 기능입니다.
        </p>
        {description && (
          <p className="mt-1.5 text-[12px] text-sz-n-500">{description}</p>
        )}
      </div>
    </div>
  )
}
