import type { ReactNode } from "react"

/**
 * 데이터 자리에 두는 가운데 정렬 안내(불러오기 실패 · 찾을 수 없음 · 이용 제한 등).
 * 화면 골격은 그대로 두고 데이터 자리만 이 안내로 바꾼다.
 */
export default function NotReady(props: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const { title, children, action } = props
  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {title}
      </div>
      {children && (
        <div className="text-[12px] leading-[1.6] text-sz-n-500">
          {children}
        </div>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
