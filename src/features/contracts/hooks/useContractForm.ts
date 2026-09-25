import type {
  ContractDetailResponse,
  ContractProductOption,
  ContractViolation,
} from "@/features/contracts/types"
import {
  computeRuleErrors,
  diffSections,
  EMPTY_RULE_ERRORS,
  emptyItem,
  fromDetail,
  hasRuleErrors,
  isRequiredSatisfied,
  violationsToRuleErrors,
  type ContractFormValues,
  type ContractItemValues,
  type RuleErrors,
} from "@/features/contracts/utils/contractForm"
import { endBounds } from "@/features/contracts/utils/datetime"
import dayjs from "dayjs"
import equal from "fast-deep-equal"
import { useCallback, useMemo, useReducer } from "react"

interface FormState {
  values: ContractFormValues
  /** 마지막 임시저장(또는 최초 로드) 시점의 값 — dirty 판정·C6 문구의 기준 */
  saved: ContractFormValues
  version: number
  /** 서버가 돌려준 규칙 위반 — 해당 필드를 고치면 지워진다 */
  serverErrors: RuleErrors
}

type FormAction =
  | { type: "set"; patch: Partial<ContractFormValues> }
  | { type: "setItem"; clientKey: string; patch: Partial<ContractItemValues> }
  | { type: "changeProduct"; clientKey: string; productId: number | null }
  | { type: "addItem" }
  | { type: "removeItem"; clientKey: string }
  | { type: "setPeriod"; startAt: string | null; endAt: string | null }
  | { type: "hydrate"; detail: ContractDetailResponse }
  | { type: "applyViolations"; violations: Array<ContractViolation> }
  | { type: "clearServerErrors" }

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set":
      return { ...state, values: { ...state.values, ...action.patch } }

    case "setItem":
      return {
        ...state,
        values: {
          ...state.values,
          items: state.values.items.map(item =>
            item.clientKey === action.clientKey
              ? { ...item, ...action.patch }
              : item
          ),
        },
        // 서버 지적을 받은 칸을 고치면 그 지적은 낡은 것이다
        serverErrors: {
          ...state.serverErrors,
          items: Object.fromEntries(
            Object.entries(state.serverErrors.items).filter(
              ([key]) => key !== action.clientKey
            )
          ),
        },
      }

    case "changeProduct":
      // 상품을 바꾼 행은 공구가·리워드율·최소 물량이 초기화된다(§25-5-3) — 서버도 같은 규칙을 집행한다
      return {
        ...state,
        values: {
          ...state.values,
          items: state.values.items.map(item =>
            item.clientKey === action.clientKey
              ? {
                  ...item,
                  productId: action.productId,
                  groupBuyPrice: null,
                  rewardRate: null,
                  minQuantity: null,
                }
              : item
          ),
        },
      }

    case "addItem":
      return {
        ...state,
        values: {
          ...state.values,
          items: [...state.values.items, emptyItem()],
        },
      }

    case "removeItem":
      // 최소 1건 — 마지막 행은 지우지 않는다(버튼도 비활성이다)
      if (state.values.items.length < 2) {
        return state
      }
      return {
        ...state,
        values: {
          ...state.values,
          items: state.values.items.filter(
            item => item.clientKey !== action.clientKey
          ),
        },
      }

    case "setPeriod": {
      const { startAt } = action
      let { endAt } = action
      // 시작이 바뀌어 종료가 새 범위 밖으로 나가면 종료를 비운다 — 잠긴 날짜가 값으로 남으면 안 된다
      if (startAt && endAt) {
        const bounds = endBounds(dayjs(startAt))
        const end = dayjs(endAt).startOf("day")
        if (end.isBefore(bounds.min) || end.isAfter(bounds.max)) {
          endAt = null
        }
      }
      // 게시 완료 기한 기본값은 공구 종료일 — 비어 있거나 이전 종료일과 같으면 따라간다
      const previousEndDate = state.values.groupBuyEndAt
        ? dayjs(state.values.groupBuyEndAt).format("YYYY-MM-DD")
        : null
      const followsEnd =
        state.values.contentDueDate === null ||
        state.values.contentDueDate === previousEndDate
      const contentDueDate =
        followsEnd && endAt
          ? dayjs(endAt).format("YYYY-MM-DD")
          : state.values.contentDueDate

      return {
        ...state,
        values: {
          ...state.values,
          groupBuyStartAt: startAt,
          groupBuyEndAt: endAt,
          contentDueDate,
        },
        serverErrors: { ...state.serverErrors, groupBuyPeriod: undefined },
      }
    }

    case "hydrate": {
      const values = fromDetail(action.detail)
      return {
        values,
        saved: values,
        version: action.detail.version,
        serverErrors: EMPTY_RULE_ERRORS,
      }
    }

    case "applyViolations":
      return {
        ...state,
        serverErrors: violationsToRuleErrors(action.violations, state.values),
      }

    case "clearServerErrors":
      return { ...state, serverErrors: EMPTY_RULE_ERRORS }
  }
}

function mergeErrors(local: RuleErrors, server: RuleErrors): RuleErrors {
  const items: RuleErrors["items"] = { ...local.items }
  Object.entries(server.items).forEach(([key, value]) => {
    items[key] = { ...items[key], ...value }
  })
  return {
    title: local.title ?? server.title,
    fixedFeeAmount: local.fixedFeeAmount ?? server.fixedFeeAmount,
    groupBuyPeriod: local.groupBuyPeriod ?? server.groupBuyPeriod,
    items,
  }
}

/**
 * 계약 작성 폼 상태(B1~B3·B2a·B3d 편집).
 *
 * 값·저장 스냅샷·버전·서버 지적을 한 리듀서에 두고, 파생값(규칙 위반·필수 충족·변경 여부)은
 * 렌더마다 계산한다. 규칙 판정의 원본은 서버(`/validate`)이고 여기 판정은 즉시 피드백이다.
 */
export function useContractForm(
  initialDetail: ContractDetailResponse,
  products: Array<ContractProductOption>
) {
  const [state, dispatch] = useReducer(reducer, initialDetail, detail => {
    const values = fromDetail(detail)
    return {
      values,
      saved: values,
      version: detail.version,
      serverErrors: EMPTY_RULE_ERRORS,
    }
  })

  const localErrors = useMemo(
    () => computeRuleErrors(state.values, products),
    [state.values, products]
  )
  const errors = useMemo(
    () => mergeErrors(localErrors, state.serverErrors),
    [localErrors, state.serverErrors]
  )
  const requiredOk = useMemo(
    () => isRequiredSatisfied(state.values),
    [state.values]
  )
  const isDirty = useMemo(
    () => !equal(state.values, state.saved),
    [state.values, state.saved]
  )
  const changedSections = useMemo(
    () => diffSections(state.saved, state.values),
    [state.saved, state.values]
  )

  const set = useCallback(
    (patch: Partial<ContractFormValues>) => dispatch({ type: "set", patch }),
    []
  )
  const setItem = useCallback(
    (clientKey: string, patch: Partial<ContractItemValues>) =>
      dispatch({ type: "setItem", clientKey, patch }),
    []
  )
  const changeProduct = useCallback(
    (clientKey: string, productId: number | null) =>
      dispatch({ type: "changeProduct", clientKey, productId }),
    []
  )
  const addItem = useCallback(() => dispatch({ type: "addItem" }), [])
  const removeItem = useCallback(
    (clientKey: string) => dispatch({ type: "removeItem", clientKey }),
    []
  )
  const setPeriod = useCallback(
    (startAt: string | null, endAt: string | null) =>
      dispatch({ type: "setPeriod", startAt, endAt }),
    []
  )
  const hydrate = useCallback(
    (detail: ContractDetailResponse) => dispatch({ type: "hydrate", detail }),
    []
  )
  const applyViolations = useCallback(
    (violations: Array<ContractViolation>) =>
      dispatch({ type: "applyViolations", violations }),
    []
  )
  const clearServerErrors = useCallback(
    () => dispatch({ type: "clearServerErrors" }),
    []
  )

  return {
    values: state.values,
    version: state.version,
    errors,
    hasErrors: hasRuleErrors(errors),
    requiredOk,
    isDirty,
    changedSections,
    set,
    setItem,
    changeProduct,
    addItem,
    removeItem,
    setPeriod,
    hydrate,
    applyViolations,
    clearServerErrors,
  }
}

export type ContractFormApi = ReturnType<typeof useContractForm>
