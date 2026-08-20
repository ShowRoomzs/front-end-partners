import type { MenuConfig } from "@/common/types/menu"

/**
 * 시안 GNB — 번호 매겨진 flat 9항목이다. 아코디언(그룹 + 펼침 하위메뉴)을 쓰지 않는다.
 *
 * 하위 화면이 여러 개인 메뉴(판매·정산·문의)도 여기서는 항목 하나로 두고, 누르면
 * 대표 화면으로 바로 이동한다(`path`). 그 안의 나머지 화면들은 GNB가 아니라 각 화면
 * 안의 SubNav가 담당한다 — 기본정보 관리·상품 관리·연결·소통이 이미 쓰는 방식이다.
 * 아직 그 SubNav들이 없으므로 지금은 대표 화면 하나로만 진입한다.
 *
 * `matchPaths`는 "누르면 갈 곳"과 "활성으로 칠할 범위"를 분리한다 — 예를 들어 판매 관리는
 * 전체 주문 내역으로 이동하지만 `/sales/*` 어디에 있든 활성이어야 한다.
 *
 * 번호는 Sidebar가 배열 순서로 매기므로(`index + 1`) 이 배열의 순서가 곧 시안의 #1~#9다.
 */
export const SELLER_MENU: MenuConfig = {
  menuType: "SELLER",
  groups: [
    {
      id: "home",
      label: "홈",
      path: "/",
    },
    {
      id: "product",
      label: "상품 관리",
      path: "/product/list",
      // 등록·수정 화면에서도 이 메뉴가 활성으로 남아야 한다
      matchPaths: ["/product"],
    },
    {
      id: "connections",
      label: "연결·소통",
      path: "/connections",
    },
    // 계약 관리·공구 관리는 아직 기능 자체가 없다 — 시안 번호(#4·#5)를 맞추기 위해
    // 자리만 잡아둔 플레이스홀더 화면으로 연결된다.
    {
      id: "contract",
      label: "계약 관리",
      path: "/contract",
    },
    {
      id: "groupbuy",
      label: "공구 관리",
      path: "/group-buy",
    },
    {
      id: "sales",
      label: "판매 관리",
      path: "/sales/orders",
      matchPaths: ["/sales"],
    },
    {
      id: "settlement",
      label: "정산 관리",
      path: "/settlement/history",
      matchPaths: ["/settlement"],
    },
    {
      id: "inquiry",
      label: "문의 관리",
      // 하위 화면 중 유일하게 구현된 상품 문의 목록이 대표 화면이다
      path: "/inquiry/product",
      // 답변 템플릿(/inquiry/template)까지 이 메뉴가 대표한다
      matchPaths: ["/inquiry"],
    },
    {
      id: "store",
      label: "기본정보 관리",
      path: "/store/basic",
    },
  ],
}

export const CREATOR_MENU: MenuConfig = {
  menuType: "CREATOR",
  groups: [
    {
      id: "showroom",
      label: "쇼룸관리",
      children: [
        {
          id: "showroom-basic",
          label: "기본정보 관리",
          path: "/showroom/basic",
        },
      ],
    },
    {
      id: "analytics",
      label: "통계/분석",
      children: [
        {
          id: "analytics-visitors",
          label: "방문자 현황",
          path: "/analytics/visitors",
        },
        {
          id: "analytics-conversion",
          label: "상품별 클릭 전환율",
          path: "/analytics/conversion",
        },
        {
          id: "analytics-followers",
          label: "팔로워 추이",
          path: "/analytics/followers",
        },
      ],
    },
    {
      id: "product",
      label: "상품 관리",
      children: [
        {
          id: "creator-product-list",
          label: "상품 목록",
          path: "/product/list",
        },
        {
          id: "creator-product-register",
          label: "상품 등록",
          path: "/product/register",
        },
        {
          id: "product-request",
          label: "상품 등록 요청",
          path: "/product/request",
        },
      ],
    },
    {
      id: "post",
      label: "게시물 관리",
      children: [
        {
          id: "post-list",
          label: "게시물 목록",
          path: "/post/list",
        },
      ],
    },
    {
      id: "lottery",
      label: "쿠폰 관리",
      children: [
        {
          id: "lottery-list",
          label: "추첨 목록",
          path: "/lottery/list",
        },
        {
          id: "lottery-register",
          label: "추첨 등록",
          path: "/lottery/register",
        },
        {
          id: "lottery-winners",
          label: "당첨자 관리",
          path: "/lottery/winners",
        },
      ],
    },
    {
      id: "settlement",
      label: "정산 관리",
      children: [
        {
          id: "creator-settlement-history",
          label: "정산 내역",
          path: "/settlement/history",
        },
        {
          id: "settlement-commission",
          label: "상품별 커미션 내역",
          path: "/settlement/commission",
        },
        {
          id: "creator-settlement-vat",
          label: "부가세 신고 내역",
          path: "/settlement/vat",
        },
      ],
    },
  ],
}

export const COMMON_MENU: MenuConfig = {
  menuType: "COMMON",
  groups: [
    {
      id: "support-bug",
      path: "/support/bug",
      label: "오류 제보",
    },
    {
      id: "support-feature",
      path: "/support/feature",
      label: "기능 제안",
    },
  ],
}
