import { CONTRACT_TABS } from "@/features/contracts/constants/params"
import Btn from "@/features/contracts/components/shared/Btn"
import type { ContractTab } from "@/features/contracts/types"

interface ContractEmptyStateProps {
  /** 조건(검색어·기간·전체 아닌 탭)이 걸려 있으면 "검색 결과 없음"(A2a), 아니면 "계약 없음"(A2) */
  hasCondition: boolean
  tab: ContractTab
  keyword: string
  onReset: () => void
  onGoConnections: () => void
}

/**
 * 빈 상태 2종은 다른 화면이다(§26-1).
 * 계약이 아예 없으면 브랜드가 직접 만들 수 있으니 CTA를 두되, 연결이 없으면 계약도 못 만들므로
 * 연결·소통으로 유도한다. 검색 결과가 없으면 조건 탓임을 밝히고 초기화로 되돌린다.
 */
export default function ContractEmptyState(props: ContractEmptyStateProps) {
  const { hasCondition, tab, keyword, onReset, onGoConnections } = props

  if (hasCondition) {
    const tabLabel =
      CONTRACT_TABS.find(item => item.value === tab)?.label ?? "전체"
    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          검색 조건에 맞는 계약이 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          {keyword
            ? `${tabLabel} 탭에서 “${keyword}”을(를) 찾지 못했습니다. 다른 탭에는 있을 수 있습니다.`
            : `${tabLabel} 탭에 조건에 맞는 계약이 없습니다. 다른 탭에는 있을 수 있습니다.`}
        </div>
        <Btn variant="secondary" className="mt-4" onClick={onReset}>
          검색 조건 초기화
        </Btn>
      </div>
    )
  }

  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        작성한 계약이 없습니다
      </div>
      <div className="text-[12px] leading-relaxed text-sz-n-500">
        계약은 <b className="font-semibold text-sz-n-700">연결됨</b> 상태인
        인플루언서와만 작성할 수 있습니다.
        <br />
        연결·소통에서 상대를 연결한 뒤 계약을 작성하세요.
      </div>
      <Btn variant="primary" className="mt-4" onClick={onGoConnections}>
        연결·소통으로 이동
      </Btn>
    </div>
  )
}
