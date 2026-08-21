import type { ReactNode } from "react"

interface TableFooterProps {
  renderLeft: ReactNode
  renderRight: ReactNode
  /**
   * 페이지네이션 위치.
   *
   * `between`(기본)은 좌측 합계·우측 페이저 구조를 쓰는 기존 목록용이다.
   * `center`는 시안 `.pager` — 좌측에 아무것도 없는 목록에서 페이저를 가운데 둔다.
   * 좌측이 비었는데 `between`을 쓰면 페이저만 오른쪽 끝에 붙어 표와 따로 노는
   * 덩어리가 된다. 구분선은 마지막 행의 아래 테두리가 이미 그리므로 얹지 않는다.
   */
  align?: "between" | "center"
}

export default function TableFooter(props: TableFooterProps) {
  const { renderLeft, renderRight, align = "between" } = props

  if (align === "center") {
    // 내용이 없으면 빈 상태 아래에 12px 여백만 남으므로 아예 그리지 않는다
    if (!renderLeft && !renderRight) {
      return null
    }

    return (
      <div className="sticky bottom-0 left-0 z-10 flex w-full flex-row items-center justify-center gap-4 rounded-bl-lg rounded-br-lg bg-white p-3">
        {renderLeft}
        {renderRight}
      </div>
    )
  }

  return (
    <div className="sticky bottom-0 left-0 bg-white z-10  px-[15px] pt-[15px] w-full flex flex-row items-center justify-between rounded-bl-lg rounded-br-lg">
      {renderLeft ? renderLeft : <div />}
      {renderRight}
    </div>
  )
}
