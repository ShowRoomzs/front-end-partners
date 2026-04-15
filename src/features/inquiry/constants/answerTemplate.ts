export const ANSWER_TEMPLATE_CATEGORY = {
  PRODUCT: "상품",
  SIZE: "사이즈",
  STOCK: "재고/재입고",
  DELIVERY: "배송",
  ORDER_PAYMENT: "주문/결제",
  CANCEL_REFUND_EXCHANGE: "취소/교환/환불",
  DEFECT_AS: "불량/AS",
} as const

export type AnswerTemplateCategory = keyof typeof ANSWER_TEMPLATE_CATEGORY
export type AnswerTemplateCategoryFilter = AnswerTemplateCategory | null

export const ANSWER_TEMPLATE_INCLUDE_INACTIVE = {
  false: "사용중 템플릿만",
  true: "미사용 템플릿 포함",
} as const

export type IncludeInactiveOption = keyof typeof ANSWER_TEMPLATE_INCLUDE_INACTIVE

export const ANSWER_TEMPLATE_IS_ACTIVE = {
  true: "사용",
  false: "미사용",
} as const

export const ANSWER_TEMPLATE_COMMON_PHRASES = [
  "안녕하세요, 고객님.",
  "먼저 불편을 드려 죄송합니다.",
  "고객님의 소중한 의견 감사드립니다.",
  "추가로 문의사항이 있으시면 언제든지 연락 주세요.",
  "감사합니다.",
] as const
