import {
  FIXED_FEE_MAX,
  PRICE_UNIT,
  REWARD_RATE_MAX,
  TITLE_MIN_LENGTH,
} from "@/features/contracts/constants/rules"
import type {
  ContractDetailResponse,
  ContractProductOption,
  ContractUpdateRequest,
  ContractViolation,
  FixedFeeTrigger,
  SecondaryUsePeriodType,
} from "@/features/contracts/types"
import {
  fromServerDateTime,
  toServerDateTime,
} from "@/features/contracts/utils/datetime"
import dayjs from "dayjs"

/*
  작성 폼의 값 — 서버 상세(읽기)와 임시저장 요청(쓰기) 사이의 편집용 형태.
  react-hook-form을 쓰지 않는 이유: 항목 배열의 파생값(정가·예상 리워드), 「상품을 바꾸면
  그 행이 초기화된다」 규칙, 섹션 단위 변경 비교(C6 문구)가 전부 값 계산이라 리듀서가 더 곧다.
*/

export interface ContractItemValues {
  /** React key — 서버 ID가 없는 새 행도 안정적으로 식별한다 */
  clientKey: string
  contractItemId: number | null
  productId: number | null
  groupBuyPrice: number | null
  rewardRate: number | null
  minQuantity: number | null
}

export interface ContractFormValues {
  creatorId: number | null
  title: string
  /** 로컬 ISO 문자열 — 전송 직전에만 UTC 벽시계로 바꾼다 */
  groupBuyStartAt: string | null
  groupBuyEndAt: string | null
  items: Array<ContractItemValues>
  fixedFeeAmount: number | null
  fixedFeeTrigger: FixedFeeTrigger | null
  fixedFeeNoticeAgreed: boolean
  contentFeedCount: number | null
  contentReelsCount: number | null
  contentStoryCount: number | null
  /** yyyy-MM-dd */
  contentDueDate: string | null
  secondaryUseAllowed: boolean
  secondaryUsePeriodType: SecondaryUsePeriodType
  secondaryUseMonths: number | null
  brandPreReview: boolean
  note: string
}

let clientKeySeq = 0
export function nextClientKey(): string {
  clientKeySeq += 1
  return `row-${Date.now()}-${clientKeySeq}`
}

export function emptyItem(): ContractItemValues {
  return {
    clientKey: nextClientKey(),
    contractItemId: null,
    productId: null,
    groupBuyPrice: null,
    rewardRate: null,
    minQuantity: null,
  }
}

/** 서버 상세 → 폼 값. 빈 초안은 시안 기본값(2차 활용 허용·기간 지정 12개월·사전 검수 없음·행 1개) */
export function fromDetail(detail: ContractDetailResponse): ContractFormValues {
  const { counterparty, period, items, fixedFee, content } = detail

  return {
    creatorId: counterparty.creatorId,
    title: detail.title ?? "",
    groupBuyStartAt: fromServerDateTime(period.startAt)?.format() ?? null,
    groupBuyEndAt: fromServerDateTime(period.endAt)?.format() ?? null,
    items:
      items.length > 0
        ? items.map(item => ({
            clientKey: nextClientKey(),
            contractItemId: item.contractItemId,
            productId: item.productId,
            groupBuyPrice: item.groupBuyPrice,
            rewardRate: item.rewardRate,
            minQuantity: item.minQuantity,
          }))
        : [emptyItem()],
    // 시안 B1 — 새 초안은 고정 지급비 0원 · 지급 시점 「공구 게시물 등록 후」가 기본 선택이다
    fixedFeeAmount: fixedFee.amount ?? 0,
    fixedFeeTrigger: fixedFee.trigger ?? "POST_REGISTERED",
    fixedFeeNoticeAgreed: fixedFee.noticeAgreedAt !== null,
    contentFeedCount: content.feedCount,
    contentReelsCount: content.reelsCount,
    contentStoryCount: content.storyCount,
    contentDueDate: content.dueDate,
    secondaryUseAllowed: content.secondaryUseAllowed ?? true,
    secondaryUsePeriodType: content.secondaryUsePeriodType ?? "FIXED",
    // 시안 B1 — 개월 칸은 비워 두고 12를 자리표시로만 보여준다
    secondaryUseMonths: content.secondaryUseMonths,
    brandPreReview: content.brandPreReview ?? false,
    note: content.note ?? "",
  }
}

/** 폼 값 → 임시저장 요청(전체 교체). 항목 순서가 곧 `sortOrder`다 */
export function toUpdateRequest(
  values: ContractFormValues,
  version: number
): ContractUpdateRequest {
  const useMonths =
    values.secondaryUseAllowed && values.secondaryUsePeriodType === "FIXED"

  return {
    version,
    creatorId: values.creatorId,
    title: values.title.trim() === "" ? null : values.title.trim(),
    groupBuyStartAt: values.groupBuyStartAt
      ? toServerDateTime(dayjs(values.groupBuyStartAt))
      : null,
    groupBuyEndAt: values.groupBuyEndAt
      ? toServerDateTime(dayjs(values.groupBuyEndAt))
      : null,
    fixedFeeAmount: values.fixedFeeAmount,
    fixedFeeTrigger: values.fixedFeeTrigger,
    fixedFeeNoticeAgreed: values.fixedFeeNoticeAgreed,
    contentFeedCount: values.contentFeedCount,
    contentReelsCount: values.contentReelsCount,
    contentStoryCount: values.contentStoryCount,
    contentDueDate: values.contentDueDate,
    secondaryUseAllowed: values.secondaryUseAllowed,
    secondaryUsePeriodType: values.secondaryUseAllowed
      ? values.secondaryUsePeriodType
      : null,
    secondaryUseMonths: useMonths ? values.secondaryUseMonths : null,
    brandPreReview: values.brandPreReview,
    note: values.note.trim() === "" ? null : values.note,
    // 상품을 고르지 않은 빈 행은 보내지 않는다 — 저장 후 되돌아오면 빈 행이 하나 다시 생긴다
    items: values.items
      .filter(item => item.productId !== null)
      .map(item => ({
        contractItemId: item.contractItemId,
        productId: item.productId,
        groupBuyPrice: item.groupBuyPrice,
        rewardRate: item.rewardRate,
        minQuantity: item.minQuantity,
      })),
  }
}

export function findProduct(
  products: Array<ContractProductOption>,
  productId: number | null
): ContractProductOption | undefined {
  return productId === null
    ? undefined
    : products.find(product => product.productId === productId)
}

/**
 * 필수 미입력 판정(§25-6 절대 규칙) — 에러 문구 없이 [검토 요청]만 비활성한다.
 * 서버 REQUIRED 위반 목록(H6·H7·H8·*_REQUIRED)과 같은 항목이다.
 */
export function isRequiredSatisfied(values: ContractFormValues): boolean {
  const contentTotal =
    (values.contentFeedCount ?? 0) +
    (values.contentReelsCount ?? 0) +
    (values.contentStoryCount ?? 0)

  const hasCompleteItem = values.items.some(
    item =>
      item.productId !== null &&
      item.groupBuyPrice !== null &&
      item.rewardRate !== null
  )

  const feeNoticeOk =
    values.fixedFeeAmount === null ||
    values.fixedFeeAmount === 0 ||
    values.fixedFeeNoticeAgreed

  const monthsOk =
    !values.secondaryUseAllowed ||
    values.secondaryUsePeriodType === "UNLIMITED" ||
    (values.secondaryUseMonths !== null && values.secondaryUseMonths > 0)

  return (
    values.creatorId !== null &&
    values.title.trim() !== "" &&
    values.groupBuyStartAt !== null &&
    values.groupBuyEndAt !== null &&
    hasCompleteItem &&
    contentTotal >= 1 &&
    values.contentDueDate !== null &&
    values.fixedFeeAmount !== null &&
    values.fixedFeeTrigger !== null &&
    feeNoticeOk &&
    monthsOk
  )
}

/** 규칙 위반 문구 — 필드별. 항목은 clientKey로 찾는다 */
export interface RuleErrors {
  title?: string
  fixedFeeAmount?: string
  groupBuyPeriod?: string
  items: Record<string, { groupBuyPrice?: string; rewardRate?: string }>
}

export const EMPTY_RULE_ERRORS: RuleErrors = { items: {} }

/**
 * 직접 입력 필드의 규칙 위반(H1·H2·공구명 길이·고정 지급비 상한). 기간(H4·H5)은 달력이 애초에
 * 막아 여기 오지 않고, 리워드율 범위(H3)는 입력 단계에서 클램프된다.
 */
export function computeRuleErrors(
  values: ContractFormValues,
  products: Array<ContractProductOption>
): RuleErrors {
  const errors: RuleErrors = { items: {} }

  const title = values.title.trim()
  if (title !== "" && title.length < TITLE_MIN_LENGTH) {
    errors.title = `공구명은 ${TITLE_MIN_LENGTH}~40자로 입력해 주세요.`
  }

  if (values.fixedFeeAmount !== null && values.fixedFeeAmount > FIXED_FEE_MAX) {
    errors.fixedFeeAmount = "고정 지급비는 1,000만원 이하로 입력해 주세요."
  }

  values.items.forEach(item => {
    const product = findProduct(products, item.productId)
    if (!product || item.groupBuyPrice === null) {
      return
    }
    if (item.groupBuyPrice > product.regularPrice) {
      errors.items[item.clientKey] = {
        groupBuyPrice: `공구가는 정가(${product.regularPrice.toLocaleString("ko-KR")}원)보다 높을 수 없습니다.`,
      }
    } else if (item.groupBuyPrice % PRICE_UNIT !== 0) {
      errors.items[item.clientKey] = {
        groupBuyPrice: "공구가는 10원 단위로 입력해 주세요.",
      }
    }
    if (item.rewardRate !== null && item.rewardRate > REWARD_RATE_MAX) {
      errors.items[item.clientKey] = {
        ...errors.items[item.clientKey],
        rewardRate: "리워드율은 0~90% 사이여야 합니다.",
      }
    }
  })

  return errors
}

export function hasRuleErrors(errors: RuleErrors): boolean {
  return (
    !!errors.title ||
    !!errors.fixedFeeAmount ||
    !!errors.groupBuyPeriod ||
    Object.keys(errors.items).length > 0
  )
}

/**
 * 서버 하드 위반 → 폼 에러. RULE만 문구가 되고 REQUIRED는 버리지 않고 false 판정만 남긴다
 * (호출부가 canSubmit으로 버튼을 가린다). 항목 경로 `items[0].groupBuyPrice`는 index로 행을 찾는다.
 */
export function violationsToRuleErrors(
  violations: Array<ContractViolation>,
  values: ContractFormValues
): RuleErrors {
  const errors: RuleErrors = { items: {} }
  // 전송 시 상품 미선택 행을 걸러 보냈으므로 서버 index는 "상품이 있는 행" 기준이다
  const sentItems = values.items.filter(item => item.productId !== null)

  violations
    .filter(violation => violation.kind === "RULE")
    .forEach(violation => {
      const field = violation.field ?? ""
      const itemMatch = /^items\[(\d+)\]\.(\w+)$/.exec(field)
      if (itemMatch) {
        const row = sentItems[Number(itemMatch[1])]
        if (!row) {
          return
        }
        const key =
          itemMatch[2] === "rewardRate" ? "rewardRate" : "groupBuyPrice"
        errors.items[row.clientKey] = {
          ...errors.items[row.clientKey],
          [key]: violation.message,
        }
        return
      }
      if (field === "title") {
        errors.title = violation.message
      } else if (field === "fixedFeeAmount") {
        errors.fixedFeeAmount = violation.message
      } else if (field.startsWith("groupBuy")) {
        errors.groupBuyPeriod = violation.message
      }
    })

  return errors
}

/** C6 문구용 — 마지막 임시저장 이후 바뀐 섹션 이름 */
export function diffSections(
  saved: ContractFormValues,
  current: ContractFormValues
): Array<string> {
  const sections: Array<string> = []

  if (saved.creatorId !== current.creatorId) {
    sections.push("계약 상대")
  }
  if (saved.title !== current.title) {
    sections.push("공구명")
  }
  if (
    saved.groupBuyStartAt !== current.groupBuyStartAt ||
    saved.groupBuyEndAt !== current.groupBuyEndAt
  ) {
    sections.push("공구 기간")
  }
  const itemsChanged =
    saved.items.length !== current.items.length ||
    saved.items.some((item, index) => {
      const other = current.items[index]
      return (
        !other ||
        item.productId !== other.productId ||
        item.groupBuyPrice !== other.groupBuyPrice ||
        item.rewardRate !== other.rewardRate ||
        item.minQuantity !== other.minQuantity
      )
    })
  if (itemsChanged) {
    sections.push(`상품 항목 ${current.items.length}건`)
  }
  if (
    saved.fixedFeeAmount !== current.fixedFeeAmount ||
    saved.fixedFeeTrigger !== current.fixedFeeTrigger ||
    saved.fixedFeeNoticeAgreed !== current.fixedFeeNoticeAgreed
  ) {
    sections.push("고정 지급비")
  }
  if (
    saved.contentFeedCount !== current.contentFeedCount ||
    saved.contentReelsCount !== current.contentReelsCount ||
    saved.contentStoryCount !== current.contentStoryCount ||
    saved.contentDueDate !== current.contentDueDate ||
    saved.secondaryUseAllowed !== current.secondaryUseAllowed ||
    saved.secondaryUsePeriodType !== current.secondaryUsePeriodType ||
    saved.secondaryUseMonths !== current.secondaryUseMonths ||
    saved.brandPreReview !== current.brandPreReview
  ) {
    sections.push("콘텐츠 의무")
  }
  if (saved.note !== current.note) {
    sections.push("비고")
  }

  return sections
}
