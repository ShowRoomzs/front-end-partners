import type { RegisterOptions, FieldValues } from 'react-hook-form'

type ValidateFn = (value: unknown, formValues: unknown) => unknown

/**
 * validation 함수를 debounce하고 Promise를 반환하도록 변환
 */
const createDebouncedValidateFn = (
  validateFn: ValidateFn,
  delay: number
): ValidateFn => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let latestResolve: ((value: unknown) => void) | null = null

  return (value: unknown, formValues: unknown) => {
    return new Promise(resolve => {
      // 이전 타이머 취소
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // 이전 Promise를 거부하지 않고, 새 Promise로 대체
      latestResolve = resolve

      // 새로운 타이머 시작
      timeoutId = setTimeout(() => {
        const result = validateFn(value, formValues)
        if (latestResolve === resolve) {
          resolve(result)
        }
      }, delay)
    })
  }
}

/**
 * validation 규칙에 debounce를 적용하는 헬퍼 함수
 * @param rules - react-hook-form의 RegisterOptions
 * @param delay - debounce 지연 시간 (ms)
 * @returns debounce가 적용된 RegisterOptions
 */
export const createDebouncedValidation = <T extends FieldValues>(
  rules: RegisterOptions<T>,
  delay: number = 300
): RegisterOptions<T> => {
  const debouncedRules = { ...rules }

  // validate가 함수인 경우
  if (typeof rules.validate === 'function') {
    debouncedRules.validate = createDebouncedValidateFn(
      rules.validate as ValidateFn,
      delay
    ) as typeof rules.validate
  }
  // validate가 객체인 경우 (여러 validation이 있는 경우)
  else if (typeof rules.validate === 'object' && rules.validate !== null) {
    const debouncedValidate: Record<string, ValidateFn> = {}

    Object.entries(rules.validate).forEach(([key, validateFn]) => {
      if (typeof validateFn === 'function') {
        debouncedValidate[key] = createDebouncedValidateFn(
          validateFn as ValidateFn,
          delay
        )
      } else {
        debouncedValidate[key] = validateFn as ValidateFn
      }
    })

    debouncedRules.validate = debouncedValidate as typeof rules.validate
  }

  return debouncedRules
}
