import type { MenuConfig } from "@/common/types/menu"

export const SELLER_MENU: MenuConfig = {
  menuType: "SELLER",
  groups: [
    {
      id: "store",
      label: "스토어 관리",
      children: [
        {
          id: "store-basic",
          label: "기본정보 관리",
          path: "/store/basic",
        },
      ],
    },
    {
      id: "product",
      label: "상품 관리",
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
      ],
    },
  ],
}

export const CREATOR_MENU: MenuConfig = {
  menuType: "CREATOR",
  groups: [
    {
      id: "showroom",
      label: "쇼룸 관리",
      children: [
        {
          id: "showroom-basic",
          label: "기본정보 관리",
          path: "/showroom/basic",
        },
        {
          id: "showroom-product",
          label: "상품 관리",
          path: "/showroom/product",
        },
        {
          id: "showroom-post",
          label: "게시물",
          path: "/showroom/post",
        },
        {
          id: "showroom-coupon",
          label: "쿠폰",
          path: "/showroom/coupon",
        },
        {
          id: "showroom-lottery",
          label: "추첨",
          path: "/showroom/lottery",
        },
      ],
    },
    {
      id: "goods",
      label: "굿즈 관리",
      children: [
        {
          id: "goods-store",
          label: "스토어 관리",
          path: "/goods/store",
        },
        {
          id: "goods-register",
          label: "굿즈 등록",
          path: "/goods/register",
        },
        {
          id: "goods-list",
          label: "굿즈 목록",
          path: "/goods/list",
        },
        {
          id: "goods-notice",
          label: "굿즈 공지사항 관리",
          path: "/goods/notice",
        },
      ],
    },
  ],
}

export const COMMON_MENU: MenuConfig = {
  menuType: "COMMON",
  groups: [
    {
      id: "sales",
      label: "판매 관리",
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
          id: "coupon-register",
          label: "쿠폰 등록",
          path: "/coupon/register",
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
      id: "review",
      label: "리뷰 관리",
      children: [
        {
          id: "review-list",
          label: "리뷰 목록",
          path: "/review/list",
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
