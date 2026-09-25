import type { ContractValidationErrorBody } from "@/features/contracts/types"
import axios, { type AxiosError } from "axios"

interface ErrorBody {
  code?: string
  message?: string
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return undefined
  }
  return error.response?.data?.code
}

export function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return undefined
  }
  return error.response?.data?.message
}

/** 검토 요청 400 — 바디에 `hardViolations[]`가 실린 유일한 에러 */
export function isContractValidationError(
  error: unknown
): error is AxiosError<ContractValidationErrorBody> {
  return getApiErrorCode(error) === "CONTRACT_VALIDATION_FAILED"
}
