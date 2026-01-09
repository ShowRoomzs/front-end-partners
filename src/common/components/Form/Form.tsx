import { useCallback } from "react"
import type {
  FieldErrors,
  FieldValues,
  SubmitHandler,
  SubmitErrorHandler,
  UseFormHandleSubmit,
} from "react-hook-form"
import toast from "react-hot-toast"
import { CONTROLLER_ID_PREFIX } from "./FormController"

interface FormProps<TFieldValues extends FieldValues> extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit" | "onInvalid"
> {
  handleSubmit: UseFormHandleSubmit<TFieldValues>
  onSubmit: SubmitHandler<TFieldValues>
  onInvalid?: SubmitErrorHandler<TFieldValues>
}

export default function Form<TFieldValues extends FieldValues>(
  props: FormProps<TFieldValues>
) {
  const { handleSubmit, onSubmit, onInvalid, ...restProps } = props

  // 기본 onInvalid 핸들러(토스트 및 스크롤 기능 포함)
  const handleInvalidDefault: SubmitErrorHandler<TFieldValues> = useCallback(
    (errors: FieldErrors<TFieldValues>) => {
      const firstErrorKey = Object.keys(errors)[0]
      const firstErrorField = errors[firstErrorKey as keyof TFieldValues]
      const targetController = document.getElementById(
        `${CONTROLLER_ID_PREFIX}${firstErrorKey}`
      )

      const errorMessage = firstErrorField?.message as string | undefined
      if (errorMessage) {
        toast.error(errorMessage)
      }

      if (targetController) {
        targetController.scrollIntoView({ behavior: "smooth", block: "center" })
      }

      onInvalid?.(errors)
    },
    [onInvalid]
  )

  return (
    <form
      {...restProps}
      onSubmit={handleSubmit(onSubmit, handleInvalidDefault)}
    />
  )
}
