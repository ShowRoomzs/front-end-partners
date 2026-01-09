import type { ConfirmType } from "./ConfirmModal"

export interface ConfirmOptions {
  title: string
  content: string
  type?: ConfirmType
  cancelText?: string
  confirmText?: string
}

export interface ConfirmState extends Required<ConfirmOptions> {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

export let setConfirmState: ((state: ConfirmState) => void) | null = null

export const registerConfirmHandler = (
  handler: (state: ConfirmState) => void
) => {
  setConfirmState = handler
}

export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise(resolve => {
    if (!setConfirmState) {
      console.error("ConfirmProvider not found")
      resolve(false)
      return
    }

    setConfirmState({
      isOpen: true,
      title: options.title,
      content: options.content,
      type: options.type ?? "default",
      cancelText: options.cancelText ?? "취소",
      confirmText: options.confirmText ?? "확인",
      resolve,
    })
  })
}
