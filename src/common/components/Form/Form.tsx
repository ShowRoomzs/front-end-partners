import { useCallback } from "react"
import type { ReactNode } from "react"
import type {
  FieldErrors,
  FieldValues,
  SubmitHandler,
  SubmitErrorHandler,
  UseFormHandleSubmit,
} from "react-hook-form"
import toast from "react-hot-toast"
import { CONTROLLER_ID_PREFIX } from "./FormController"
import { Children, isValidElement } from "react"

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

  const extractFieldNames = useCallback((children: ReactNode): string[] => {
    const names: string[] = []

    const traverse = (node: ReactNode) => {
      if (!node) return

      if (isValidElement(node)) {
        const props = node.props as Record<string, unknown>

        // FormController의 name prop 추출
        if (props.name && typeof props.name === "string") {
          names.push(props.name)
        }

        // children 재귀 탐색
        if (props.children) {
          Children.forEach(props.children as ReactNode, traverse)
        }
      } else if (Array.isArray(node)) {
        node.forEach(traverse)
      }
    }

    traverse(children)
    return names
  }, [])

  const getFirstErrorKey = useCallback(
    (errors: FieldErrors<TFieldValues>): string | null => {
      const fieldNames = extractFieldNames(props.children)

      // 모든 에러 경로를 추출 (nested 포함)
      const collectErrorPaths = (
        obj: Record<string, unknown>,
        prefix = ""
      ): string[] => {
        const paths: string[] = []
        for (const key in obj) {
          const value = obj[key]
          const currentPath = prefix ? `${prefix}.${key}` : key

          if (value && typeof value === "object" && "message" in value) {
            paths.push(currentPath)
          } else if (value && typeof value === "object") {
            paths.push(
              ...collectErrorPaths(
                value as Record<string, unknown>,
                currentPath
              )
            )
          }
        }
        return paths
      }

      const errorPaths = collectErrorPaths(errors as Record<string, unknown>)

      // fieldNames 순서대로 에러 경로 정렬
      const sortedErrors = errorPaths.sort((a, b) => {
        const aBase = a.split(".")[0]
        const bBase = b.split(".")[0]
        return fieldNames.indexOf(aBase) - fieldNames.indexOf(bBase)
      })

      return sortedErrors[0] || null
    },
    [extractFieldNames, props.children]
  )
  /**
   * 기본 적으로 반환되는 errors 필드는 순서를 보장하지 않음
   * 따라서 필드 순서를 보장하기 위해 props.children을 재귀적으로 탐색하여 name을 추출해 필드 순서 보장
   */
  const handleInvalidDefault: SubmitErrorHandler<TFieldValues> = useCallback(
    (errors: FieldErrors<TFieldValues>) => {
      const firstErrorKey = getFirstErrorKey(errors)

      if (!firstErrorKey) return

      // nested 에러 메시지 추출
      const getErrorMessage = (path: string): string | undefined => {
        const keys = path.split(".")
        let current: unknown = errors

        for (const key of keys) {
          if (current && typeof current === "object") {
            current = (current as Record<string, unknown>)[key]
          }
        }

        if (current && typeof current === "object" && "message" in current) {
          return current.message as string
        }
        return undefined
      }

      const errorMessage = getErrorMessage(firstErrorKey)

      if (errorMessage) {
        toast.error(errorMessage)
      }

      const targetController = document.getElementById(
        `${CONTROLLER_ID_PREFIX}${firstErrorKey}`
      )

      if (targetController) {
        targetController.scrollIntoView({ behavior: "smooth", block: "center" })
      }

      onInvalid?.(errors)
    },
    [getFirstErrorKey, onInvalid]
  )

  return (
    <form
      {...restProps}
      onSubmit={handleSubmit(onSubmit, handleInvalidDefault)}
    />
  )
}
