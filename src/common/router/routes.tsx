import type { RouteObject } from "react-router-dom"
import { MainLayout } from "@/common/components"
import RegisterProductPage from "@/features/productManagement/pages/RegisterProductPage"
import LoginPage from "@/features/auth/pages/LoginPage"
import RegisterPage from "@/features/auth/pages/RegisterPage"
import ProductListPage from "@/features/productManagement/pages/ProductListPage"
import BasicManagement from "@/features/storeManagement/pages/BasicManagement"

export const authRoutes: Array<RouteObject> = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "*",
    element: <LoginPage />,
  },
]

export const mainRoutes: Array<RouteObject> = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <div>aasdf</div>,
      },
      // Seller - 스토어 관리
      {
        path: "store",
        children: [
          {
            path: "basic",
            element: <BasicManagement />,
          },
        ],
      },
      // Seller - 상품 관리
      {
        path: "product",
        children: [
          {
            path: "register",
            element: <RegisterProductPage />,
          },
          {
            path: "list",
            element: <ProductListPage />,
          },
          {
            path: "edit/:productId",
            element: <RegisterProductPage />,
          },
          {
            path: "notice",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Creator - 쇼룸 관리
      {
        path: "showroom",
        children: [
          {
            path: "basic",
            element: <div>aasdf</div>,
          },
          {
            path: "product",
            element: <div>aasdf</div>,
          },
          {
            path: "post",
            element: <div>aasdf</div>,
          },
          {
            path: "coupon",
            element: <div>aasdf</div>,
          },
          {
            path: "lottery",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Creator - 굿즈 관리
      {
        path: "goods",
        children: [
          {
            path: "store",
            element: <div>aasdf</div>,
          },
          {
            path: "register",
            element: <div>aasdf</div>,
          },
          {
            path: "list",
            element: <div>aasdf</div>,
          },
          {
            path: "notice",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Common - 판매 관리
      {
        path: "sales",
        children: [
          {
            path: "orders",
            element: <div>aasdf</div>,
          },
          {
            path: "purchase-orders",
            element: <div>aasdf</div>,
          },
          {
            path: "shipping-out",
            element: <div>aasdf</div>,
          },
          {
            path: "delivery",
            element: <div>aasdf</div>,
          },
          {
            path: "confirmed",
            element: <div>aasdf</div>,
          },
          {
            path: "cancel",
            element: <div>aasdf</div>,
          },
          {
            path: "return",
            element: <div>aasdf</div>,
          },
          {
            path: "exchange",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Common - 쿠폰 관리
      {
        path: "coupon",
        children: [
          {
            path: "list",
            element: <div>aasdf</div>,
          },
          {
            path: "register",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Common - 정산 관리
      {
        path: "settlement",
        children: [
          {
            path: "history",
            element: <div>aasdf</div>,
          },
          {
            path: "by-product",
            element: <div>aasdf</div>,
          },
          {
            path: "vat",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Common - 리뷰 관리
      {
        path: "review",
        children: [
          {
            path: "list",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Common - 문의 관리
      {
        path: "inquiry",
        children: [
          {
            path: "respond",
            element: <div>aasdf</div>,
          },
          {
            path: "product",
            element: <div>aasdf</div>,
          },
          {
            path: "order",
            element: <div>aasdf</div>,
          },
          {
            path: "template",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Common - 고객지원
      {
        path: "support",
        children: [
          {
            path: "bug",
            element: <div>aasdf</div>,
          },
          {
            path: "feature",
            element: <div>aasdf</div>,
          },
        ],
      },
    ],
  },
]
