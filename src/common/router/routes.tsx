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
import SettlementDetailPage from "@/features/settlement/pages/SettlementDetailPage"
import SettlementListPage from "@/features/settlement/pages/SettlementListPage"
import RegisterDirect from "@/features/coupon/RegisterDirect/RegisterDirect"
import AnswerTemplateListPage from "@/features/inquiry/pages/AnswerTemplateListPage"
import AnswerTemplateWritePage from "@/features/inquiry/pages/AnswerTemplateWritePage"
import ConnectionsPage from "@/features/connections/pages/ConnectionsPage"
import ProductInquiryListPage from "@/features/productInquiry/pages/ProductInquiryListPage"
import ProductInquiryDetailPage from "@/features/productInquiry/pages/ProductInquiryDetailPage"
import ContractListPage from "@/features/contracts/pages/ContractListPage"
import ContractDetailPage from "@/features/contracts/pages/ContractDetailPage"
import GroupBuyListPage from "@/features/groupBuy/pages/GroupBuyListPage"
import GroupBuyDetailPage from "@/features/groupBuy/pages/GroupBuyDetailPage"
import OrderListPage from "@/features/orders/pages/OrderListPage"
import ClaimListPage from "@/features/claims/pages/ClaimListPage"
import HomePage from "@/features/home/pages/HomePage"
import PerformanceListPage from "@/features/performance/pages/PerformanceListPage"
import PerformanceDetailPage from "@/features/performance/pages/PerformanceDetailPage"

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
      // GNB #1 홈(ui-partner-16) — 서버 미배포면 화면 안에서 「준비 중」
      { index: true, element: <HomePage /> },
      // Seller - 기본정보 관리(§15) — 사업자 정보·배송·반품 정책·정산 계좌·담당자·CS·계정 5탭이
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
            element: (
              <ComingSoonPage
                title="상품 등록 요청"
                description="상품 등록 요청 화면은 아직 준비 중입니다."
              />
            ),
          },
        ],
      },
      // Seller - 연결·소통
      {
        path: "connections",
        element: <ConnectionsPage />,
      },
      /*
        Seller - 계약 관리 (§26) — 목록 · 상세.
        작성 모드와 계약서 모드가 같은 라우트다 — 작성중은 폼, 나머지는 읽기 화면이고
        상세가 응답 값으로 고른다. `/contract/new`는 두지 않는다(임시저장에 계약 ID가 필요해
        빈 초안을 먼저 만들고 그 ID로 들어간다).
      */
      {
        path: "contract",
        element: <ContractListPage />,
      },
      {
        path: "contract/:contractId",
        element: <ContractDetailPage />,
      },
      /*
        Seller - 공구 관리 (§29) — 목록 · 상세. 공구는 계약 체결로만 생기므로 생성 라우트가 없다.
        상세 B1~B7a는 한 화면이고 응답 값으로 카드 구성을 고른다.
      */
      {
        path: "group-buy",
        element: <GroupBuyListPage />,
      },
      {
        path: "group-buy/:groupBuyId",
        element: <GroupBuyDetailPage />,
      },
      // Seller - 성과 관리(ui-partner-12) — 서버 미배포면 화면 안에서 「준비 중」
      {
        path: "performance",
        element: <PerformanceListPage />,
      },
      {
        path: "performance/:groupBuyId",
        element: <PerformanceDetailPage />,
      },
      /*
        Creator 메뉴(CREATOR_MENU)가 아직 링크하는 옛 화면 — 인플루언서는 쇼룸 스튜디오로 옮겨 가
        이 앱에서는 만들지 않는다. 메뉴에서 쓰지 않는 하위 경로(쇼룸 상품 · 게시물 등록 · 굿즈 등)는 지웠다.
      */
      {
        path: "showroom/basic",
        element: (
          <ComingSoonPage
            title="쇼룸 기본정보 관리"
            description="쇼룸 기본정보 관리 화면은 아직 준비 중입니다."
          />
        ),
      },
      {
        path: "analytics",
        children: [
          {
            path: "visitors",
            element: (
              <ComingSoonPage
                title="방문자 현황"
                description="방문자 현황 화면은 아직 준비 중입니다."
              />
            ),
          },
          {
            path: "conversion",
            element: (
              <ComingSoonPage
                title="상품별 클릭 전환율"
                description="상품별 클릭 전환율 화면은 아직 준비 중입니다."
              />
            ),
          },
          {
            path: "followers",
            element: (
              <ComingSoonPage
                title="팔로워 추이"
                description="팔로워 추이 화면은 아직 준비 중입니다."
              />
            ),
          },
        ],
      },
      {
        path: "post/list",
        element: (
          <ComingSoonPage
            title="게시물 목록"
            description="게시물 목록 화면은 아직 준비 중입니다."
          />
        ),
      },
      {
        path: "lottery",
        children: [
          {
            path: "list",
            element: (
              <ComingSoonPage
                title="추첨 목록"
                description="추첨 목록 화면은 아직 준비 중입니다."
              />
            ),
          },
          {
            path: "register",
            element: (
              <ComingSoonPage
                title="추첨 등록"
                description="추첨 등록 화면은 아직 준비 중입니다."
              />
            ),
          },
          {
            path: "winners",
            element: (
              <ComingSoonPage
                title="당첨자 관리"
                description="당첨자 관리 화면은 아직 준비 중입니다."
              />
            ),
          },
        ],
      },
      // Common - 판매 관리
      {
        path: "sales",
        children: [
          {
            /*
              주문 관리 (§34 · 시안 10a~10e) — 탭 9종이 한 화면이고 상세는 모달이다(rev.2).
              목록의 스크롤·필터·선택을 잃지 않으려고 상세 라우트를 두지 않는다.
            */
            path: "orders",
            element: <OrderListPage />,
          },
          // 판매 관리 › 반품·교환 관리(§35) — 상세는 목록 위 모달이라 하위 라우트가 없다
          {
            path: "claims",
            element: <ClaimListPage />,
          },
        ],
      },
      // Common - 쿠폰 관리
      {
        path: "coupon",
        children: [
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
            // 공구 관리의 [정산 관리 열기]·[정산 내역 보기 ↗]가 오는 곳(ui-partner-13).
            element: <SettlementListPage />,
          },
          {
            path: "history/:settlementId",
            element: <SettlementDetailPage />,
          },
          {
            path: "vat",
            element: (
              <ComingSoonPage
                title="부가세 신고 내역"
                description="부가세 신고 내역은 아직 준비 중입니다."
              />
            ),
          },
          {
            path: "commission",
            element: (
              <ComingSoonPage
                title="상품별 커미션 내역"
                description="상품별 커미션 내역은 아직 준비 중입니다."
              />
            ),
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
          /*
            상품 문의 관리 (§23) — 목록 · 상세.
            상세는 행 클릭으로만 들어가므로 GNB에 올리지 않는다.
          */
          {
            path: "product",
            element: <ProductInquiryListPage />,
          },
          {
            path: "product/:inquiryId",
            element: <ProductInquiryDetailPage />,
          },
        ],
      },
      // Common - 고객지원
      {
        path: "support",
        children: [
          {
            path: "bug",
            element: (
              <ComingSoonPage
                title="오류 제보"
                description="오류 제보 화면은 아직 준비 중입니다."
              />
            ),
          },
          {
            path: "feature",
            element: (
              <ComingSoonPage
                title="기능 제안"
                description="기능 제안 화면은 아직 준비 중입니다."
              />
            ),
          },
        ],
      },
    ],
  },
]
