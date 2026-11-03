import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

/**
 * URL의 `detail=<id>`로 목록 화면의 상세 모달을 연다 — 알림 클릭처럼 밖에서 그 건으로 바로 올 때 쓴다.
 * 읽은 뒤에는 URL에서 지운다(모달을 닫고 새로고침해도 다시 열리지 않게).
 * 같은 화면에 이미 있을 때 알림을 눌러도 열리도록 URL이 바뀔 때마다 본다.
 */
export function useDetailParam(onOpen: (id: number) => void) {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get("detail")

  useEffect(() => {
    if (raw === null) return
    const id = Number(raw)
    if (Number.isInteger(id) && id > 0) onOpen(id)
    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous)
        next.delete("detail")
        return next
      },
      { replace: true }
    )
    // onOpen은 화면마다 새로 만들어진다 — URL 값이 바뀔 때만 연다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, setSearchParams])
}
