/*
  처리 대기 숫자 → 진입 화면(백엔드 `SellerHomeControllerDocs` 「처리 대기 숫자 → 진입」 표).
  숫자를 누르면 그 메뉴의 탭 · 필터가 걸린 채로 간다 — 묶음이 곧 이동 경로다(16 rule).
*/

export const HOME_LINKS = {
  orders: "/sales/orders",
  prepareStart: "/sales/orders?tab=NEW",
  invoiceRegister: "/sales/orders?tab=PREPARING",
  cancelRequests: "/sales/orders?tab=CANCEL_REQUESTED",
  deliveryIssue: "/sales/orders?tab=SHIPPING",
  claims: "/sales/claims",
  collectWait: "/sales/claims?tab=COLLECT_WAIT",
  inspection: "/sales/claims?tab=INSPECTION",
  reship: "/sales/claims?tab=RESHIP",
  inquiries: "/inquiry/product",
  unansweredInquiries: "/inquiry/product?status=WAITING",
  contracts: "/contract",
  mySignatureNeeded: "/contract?tab=SIGNING",
  reviewRejected: "/contract?tab=REVIEW",
  settlements: "/settlement/history",
  /** 조정 협의는 연결·소통의 이슈 스레드에서 한다 */
  adjustmentMyTurn: "/connections",
  groupBuys: "/group-buy",
  connections: "/connections",
  operatorChannel: "/connections?operator=1",
  productRegister: "/product/register",
  shippingPolicy: "/store/basic?tab=shipping",
} as const

export const contractDetailPath = (contractId: number) =>
  `/contract/${contractId}`
export const groupBuyDetailPath = (groupBuyId: number) =>
  `/group-buy/${groupBuyId}`
export const productEditPath = (productId: number) =>
  `/product/edit/${productId}`
