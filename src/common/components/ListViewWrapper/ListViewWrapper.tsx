import type { ReactNode } from "react"

interface ListViewWrapperProps {
  children: ReactNode
}

/**
 * 목록 화면 감싸개 — 세로 스크롤은 셸 본문(`main`) 하나만 한다.
 *
 * ⚠️ 여기서 높이를 잠그면(h-full · overflow-hidden) 안 된다. 셸 본문에는 이 감싸개 위에
 * 제목(H1)·정지 배너가 더 있어서 h-full이면 그만큼 본문이 넘쳐 바깥 스크롤바가 생기고,
 * 표는 표대로 안에서 스크롤해 세로 스크롤바가 두 개가 된다(11-24 사용자 지적).
 * shrink-0 — 본문이 세로 flex라 줄어들면 표가 눌려 잘린다. 콘텐츠 높이 그대로 둔다.
 */
export default function ListViewWrapper(props: ListViewWrapperProps) {
  const { children } = props

  return <div className="flex shrink-0 flex-col">{children}</div>
}
