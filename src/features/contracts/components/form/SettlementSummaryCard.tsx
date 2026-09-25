import DetailCard from "@/common/components/DetailCard/DetailCard"
import {
  FSUB_CLASS,
  WTAG_CLASS,
} from "@/features/contracts/components/shared/styles"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import type { ContractSettlement } from "@/features/contracts/types"
import { formatKRW } from "@/features/contracts/utils/format"

interface SettlementSummaryCardProps {
  settlement: ContractSettlement
  /** 현재 입력 중인 고정 지급비 — 저장 전 값도 그대로 비춘다 */
  fixedFeeAmount: number | null
  /** 상대가 아직 없으면 원천징수 행을 안내 문구로 채운다 */
  hasCounterparty: boolean
}

/**
 * 시안 B1 「정산 조건 요약」 — 브랜드 입력이 아니라 자동 표시(§25-6-6).
 * PG 수수료는 자문 회신 전이라 `null`로 오고, 그때 「0%」가 아니라 자리만 표시한다.
 */
export default function SettlementSummaryCard(
  props: SettlementSummaryCardProps
) {
  const { settlement, fixedFeeAmount, hasCounterparty } = props

  return (
    <DetailCard title="정산 조건 요약" note="브랜드 입력 아님 · 자동 계산">
      <Terms>
        <TermRow label="공구가 기준">부가세 포함 소비자 판매가</TermRow>
        <TermRow label="플랫폼 수수료">{settlement.platformFeeRate}%</TermRow>
        <TermRow label="PG 결제 수수료">
          {settlement.pgFeeRate === null ? (
            <span className="text-sz-n-500">
              회신 전 · 자리만 표시
              <span className={WTAG_CLASS}>자문대기 · PG</span>
            </span>
          ) : (
            `${settlement.pgFeeRate}%`
          )}
        </TermRow>
        <TermRow label="리워드 원천징수">
          {settlement.withholdingType === "WITHHOLDING_3_3" ? (
            <>
              상대가 <b className="font-semibold text-sz-n-900">비사업자</b>
              이므로{" "}
              <b className="font-semibold text-sz-n-900">3.3% 공제 후 지급</b>
              됩니다.
              <div className={FSUB_CLASS}>
                상대 계정 정보 기반 자동 표시 · 사업자면 세금계산서 발행으로
                바뀝니다
              </div>
            </>
          ) : settlement.withholdingType === "TAX_INVOICE" ? (
            <>
              상대가 <b className="font-semibold text-sz-n-900">사업자</b>
              이므로{" "}
              <b className="font-semibold text-sz-n-900">세금계산서 발행</b>
              으로 정산됩니다.
              <div className={FSUB_CLASS}>
                상대 계정 정보 기반 자동 표시 · 비사업자면 3.3% 공제로 바뀝니다
              </div>
            </>
          ) : (
            <span className="text-sz-n-500">
              {hasCounterparty
                ? "상대 계정 정보 확인 후 표시됩니다"
                : "계약 상대를 선택하면 표시됩니다"}
            </span>
          )}
        </TermRow>
        <TermRow label="고정 지급비">
          <span className="tabular-nums">{formatKRW(fixedFeeAmount ?? 0)}</span>
          <div className={FSUB_CLASS}>리워드와 합산하지 않는 별도 지급액</div>
        </TermRow>
      </Terms>
    </DetailCard>
  )
}
