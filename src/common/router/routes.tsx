import type { RouteObject } from 'react-router-dom'
import { MainLayout } from '@/common/components'
import RegisterProductPage from '@/features/productManagement/pages/RegisterProductPage'

export const routes: Array<RouteObject> = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <div>aasdf</div>,
      },
      // Seller routes
      {
        path: 'store/basic',
        element: <div>aasdf</div>,
      },
      {
        path: 'product/register',
        element: <RegisterProductPage />,
      },
      {
        path: 'product/list',
        element: <div>aasdf</div>,
      },
      {
        path: 'product/notice',
        element: <div>aasdf</div>,
      },
      // Creator routes
      {
        path: 'showroom/basic',
        element: <div>aasdf</div>,
      },
      {
        path: 'showroom/product',
        element: <div>aasdf</div>,
      },
      {
        path: 'showroom/post',
        element: <div>aasdf</div>,
      },
      {
        path: 'showroom/coupon',
        element: <div>aasdf</div>,
      },
      {
        path: 'showroom/lottery',
        element: <div>aasdf</div>,
      },
      {
        path: 'goods/store',
        element: <div>aasdf</div>,
      },
      {
        path: 'goods/register',
        element: <div>aasdf</div>,
      },
      {
        path: 'goods/list',
        element: <div>aasdf</div>,
      },
      {
        path: 'goods/notice',
        element: <div>aasdf</div>,
      },
      // Common routes
      {
        path: 'sales/orders',
        element: <div>aasdf</div>,
      },
      {
        path: 'sales/purchase-orders',
        element: <div>aasdf</div>,
      },
      {
        path: 'sales/shipping-out',
        element: <div>aasdf</div>,
      },
      {
        path: 'sales/delivery',
        element: <div>aasdf</div>,
      },
      {
        path: 'sales/confirmed',
        element: <div>aasdf</div>,
      },
      {
        path: 'sales/cancel',
        element: <div>aasdf</div>,
      },
      {
        path: 'sales/return',
        element: <div>aasdf</div>,
      },
      {
        path: 'sales/exchange',
        element: <div>aasdf</div>,
      },
      {
        path: 'coupon/list',
        element: <div>aasdf</div>,
      },
      {
        path: 'coupon/register',
        element: <div>aasdf</div>,
      },
      {
        path: 'settlement/history',
        element: <div>aasdf</div>,
      },
      {
        path: 'settlement/by-product',
        element: <div>aasdf</div>,
      },
      {
        path: 'settlement/vat',
        element: <div>aasdf</div>,
      },
      {
        path: 'review/list',
        element: <div>aasdf</div>,
      },
      {
        path: 'inquiry/respond',
        element: <div>aasdf</div>,
      },
      {
        path: 'inquiry/product',
        element: <div>aasdf</div>,
      },
      {
        path: 'inquiry/order',
        element: <div>aasdf</div>,
      },
      {
        path: 'inquiry/template',
        element: <div>aasdf</div>,
      },
      {
        path: 'support/bug',
        element: <div>aasdf</div>,
      },
      {
        path: 'support/feature',
        element: <div>aasdf</div>,
      },
    ],
  },
]
