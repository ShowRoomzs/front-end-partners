import DetailCard from "@/common/components/DetailCard/DetailCard"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import type { ContractItem } from "@/features/contracts/types"
import { formatKRW, formatPercent } from "@/features/contracts/utils/format"

interface ContractItemsCardProps {
  items: Array<ContractItem>
  /** 종결 3종은 "N건"만, 진행·체결은 정산 안내를 덧붙인다 */
  showSettlementNote: boolean
}

/** 「계약 상품 항목」 읽기 전용 — 정가 · 공구가 · 리워드율 · 예상 리워드 · 최소 물량 */
export default function ContractItemsCard(props: ContractItemsCardProps) {
  const { items, showSettlementNote } = props

  return (
    <DetailCard
      title="계약 상품 항목"
      note={
        showSettlementNote
          ? `${items.length}건 · 정산이 이 리워드율을 사용합니다`
          : `${items.length}건`
      }
    >
      {items.length === 0 ? (
        <p className="text-[12px] text-sz-n-500">상품 항목이 없습니다.</p>
      ) : (
        <Terms>
          {items.map(item => (
            <TermRow
              key={item.contractItemId}
              label={item.productName ?? "(상품 미선택)"}
              labelWidth={176}
              className="tabular-nums"
            >
              정가 {formatKRW(item.regularPrice)} · 공구가{" "}
              <b className="font-semibold text-sz-n-900">
                {formatKRW(item.groupBuyPrice)}
              </b>{" "}
              · 리워드율{" "}
              <b className="font-semibold text-sz-n-900">
                {formatPercent(item.rewardRate)}
              </b>{" "}
              · 예상 리워드 {formatKRW(item.unitReward)} · 최소 물량{" "}
              <b className="font-semibold text-sz-n-900">
                {item.minQuantity === null
                  ? "—"
                  : `${item.minQuantity.toLocaleString("ko-KR")}개`}
              </b>
            </TermRow>
          ))}
        </Terms>
      )}
    </DetailCard>
  )
}
