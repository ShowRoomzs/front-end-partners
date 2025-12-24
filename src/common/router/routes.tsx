import type { RouteObject } from 'react-router-dom'
import { MainLayout, PlaceholderPage } from '@/common/components'

export const routes: Array<RouteObject> = [
  {
    path: '/',
    element: <MainLayout children={<PlaceholderPage title="Dashboard" />} />,
  },
  // Seller routes
  {
    path: '/store/basic',
    element: (
      <MainLayout children={<PlaceholderPage title="기본정보 관리" />} />
    ),
  },
  {
    path: '/product/register',
    element: <MainLayout children={<PlaceholderPage title="상품 등록" />} />,
  },
  {
    path: '/product/list',
    element: <MainLayout children={<PlaceholderPage title="상품 목록" />} />,
  },
  {
    path: '/product/notice',
    element: (
      <MainLayout children={<PlaceholderPage title="상품 공지사항 관리" />} />
    ),
  },
  // Creator routes
  {
    path: '/showroom/basic',
    element: (
      <MainLayout children={<PlaceholderPage title="기본정보 관리" />} />
    ),
  },
  {
    path: '/showroom/product',
    element: <MainLayout children={<PlaceholderPage title="상품 관리" />} />,
  },
  {
    path: '/showroom/post',
    element: <MainLayout children={<PlaceholderPage title="게시물" />} />,
  },
  {
    path: '/showroom/coupon',
    element: <MainLayout children={<PlaceholderPage title="쿠폰" />} />,
  },
  {
    path: '/showroom/lottery',
    element: <MainLayout children={<PlaceholderPage title="추첨" />} />,
  },
  {
    path: '/goods/store',
    element: <MainLayout children={<PlaceholderPage title="스토어 관리" />} />,
  },
  {
    path: '/goods/register',
    element: <MainLayout children={<PlaceholderPage title="굿즈 등록" />} />,
  },
  {
    path: '/goods/list',
    element: <MainLayout children={<PlaceholderPage title="굿즈 목록" />} />,
  },
  {
    path: '/goods/notice',
    element: (
      <MainLayout children={<PlaceholderPage title="굿즈 공지사항 관리" />} />
    ),
  },
  // Common routes
  {
    path: '/sales/orders',
    element: (
      <MainLayout children={<PlaceholderPage title="전체 주문 내역" />} />
    ),
  },
  {
    path: '/sales/purchase-orders',
    element: <MainLayout children={<PlaceholderPage title="발주 관리" />} />,
  },
  {
    path: '/sales/shipping-out',
    element: <MainLayout children={<PlaceholderPage title="발송 관리" />} />,
  },
  {
    path: '/sales/delivery',
    element: <MainLayout children={<PlaceholderPage title="배송 관리" />} />,
  },
  {
    path: '/sales/confirmed',
    element: (
      <MainLayout children={<PlaceholderPage title="구매 확정 내역" />} />
    ),
  },
  {
    path: '/sales/cancel',
    element: <MainLayout children={<PlaceholderPage title="취소 관리" />} />,
  },
  {
    path: '/sales/return',
    element: <MainLayout children={<PlaceholderPage title="반품 관리" />} />,
  },
  {
    path: '/sales/exchange',
    element: <MainLayout children={<PlaceholderPage title="교환 관리" />} />,
  },
  {
    path: '/coupon/list',
    element: <MainLayout children={<PlaceholderPage title="쿠폰 목록" />} />,
  },
  {
    path: '/coupon/register',
    element: <MainLayout children={<PlaceholderPage title="쿠폰 등록" />} />,
  },
  {
    path: '/settlement/history',
    element: <MainLayout children={<PlaceholderPage title="정산 내역" />} />,
  },
  {
    path: '/settlement/by-product',
    element: (
      <MainLayout children={<PlaceholderPage title="상품별 정산 내역" />} />
    ),
  },
  {
    path: '/settlement/vat',
    element: (
      <MainLayout children={<PlaceholderPage title="부가세 신고 내역" />} />
    ),
  },
  {
    path: '/review/list',
    element: <MainLayout children={<PlaceholderPage title="리뷰 목록" />} />,
  },
  {
    path: '/inquiry/respond',
    element: (
      <MainLayout children={<PlaceholderPage title="문의 확인 / 답변" />} />
    ),
  },
  {
    path: '/inquiry/product',
    element: (
      <MainLayout children={<PlaceholderPage title="상품 문의 정보" />} />
    ),
  },
  {
    path: '/inquiry/order',
    element: (
      <MainLayout children={<PlaceholderPage title="주문 문의 정보" />} />
    ),
  },
  {
    path: '/inquiry/template',
    element: <MainLayout children={<PlaceholderPage title="답변 템플릿" />} />,
  },
  {
    path: '/support/bug',
    element: <MainLayout children={<PlaceholderPage title="오류 제보" />} />,
  },
  {
    path: '/support/feature',
    element: <MainLayout children={<PlaceholderPage title="기능 제안" />} />,
  },
]
