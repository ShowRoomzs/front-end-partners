import { useCallback, useEffect, useRef } from "react"
import { useBlocker } from "react-router-dom"

interface UseUnsavedLeaveGuardOptions {
  /** true면 경로 이동을 막고 모달을 띄운다 */
  when: boolean
}

/**
 * 작성 이탈 경고(C6).
 *
 * 공용 `useCustomBlocker`는 취소/확인 두 버튼짜리 confirm이라 쓰지 못한다 — C6는
 * [저장 없이 나가기] [임시저장 후 나가기] [계속 작성] 세 갈래다. 같은 경로 안의 쿼리 변화
 * (`?mode=`)는 막지 않고 pathname이 바뀔 때만 막는다. 새로고침·탭 닫기는 브라우저 기본 경고로 막는다.
 */
export function useUnsavedLeaveGuard(options: UseUnsavedLeaveGuardOptions) {
  const { when } = options
  const bypassRef = useRef(false)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      when &&
      !bypassRef.current &&
      currentLocation.pathname !== nextLocation.pathname
    )
  })

  useEffect(() => {
    if (!when) {
      return
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [when])

  const isBlocked = blocker.state === "blocked"

  const proceed = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.proceed()
    }
  }, [blocker])

  const stay = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.reset()
    }
  }, [blocker])

  /** 저장·삭제 직후처럼 이번 이동은 막지 않아야 할 때 */
  const bypassNext = useCallback(() => {
    bypassRef.current = true
  }, [])

  return { isBlocked, proceed, stay, bypassNext }
}
