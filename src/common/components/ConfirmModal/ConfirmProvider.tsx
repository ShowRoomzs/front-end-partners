import { useState, useCallback, useEffect, type ReactNode } from "react"
import ConfirmModal from "./ConfirmModal"
import { registerConfirmHandler, type ConfirmState } from "./confirm"

const ConfirmProvider = (props: { children: ReactNode }) => {
  const { children } = props

  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    content: "",
    type: "default",
    cancelText: "취소",
    confirmText: "확인",
    resolve: null,
  })

  useEffect(() => {
    registerConfirmHandler(setState)
  }, [])

  const handleCancel = useCallback(() => {
    setState(prev => {
      prev.resolve?.(false)
      return { ...prev, isOpen: false, resolve: null }
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setState(prev => {
      prev.resolve?.(true)
      return { ...prev, isOpen: false, resolve: null }
    })
  }, [])

  return (
    <>
      {children}
      <ConfirmModal
        isOpen={state.isOpen}
        type={state.type}
        title={state.title}
        content={state.content}
        cancelText={state.cancelText}
        confirmText={state.confirmText}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default ConfirmProvider
