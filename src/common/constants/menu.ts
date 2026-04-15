import type { MenuConfig } from "@/common/types/menu"

export const SELLER_MENU: MenuConfig = {
  menuType: "SELLER",
  groups: [
    {
      id: "store",
      label: "마켓관리",
      children: [
        {
          id: "store-basic",
          label: "기본정보 관리",
          path: "/store/basic",
        },
        {
          id: "store-settlement-account",
          label: "정산 계좌 관리",
          path: "/store/settlement-account",
        },
      ],
    },
    {
      id: "product",
      label: "상품관리",
      children: [
        {
          id: "product-register",
          label: "상품 등록",
          path: "/product/register",
        },
        {
          id: "product-list",
          label: "상품 목록",
          path: "/product/list",
        },
        {
          id: "product-notice",
          label: "상품 공지사항 관리",
          path: "/product/notice",
        },
        {
          id: "review-list",
          label: "리뷰 관리",
          path: "/review/list",
        },
      ],
    },
    {
      id: "sales",
      label: "판매관리",
      children: [
        {
          id: "sales-all-orders",
          label: "전체 주문 내역",
          path: "/sales/orders",
        },
        {
          id: "sales-purchase-orders",
          label: "발주 관리",
          path: "/sales/purchase-orders",
        },
        {
          id: "sales-shipping-out",
          label: "발송 관리",
          path: "/sales/shipping-out",
        },
        {
          id: "sales-delivery",
          label: "배송 관리",
          path: "/sales/delivery",
        },
        {
          id: "sales-confirmed",
          label: "구매 확정 내역",
          path: "/sales/confirmed",
        },
        {
          id: "sales-cancel",
          label: "취소 관리",
          path: "/sales/cancel",
        },
        {
          id: "sales-return",
          label: "반품 관리",
          path: "/sales/return",
        },
        {
          id: "sales-exchange",
          label: "교환 관리",
          path: "/sales/exchange",
        },
      ],
    },
    {
      id: "coupon",
      label: "쿠폰 관리",
      children: [
        {
          id: "coupon-list",
          label: "쿠폰 목록",
          path: "/coupon/list",
        },
        {
          id: "coupon-register-direct",
          label: "쿠폰 등록",
          path: "/coupon/register-direct",
        },
      ],
    },
    {
      id: "settlement",
      label: "정산 관리",
      children: [
        {
          id: "settlement-history",
          label: "정산 내역",
          path: "/settlement/history",
        },
        {
          id: "settlement-by-product",
          label: "상품별 정산 내역",
          path: "/settlement/by-product",
        },
        {
          id: "settlement-vat",
          label: "부가세 신고 내역",
          path: "/settlement/vat",
        },
      ],
    },
    {
      id: "inquiry",
      label: "문의 관리",
      children: [
        {
          id: "inquiry-respond",
          label: "문의 확인 / 답변",
          path: "/inquiry/respond",
        },
        {
          id: "inquiry-product",
          label: "상품 문의 정보",
          path: "/inquiry/product",
        },
        {
          id: "inquiry-order",
          label: "주문 문의 정보",
          path: "/inquiry/order",
        },
        {
          id: "inquiry-template",
          label: "답변 템플릿",
          path: "/inquiry/template",
        },
      ],
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
