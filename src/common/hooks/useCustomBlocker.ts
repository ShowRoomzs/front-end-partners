import {
  confirm,
  type ConfirmOptions,
} from "@/common/components/ConfirmModal/confirm"
import { useEffect } from "react"
import { useBlocker } from "react-router-dom"
import type { MutableRefObject } from "react"

interface UseBlockerType {
  condition: boolean // block condition(when true, block)
  confirmOption: ConfirmOptions
  bypassRef?: MutableRefObject<boolean>
}

export const useCustomBlocker = (props: UseBlockerType) => {
  const { condition, confirmOption, bypassRef } = props
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      condition &&
      !bypassRef?.current &&
      currentLocation.pathname !== nextLocation.pathname
    )
  })

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (bypassRef?.current) {
        blocker?.proceed?.()
        return
      }

      confirm(confirmOption).then(ok => {
        if (ok) {
          blocker?.proceed?.()
          return
        }
        blocker?.reset?.()
      })
    }
  }, [bypassRef, confirmOption, blocker])
}
