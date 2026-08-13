import { Outlet, type RouteObject } from "react-router-dom"
import MainLayout from "@/common/components/MainLayout/MainLayout"
import ErrorPage from "@/common/components/ErrorBoundary/ErrorPage"
import ComingSoonPage from "@/common/components/ComingSoon/ComingSoonPage"
import RegisterProductPage from "@/features/productManagement/pages/RegisterProductPage"
import LoginPage from "@/features/auth/pages/LoginPage"
import RegisterPage from "@/features/auth/pages/RegisterPage"
import RegisterIntroPage from "@/features/auth/pages/RegisterIntroPage"
import RegisterCreatorPage from "@/features/auth/pages/RegisterCreatorPage"
import OnboardingGatePage from "@/features/auth/pages/OnboardingGatePage"
import ProductListPage from "@/features/productManagement/pages/ProductListPage"
import BasicInfoPage from "@/features/storeManagement/pages/BasicInfoPage"
import RegisterDirect from "@/features/coupon/RegisterDirect/RegisterDirect"
import AnswerTemplateListPage from "@/features/inquiry/pages/AnswerTemplateListPage"
import AnswerTemplateWritePage from "@/features/inquiry/pages/AnswerTemplateWritePage"
import ConnectionsPage from "@/features/connections/pages/ConnectionsPage"

export const authRoutes: Array<RouteObject> = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterIntroPage />,
  },
  {
    path: "/register/market",
    element: <RegisterPage />,
  },
  {
    path: "/register/creator",
    element: <RegisterCreatorPage />,
  },
  // 승인 후 최초 로그인 시 강제 진입하는 활성화 게이트.
  // 이 시점엔 정식 토큰이 없어 라우터가 authRoutes를 그리므로 여기에 둔다.
  {
    path: "/onboarding",
    element: <OnboardingGatePage />,
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
    errorElement: <ErrorPage />,
    children: [
      // GNB #1 "홈" — 대시보드가 생기기 전까지의 자리표시 화면.
      // 메뉴 항목이 실제로 클릭되는 경로라 빈 div로 둘 수 없다.
      {
        index: true,
        element: (
          <ComingSoonPage
            title="홈"
            description="파트너센터 대시보드는 아직 준비 중입니다."
          />
        ),
      },
      // Seller - 기본정보 관리(§15) — 사업자 정보·정산 계좌·담당자·CS·계정 4탭이
      // 전부 한 페이지 안에서 쿼리파라미터(?tab=)로 전환되므로 하위 라우트가 필요 없다.
      {
        path: "store",
        children: [
          {
            path: "basic",
            element: <BasicInfoPage />,
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
            // 크리에이터 메뉴에서만 진입한다(셀러 "상품 관리"는 목록 단일 화면)
            path: "request",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Seller - 연결·소통
      {
        path: "connections",
        element: <ConnectionsPage />,
      },
      // Seller - 계약 관리 / 공구 관리 — 시안 GNB #4·#5의 자리만 확보한 플레이스홀더.
      // 기능이 생기면 이 element를 실제 화면으로 갈아끼우면 된다.
      {
        path: "contract",
        element: (
          <ComingSoonPage
            title="계약 관리"
            description="브랜드·인플루언서 계약 관리 화면은 아직 준비 중입니다."
          />
        ),
      },
      {
        path: "group-buy",
        element: (
          <ComingSoonPage
            title="공구 관리"
            description="공동구매 등록·진행 관리 화면은 아직 준비 중입니다."
          />
        ),
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
            path: "coupon-direct",
            element: <div>aasdf</div>,
          },
          {
            path: "lottery",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Creator - 통계/분석
      {
        path: "analytics",
        children: [
          {
            path: "visitors",
            element: <div>aasdf</div>,
          },
          {
            path: "conversion",
            element: <div>aasdf</div>,
          },
          {
            path: "followers",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Creator - 게시물 관리
      {
        path: "post",
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
      // Creator - 쿠폰 관리(추첨)
      {
        path: "lottery",
        children: [
          {
            path: "list",
            element: <div>aasdf</div>,
          },
          {
            path: "register",
            element: <div>aasdf</div>,
          },
          {
            path: "winners",
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
            path: "register-direct",
            element: <RegisterDirect />,
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
          {
            path: "commission",
            element: <div>aasdf</div>,
          },
        ],
      },
      // Common - 답변 템플릿
      {
        path: "inquiry/template",
        element: <AnswerTemplateListPage />,
      },
      {
        path: "inquiry/template/write",
        element: <AnswerTemplateWritePage />,
      },
      // Common - 문의 관리
      {
        path: "inquiry",
        element: <Outlet />,
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
