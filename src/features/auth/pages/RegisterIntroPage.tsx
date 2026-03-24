import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Store, MonitorPlay, Check } from "lucide-react"

const MARKET_FEATURES = [
  "상품 등록 및 판매",
  "주문/정산 관리",
  "마켓 페이지 운영",
]
const CREATOR_FEATURES = [
  "나만의 쇼룸 운영",
  "체험 상품 판매",
  "구독자 대상 판매",
]

export default function RegisterIntroPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-4xl px-12 py-10">
        <div className="text-sm font-bold tracking-widest mb-10">SHOWROOMZ</div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">
            어떤 <span className="text-blue-500">유형</span>으로 시작하시겠어요?
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            소룸즈는 마켓과 크리에이터가 함께 성장하는 커머스 플랫폼입니다.
            <br />내 역할에 맞는 유형을 선택해주세요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-200 rounded-xl p-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5">
              <Store size={36} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold mb-1">마켓</h2>
            <p className="text-gray-400 text-sm mb-6">
              상품을 판매하는 브랜드/셀러
            </p>
            <ul className="w-full space-y-2 mb-8">
              {MARKET_FEATURES.map(feature => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <Check size={14} className="text-blue-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={() => navigate("/register/market")}
            >
              마켓으로 시작하기
            </Button>
          </div>

          <div className="border border-gray-200 rounded-xl p-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-5">
              <MonitorPlay size={36} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">크리에이터</h2>
            <p className="text-gray-400 text-sm mb-6">
              콘텐츠 기반 쇼핑 큐레이터
            </p>
            <ul className="w-full space-y-2 mb-8">
              {CREATOR_FEATURES.map(feature => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <Check size={14} className="text-purple-400 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={() => navigate("/register/creator")}
            >
              크리에이터로 시작하기
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          어떤 유형이 맞는지 모르겠다면?{" "}
          <a href="#" className="text-blue-500 hover:underline">
            유형 비교 보기 →
          </a>
        </div>
      </div>
    </div>
  )
}
