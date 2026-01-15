import {
  confirm,
  type ConfirmOptions,
} from "@/common/components/ConfirmModal/confirm"
import { useEffect } from "react"
import { useBlocker } from "react-router-dom"

interface UseBlockerType {
  condition: boolean // block condition(when true, block)
  confirmOption: ConfirmOptions
}

export const useCustomBlocker = (props: UseBlockerType) => {
  const { condition, confirmOption } = props
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return condition && currentLocation.pathname !== nextLocation.pathname
  })

  useEffect(() => {
    if (blocker.state === "blocked") {
      confirm(confirmOption).then(ok => {
        if (ok) {
          blocker?.proceed?.()
          return
        }
        blocker?.reset?.()
      })
    }
  }, [confirmOption, blocker])
}
