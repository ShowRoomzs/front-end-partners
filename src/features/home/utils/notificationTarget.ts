import type { NotificationItem } from "@/features/home/types"

/**
 * 알림을 누르면 갈 곳 — 목록이 아니라 그 건의 상세(16 rule 「알림 클릭 동작」 ①③).
 * 지워진 대상은 상세 화면이 404를 받아 처리한다(서버가 생존을 확인하지 않는다 — 1017 설계서 1-0 ④).
 * 이동할 화면이 없으면 null(읽음 처리만 한다).
 *
 * 주문 · 클레임은 목록에서 상세 모달을 여는 구조라 아직 id로 바로 열 수 없다 — 해당 목록으로 보낸다.
 */
export function notificationTargetPath(
  target: NotificationItem["target"]
): string | null {
  if (!target?.type) return null
  const { type, id, sub } = target
  switch (type) {
    case "CONTRACT":
      return id ? `/contract/${id}` : "/contract"
    case "GROUP_BUY":
      return id ? `/group-buy/${id}` : "/group-buy"
    case "SETTLEMENT":
    case "ADJUSTMENT":
      // 조정 요청 카드는 정산 상세의 [이슈 스레드]에서 이어진다 — id는 정산 id
      return id ? `/settlement/history/${id}` : "/settlement/history"
    case "THREAD":
      return id ? `/connections?threadId=${id}` : "/connections"
    case "CONNECTION_REQUESTS":
      return "/connections"
    case "PRODUCT":
      return id ? `/product/edit/${id}` : "/product/list"
    case "INQUIRY":
      // 파트너센터에는 상품 문의 화면만 있다
      return sub === "PRODUCT" && id ? `/inquiry/product/${id}` : null
    case "BASIC_INFO_TAB":
      return sub ? `/store/basic?tab=${sub}` : "/store/basic"
    case "ORDER_GROUP":
      return "/sales/orders?tab=ALL"
    case "CLAIM":
      return "/sales/claims?tab=ALL"
    case "ACCOUNT_STATUS":
      return "/connections?operator=1"
    default:
      return null
  }
}
