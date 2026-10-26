import type { GuideStepKey } from "@/features/home/types"

/*
  첫 공구 가이드(H3 · H3a) 문구 — 단계 판정은 서버(`guide.steps`), 문구는 FE(1017 설계서 4-1).
  시안에는 2단계(상품 등록)와 4단계(계약 · 서명) 카드만 있다. 3 · 5 · 6단계 카드 문구는 시안 틀에 맞춰 새로 썼다.
*/

export const GUIDE_STEP_ORDER: Array<GuideStepKey> = [
  "BRAND_INFO",
  "PRODUCT",
  "CONNECTION",
  "CONTRACT",
  "OPEN",
  "ORDERS",
]

export const GUIDE_STEP_LABEL: Record<GuideStepKey, string> = {
  BRAND_INFO: "브랜드 정보",
  PRODUCT: "상품 등록",
  CONNECTION: "인플루언서 연결",
  CONTRACT: "계약 · 서명",
  OPEN: "공구 오픈",
  ORDERS: "주문 처리 · 정산",
}

export type GuideAction =
  | "PRODUCT_REGISTER"
  | "CONNECTIONS"
  | "CONTRACT_CREATE"
  | "GROUP_BUYS"
  | "ORDERS"
  | "BASIC_INFO"

export interface GuideCard {
  title: string
  /** `{creator}`는 가장 최근 연결된 쇼룸 이름으로 바꾼다(굵게) */
  description: string
  next: Array<string>
  primary: { label: string; action: GuideAction }
  /** 연결된 화면이 아직 없는 보조 버튼 — 비활성으로 둔다 */
  secondaryLabel?: string
}

export const GUIDE_CARDS: Record<GuideStepKey, GuideCard> = {
  BRAND_INFO: {
    title: "브랜드 정보를 확인하세요",
    description:
      "사업자 정보 · 배송·반품 정책 · 정산 계좌를 확인해 주세요. 공구 주문과 정산에 그대로 쓰입니다.",
    next: ["확인이 끝나면 공구에 올릴 상품을 등록합니다"],
    primary: { label: "기본정보 관리", action: "BASIC_INFO" },
  },
  PRODUCT: {
    title: "공구에 올릴 상품을 등록하세요",
    description:
      "상품명 · 가격 · 옵션 · 상세 이미지를 입력하고 저장하면 운영팀 검토가 시작됩니다. 검토를 통과해 **진열**된 상품만 계약에 넣을 수 있습니다.",
    next: [
      "운영팀이 상품 정보를 검토합니다 [근거 대기 · 검토 SLA]",
      "통과하면 진열 상태가 되고 홈 알림으로 알려 드립니다",
      "반려되면 사유를 확인해 수정 후 다시 요청할 수 있습니다",
    ],
    primary: { label: "상품 등록", action: "PRODUCT_REGISTER" },
    secondaryLabel: "상품 등록 기준 보기",
  },
  CONNECTION: {
    title: "공구를 함께할 인플루언서와 연결하세요",
    description:
      "연결·소통에서 쇼룸명이나 연결코드로 연결을 요청하세요. 인플루언서가 수락하면 계약을 작성할 수 있습니다.",
    next: [
      "인플루언서가 연결 요청을 확인합니다",
      "수락하면 소통 스레드가 열리고 홈 알림으로 알려 드립니다",
    ],
    primary: { label: "연결·소통으로 이동", action: "CONNECTIONS" },
  },
  CONTRACT: {
    title: "연결된 인플루언서와 계약을 작성하세요",
    description:
      "{creator}와 연결되었습니다. 공구 기간 · 상품 · 공구가 · 리워드율 · 콘텐츠 의무를 입력하고 검토를 요청하세요.",
    next: [
      "운영팀이 계약 내용을 검토합니다",
      "통과하면 모두싸인이 브랜드·인플루언서에게 서명 안내를 메일·문자로 보냅니다",
      "양측이 서명하면 운영팀이 체결 완료 처리하고 공구가 만들어집니다",
    ],
    primary: { label: "계약 작성", action: "CONTRACT_CREATE" },
    secondaryLabel: "계약 작성 가이드",
  },
  OPEN: {
    title: "공구 오픈을 준비하세요",
    description:
      "계약이 체결되어 공구가 만들어졌습니다. 최소 준비 물량을 확인하고, 인플루언서의 게시물이 승인되면 오픈일에 공구가 열립니다.",
    next: [
      "인플루언서가 공구 게시물을 작성합니다",
      "운영팀이 게시물을 승인하면 오픈일에 판매가 시작됩니다",
    ],
    primary: { label: "공구 관리로 이동", action: "GROUP_BUYS" },
  },
  ORDERS: {
    title: "주문을 처리하세요",
    description:
      "공구가 열리면 주문이 들어옵니다. 발송 기한 안에 송장을 등록하고, 공구가 끝나면 정산을 확인하세요.",
    next: ["주문이 모두 끝나면 3영업일 확인 기간 뒤 정산이 자동 확정됩니다"],
    primary: { label: "판매 관리로 이동", action: "ORDERS" },
  },
}

/** 오른쪽 「미리 알아두면 좋은 것」 — 시안 H3 · H3a 그대로 */
export const GUIDE_TIPS = {
  heading: "미리 알아두면 좋은 것",
  shippingTitle: "발송 기한",
  shippingText: "공구 마감 후 설정한 영업일 안에 송장을 등록해야 합니다.",
  shippingLink: "배송·반품 정책 ›",
  settlementTitle: "정산",
  settlementText:
    "주문이 모두 끝나면 3영업일 확인 기간 뒤 자동 확정되고 지급됩니다. 수수료는 베타 기간 0%입니다.",
  claimTitle: "반품·교환",
  claimText: "소비자 신청은 자동 접수되고, 브랜드는 회수 후 검수만 합니다.",
  askText: "막히는 단계가 있으면 운영팀 채널로 문의해 주세요.",
  askButton: "운영팀에 문의하기",
} as const
