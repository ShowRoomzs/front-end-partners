import Pagination from "@/common/components/Pagination/Pagination"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  ActBtn,
  LTAB_CELL,
  LTAB_HEAD,
  MNote,
  MTAB_AMOUNT,
  MTAB_CELL,
  MTAB_MID_ROW,
  MTAB_ROW,
  MTAB_TBODY,
  MTAB_TOT_ROW,
  Note,
  ReadRow,
  Sec,
  SecEmpty,
  WaitTag,
} from "@/features/settlement/components/detail/DetailParts"
import {
  PROPOSAL_STATUS_NOTE,
  SETTLEMENT_ACCOUNT_PATH,
  SETTLEMENT_TONE_TEXT,
  STATEMENT_PAGE_SIZE,
  TAX_DOCUMENT_STATUS_LABEL,
  TAX_DOCUMENT_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import { useGetSettlementItems } from "@/features/settlement/hooks/useSettlementQueries"
import type {
  PayoutStatus,
  SettlementDetail,
  SettlementItem,
  SettlementPayout,
  SettlementTaxDocument,
} from "@/features/settlement/types"
import {
  formatFullDate,
  formatMinusWon,
  formatMonthDay,
  formatMonthDayTime,
  formatPercent,
  formatPlusWon,
  formatRate,
  formatWon,
  ratioToPercent,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { Loader2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

type Props = { detail: SettlementDetail }

/** 시안의 맨 `<b>` — 굵기는 브라우저 기본(bolder · 700) */
const B = ({ children }: { children: ReactNode }) => <b>{children}</b>

/** 확정 전(정산 확인 중 · 조정 협의) — 서버가 분배 · 지급 정보 · 세금계산서를 null로 내린다 */
function isBeforeConfirm(detail: SettlementDetail) {
  return detail.status === "REVIEWING" || detail.status === "ADJUSTING"
}

/** D-4 · 남은 영업일이 0이면 D-day */
function dDay(days: number) {
  return days > 0 ? `D-${days}` : "D-day"
}

/**
 * 상단 요약 바 — 상태별 날짜 2개 + 정산 근거(또는 지급 보류).
 * 자동 확정은 확인 마감 다음 날 0시에 돈다 — 정산 확인 중의 「자동 확정」 날짜는 마감 다음 날로 적는다
 * (서버가 예정일을 따로 내리지 않는다).
 */
export function SummaryBar({ detail }: Props) {
  const { dates } = detail
  const confirmLabel = dates.confirmReasonLabel ?? "확정"
  const items: Array<{ label: string; value: ReactNode; warn?: boolean }> =
    (() => {
      switch (detail.status) {
        case "REVIEWING":
          return [
            { label: "정산 생성", value: formatFullDate(dates.createdAt) },
            {
              label: "확인 기간",
              value: `~ ${formatMonthDayTime(dates.reviewDueAt)}`,
            },
            {
              label: "자동 확정",
              value: formatMonthDay(
                dayjs(dates.reviewDueAt).add(1, "second").format("YYYY-MM-DD")
              ),
            },
          ]
        case "ADJUSTING": {
          const adjustment = detail.adjustment
          const days = adjustment?.remainingBusinessDays
          return [
            {
              label: "조정 요청",
              value: formatFullDate(adjustment?.openedAt ?? null),
            },
            {
              label: "합의 기한",
              value: adjustment
                ? `${formatMonthDay(adjustment.deadlineAt)}${days == null ? "" : ` · ${dDay(days)}`}`
                : "—",
              warn: true,
            },
            { label: "지급", value: "전액 보류", warn: true },
          ]
        }
        case "PAYOUT_SCHEDULED":
          return [
            { label: confirmLabel, value: formatFullDate(dates.confirmedAt) },
            {
              label: "지급 예정일",
              value: formatFullDate(dates.payoutDueDate),
            },
            { label: "정산 근거", value: dates.payoutBasis ?? "—" },
          ]
        case "PAID":
          return [
            { label: confirmLabel, value: formatFullDate(dates.confirmedAt) },
            {
              label: "지급일",
              // 브랜드 몫 분배가 실패하면 정산은 지급 완료로 접혀 오고 지급일이 비어 있다
              value: dates.paidAt
                ? formatFullDate(dates.paidAt)
                : (brandPayout(detail)?.statusLabel ?? "—"),
            },
            { label: "정산 근거", value: dates.payoutBasis ?? "—" },
          ]
      }
    })()

  return (
    <Sec bodyClassName="flex flex-wrap items-center gap-6 px-4 py-3">
      {items.map(item => (
        <span key={item.label} className="text-[12px] text-sz-n-600">
          {item.label}{" "}
          <b
            className={cn(
              "font-bold tabular-nums",
              item.warn ? "text-sz-warning-text" : "text-sz-n-900"
            )}
          >
            {item.value}
          </b>
        </span>
      ))}
    </Sec>
  )
}

function brandPayout(detail: SettlementDetail) {
  return detail.payouts?.find(payout => payout.payee === "BRAND") ?? null
}

/** 시안 `.mtab tr.sub` — 보조 줄(`.mnote`)은 라벨 아래 블록으로 */
function SubRow(props: {
  label: ReactNode
  note?: ReactNode
  amount: ReactNode
}) {
  return (
    <tr className={cn(MTAB_ROW, "text-sz-n-600")}>
      <td className={MTAB_CELL}>
        {props.label}
        {props.note && <MNote>{props.note}</MNote>}
      </td>
      <td className={cn(MTAB_AMOUNT, "text-sz-n-700")}>{props.amount}</td>
    </tr>
  )
}

/** 시안 `.mtab tr.tot` — 총계(내 수취액 · 이번 지급액) */
function TotalRow(props: { label: string; amount: number }) {
  return (
    <tr className={MTAB_TOT_ROW}>
      <td className={MTAB_CELL}>{props.label}</td>
      <td className={MTAB_AMOUNT}>{formatWon(props.amount)}</td>
    </tr>
  )
}

/**
 * D4 조정 내역 — 원래 → 요청 → 다른 금액 제안 → 진행. 협의는 이슈 스레드에서 양측이 직접 하고
 * 이 화면은 내역만 보여준다 — 동의·제안·반대 버튼을 두지 않는다(같은 행동이 두 화면에 있으면
 * 어느 쪽이 기록인지 흐려진다 · §43-3). 서버는 종결(합의 · 기한 만료) 뒤에도 이력으로 내려 준다.
 */
export function AdjustmentCard(props: Props & { onOpenThread: () => void }) {
  const { detail, onOpenThread } = props
  const adjustment = detail.adjustment
  if (!adjustment) return null
  const open = adjustment.status === "OPEN"
  const partyName = (mine: boolean) =>
    mine ? "우리" : detail.influencer.showroomName

  return (
    <Sec
      title="조정 내역"
      tone={open ? "warning" : undefined}
      note={
        open
          ? "이슈 스레드 진행 중 · 운영팀은 열람만 합니다"
          : `이슈 스레드 종결 · ${adjustment.statusLabel}`
      }
    >
      <table className="w-full border-collapse text-[12px]">
        <tbody className={MTAB_TBODY}>
          <tr className={MTAB_ROW}>
            <td className={MTAB_CELL}>원래 리워드</td>
            <td className={MTAB_AMOUNT}>
              {formatWon(adjustment.originalRewardAmount)}
            </td>
          </tr>
          {adjustment.proposals.map((proposal, index) => (
            <SubRow
              key={proposal.seq}
              label={index === 0 ? "조정 요청" : "다른 금액 제안"}
              note={[
                partyName(proposal.mine),
                formatMonthDay(proposal.proposedAt),
                proposal.reason,
                PROPOSAL_STATUS_NOTE[proposal.status],
              ]
                .filter(Boolean)
                .join(" · ")}
              amount={formatWon(proposal.rewardAmount)}
            />
          ))}
          <tr className={MTAB_ROW}>
            <td className={MTAB_CELL}>진행</td>
            <td
              className={cn(
                MTAB_AMOUNT,
                SETTLEMENT_TONE_TEXT[adjustment.turnTone]
              )}
            >
              {open ? adjustment.turnLabel : adjustment.statusLabel}
            </td>
          </tr>
          {adjustment.finalRewardAmount !== null && (
            <tr className={MTAB_MID_ROW}>
              <td className={MTAB_CELL}>최종 리워드</td>
              <td className={MTAB_AMOUNT}>
                {formatWon(adjustment.finalRewardAmount)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="flex-1 text-[11px] text-sz-n-500">
          {open ? (
            <>
              합의되면 금액이 바로 반영되고 지급 예정으로 넘어갑니다.{" "}
              {formatMonthDay(adjustment.deadlineAt)}까지 합의가 없으면 원래
              금액({formatWon(adjustment.originalRewardAmount)})으로 확정됩니다.
            </>
          ) : (
            "협의가 종결되었습니다. 대화 기록은 이슈 스레드에 남아 있습니다."
          )}
        </span>
        <Btn variant="primary" onClick={onOpenThread}>
          이슈 스레드 열기
        </Btn>
      </div>
    </Sec>
  )
}

/**
 * 정산 금액 분해(§41-4 브랜드 축) — 서버 `breakdown`을 계산 순서 그대로 세로로. 소계(확정 거래액)와
 * 총계(내 수취액)를 가른다. PG 결제 수수료는 PG사가 먼저 떼므로 리워드보다 위, 플랫폼 수수료는 베타 0%라도
 * 행을 남긴다. 이전 정산 뒤 환불분은 「차감 반영」 행으로 빼고 「이번 지급액」을 따로 적는다.
 */
export function BreakdownCard({ detail }: Props) {
  const b = detail.breakdown
  const reviewing = detail.status === "REVIEWING"
  const pgRate = ratioToPercent(b.pgFee.rate)
  const platformRate = ratioToPercent(b.platformFee.rate)
  const platformNormalRate = ratioToPercent(b.platformFee.normalRate)
  const rewardChanged = b.originalRewardAmount !== b.rewardAmount

  return (
    <Sec
      title="정산 금액 분해"
      note={
        reviewing ? "확정 금액 · 조정 요청이 없으면 이 금액으로 지급" : "확정"
      }
    >
      <table className="w-full border-collapse text-[12px]">
        <tbody className={MTAB_TBODY}>
          <tr className={MTAB_ROW}>
            <td className={MTAB_CELL}>총 주문 금액</td>
            <td className={MTAB_AMOUNT}>{formatWon(b.grossOrderAmount)}</td>
          </tr>
          <SubRow
            label="취소 차감"
            note={`${b.cancel.count}건`}
            amount={formatMinusWon(b.cancel.amount)}
          />
          <SubRow
            label="반품 차감"
            note={`${b.return.count}건${reviewing ? " · 종결" : ""}`}
            amount={formatMinusWon(b.return.amount)}
          />
          <SubRow
            label="배송 예외 차감"
            note={`${b.deliveryException.count}건`}
            amount={formatMinusWon(b.deliveryException.amount)}
          />
          <tr className={MTAB_MID_ROW}>
            <td className={MTAB_CELL}>확정 거래액</td>
            <td className={MTAB_AMOUNT}>{formatWon(b.confirmedSalesAmount)}</td>
          </tr>
          <SubRow
            label="플랫폼 수수료"
            note={
              platformRate === platformNormalRate
                ? undefined
                : `베타 ${formatPercent(platformRate)} · 정상 ${formatPercent(platformNormalRate)}`
            }
            amount={formatMinusWon(b.platformFee.amount)}
          />
          <SubRow
            label="PG 결제 수수료"
            note={
              <>
                카드·간편결제 {formatRate(pgRate)}%{" "}
                <WaitTag>[자문대기-PG]</WaitTag> 요율 확정 대기
              </>
            }
            amount={formatMinusWon(b.pgFee.amount)}
          />
          <SubRow
            label="인플루언서 리워드"
            note={
              rewardChanged
                ? `원래 ${formatWon(b.originalRewardAmount)} · 조정 합의로 변경`
                : undefined
            }
            amount={formatMinusWon(b.rewardAmount)}
          />
          <SubRow
            label="리워드 부가세"
            note={`${formatPercent(ratioToPercent(b.rewardVat.rate))} · 별도 · SHOWROOMZ 세금계산서 발행분`}
            amount={formatMinusWon(b.rewardVat.amount)}
          />
          <SubRow
            label="재발송비"
            note={`교환·반려 재발송 · 브랜드 수취액에만 가산 · 리워드 기준 판매금액에 포함하지 않음${b.reshipFee.count === 0 ? " · 이 공구 해당 없음" : ` · ${b.reshipFee.count}건`}`}
            amount={formatPlusWon(b.reshipFee.amount)}
          />
          {b.consumerDeliveryFee !== 0 && (
            <SubRow
              label="소비자 결제 배송비"
              note="브랜드 수취액에 가산"
              amount={formatPlusWon(b.consumerDeliveryFee)}
            />
          )}
          <TotalRow label="내 수취액" amount={b.brandPayoutBeforeClawback} />
          {b.clawbacks.map(clawback => (
            <SubRow
              key={clawback.clawbackNumber}
              label="차감 반영"
              note={
                <>
                  {[
                    clawback.orderNumber,
                    clawback.originGroupBuyTitle,
                    clawback.reasonLabel,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {clawback.creditInvoiceStatus && (
                    <>
                      {" · "}
                      <B>
                        수정세금계산서{" "}
                        {
                          TAX_DOCUMENT_STATUS_LABEL[
                            clawback.creditInvoiceStatus
                          ]
                        }
                      </B>
                    </>
                  )}
                </>
              }
              amount={formatMinusWon(clawback.amount)}
            />
          ))}
          {b.clawbacks.length > 0 && (
            <TotalRow label="이번 지급액" amount={b.brandPayoutAmount} />
          )}
        </tbody>
      </table>
      <Note>
        간이과세자·면세사업자 브랜드는{" "}
        <B>부가세 매입세액 공제가 제한될 수 있습니다.</B> 사업자 구분은 기본정보
        관리 › 사업자·정산 정보 기준입니다.
      </Note>
    </Sec>
  )
}

const PAYEE_NAME: Record<SettlementPayout["payee"], string> = {
  BRAND: "브랜드",
  CREATOR: "인플루언서",
  PLATFORM: "플랫폼",
}

/** 아직 지급 일정이 서지 않은 상태 — 회색으로 낮춘다 */
const MUTED_PAYOUT: Array<PayoutStatus> = [
  "WAITING",
  "HELD",
  "BLOCKED",
  "NOT_APPLICABLE",
]

/** 「10.12 지급 예정」 · 「10.07 지급 완료」 — 날짜가 없으면 서버 라벨만 */
function payoutStatusText(payout: SettlementPayout) {
  if (payout.status === "PAID" && payout.paidAt) {
    return `${formatMonthDay(payout.paidAt)} ${payout.statusLabel}`
  }
  if (
    (payout.status === "SCHEDULED" || payout.status === "REQUESTED") &&
    payout.dueDate
  ) {
    return `${formatMonthDay(payout.dueDate)} ${payout.statusLabel}`
  }
  return payout.statusLabel
}

/**
 * 3자 분배 — 플랫폼이 대금을 보관했다 나눠주는 구조가 아니라 **PG가 각 수령자에게 직접 지급**한다.
 * 리워드는 SHOWROOMZ 명의로 지급된다. 서버는 확정 전(정산 확인 중 · 조정 협의)에 분배를 내리지 않는다 —
 * 그때는 값 대신 안내만 둔다(조정 협의 중에는 모든 몫이 보류).
 */
export function DistributionCard({ detail }: Props) {
  const payouts = detail.payouts
  if (isBeforeConfirm(detail) || !payouts) {
    return (
      <Sec title="3자 분배 내역" note="정산 확정 후 표시" className="mb-0">
        <SecEmpty>
          {detail.status === "ADJUSTING"
            ? "조정 협의 중에는 모든 몫이 보류됩니다. 합의 또는 기한 만료로 정산이 확정되면 수령자별 지급 내역이 표시됩니다."
            : "정산이 확정되면 수령자별 지급 내역이 표시됩니다."}{" "}
          소비자 결제 금액은 PG사에서 각 수령자에게 직접 분배되며, 인플루언서
          리워드는 SHOWROOMZ 명의로 지급됩니다.
        </SecEmpty>
      </Sec>
    )
  }

  const b = detail.breakdown
  const platformFeeNote =
    b.platformFee.amount === 0
      ? "플랫폼 수수료 0원(베타)"
      : `플랫폼 수수료 ${formatWon(b.platformFee.amount)} 포함`

  return (
    <Sec title="3자 분배 내역" note="PG 직접 지급" className="mb-0">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <td className={cn(LTAB_HEAD, "w-[110px]")}>수령자</td>
            <td className={cn(LTAB_HEAD, "w-[130px] text-right")}>지급 금액</td>
            <td className={cn(LTAB_HEAD, "text-center")}>지급 상태</td>
          </tr>
        </thead>
        <tbody className="[&>tr:first-child>td]:border-t-0">
          {payouts.map(payout => {
            const brand = payout.payee === "BRAND"
            return (
              <tr key={payout.payee}>
                <td className={LTAB_CELL}>
                  {PAYEE_NAME[payout.payee]}
                  {payout.label !== PAYEE_NAME[payout.payee] && (
                    <MNote>{payout.label}</MNote>
                  )}
                </td>
                <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                  {brand ? (
                    <b>
                      {formatWon(payout.amount)}
                      {b.brandClawbackAmount > 0 && (
                        <MNote>
                          차감 {formatWon(b.brandClawbackAmount)} 반영
                        </MNote>
                      )}
                    </b>
                  ) : (
                    formatWon(payout.amount)
                  )}
                  {payout.note && <MNote>{payout.note}</MNote>}
                  {payout.payee === "PLATFORM" && (
                    <MNote>{platformFeeNote}</MNote>
                  )}
                </td>
                <td
                  className={cn(
                    LTAB_CELL,
                    "text-center",
                    MUTED_PAYOUT.includes(payout.status) && "text-sz-n-500"
                  )}
                >
                  {payoutStatusText(payout)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Note>
        소비자 결제 금액은 <B>PG사에서 각 수령자에게 직접 분배</B>됩니다.
        인플루언서 리워드는 <B>SHOWROOMZ 명의로 지급</B>되며, 리워드 부가세와
        원천징수액은 플랫폼이 신고·납부합니다.{" "}
        <B>PG 결제 수수료는 PG사가 결제금에서 먼저 차감</B>한 뒤 남은 금액을
        분배합니다.
      </Note>
    </Sec>
  )
}

/** 지급 정보 — 확정 전 null. 지시 후엔 지급 시점 계좌 스냅샷, 지시 전엔 현재 등록 계좌 */
export function PayoutInfoCard({ detail }: Props) {
  const info = detail.payment
  if (isBeforeConfirm(detail) || !info) {
    return (
      <Sec title="지급 정보" className="mb-0">
        <SecEmpty>
          {detail.status === "ADJUSTING"
            ? "조정 협의가 끝나 정산이 확정되면 지급 예정일과 입금 계좌가 표시됩니다."
            : "정산이 확정되면 지급 예정일과 입금 계좌가 표시됩니다."}
        </SecEmpty>
      </Sec>
    )
  }

  const hasAccount = !!info.bankName && !!info.accountMasked

  return (
    <Sec title="지급 정보" className="mb-0">
      <ReadRow
        label="입금 계좌"
        first
        sub={
          <>
            {info.accountHolder && <>예금주 {info.accountHolder} · </>}
            <Link
              to={SETTLEMENT_ACCOUNT_PATH}
              className="text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
            >
              입금 계좌 변경은 기본정보 관리에서
            </Link>
          </>
        }
      >
        {hasAccount
          ? `${info.bankName} ${info.accountMasked}`
          : "등록된 계좌 없음"}
      </ReadRow>
      <ReadRow label="지급 예정일">
        {formatMonthDay(info.payoutDueDate)}
      </ReadRow>
      <ReadRow label="실지급일">{formatMonthDay(info.paidAt)}</ReadRow>
      <ReadRow label="PG 거래 참조번호" muted={!info.pgReference}>
        {info.pgReference ?? (info.paidAt ? "—" : "지급 시 부여")}
      </ReadRow>
    </Sec>
  )
}

/**
 * SHOWROOMZ 발행 세금계산서 — 브랜드가 받는 증빙은 브랜드 세금계산서 1장(+ 차감이 있으면 수정세금계산서).
 * 확정 시 생기므로 확정 전에는 안내만 둔다. 【MVP】 운영팀이 홈택스에서 발행하고 발행본을 올리면
 * [다운로드]가 열린다(`downloadable`). 인플루언서 세무는 플랫폼이 처리하므로 표시만 한다.
 */
export function TaxInvoiceCard(
  props: Props & {
    downloadingId: number | null
    onDownload: (document: SettlementTaxDocument) => void
  }
) {
  const { detail, downloadingId, onDownload } = props
  const documents = detail.taxDocuments

  return (
    <Sec
      title="SHOWROOMZ 발행 세금계산서"
      note="정산 1건당 1장 · 공급가액 = 리워드 + 플랫폼 수수료"
    >
      {documents === null ? (
        <SecEmpty>
          {detail.status === "ADJUSTING"
            ? "합의·확정 후 세금계산서가 생성되고, 확정일이 속한 달의 다음 달 10일까지 발행됩니다."
            : "정산이 확정되면 세금계산서가 생성되고, 확정일이 속한 달의 다음 달 10일까지 발행됩니다."}
        </SecEmpty>
      ) : (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <td className={cn(LTAB_HEAD, "w-[150px]")}>공급가액</td>
              <td className={cn(LTAB_HEAD, "w-[120px] text-right")}>부가세</td>
              <td className={cn(LTAB_HEAD, "w-[120px]")}>발행일</td>
              <td className={cn(LTAB_HEAD, "w-[200px]")}>승인번호</td>
              <td className={LTAB_HEAD}>상태</td>
              <td className={cn(LTAB_HEAD, "w-[120px]")}>관리</td>
            </tr>
          </thead>
          <tbody className="[&>tr:first-child>td]:border-t-0">
            {documents.map(document => {
              const issued = document.status === "ISSUED"
              return (
                <tr key={document.documentId}>
                  <td className={cn(LTAB_CELL, "tabular-nums")}>
                    {formatWon(document.supplyAmount)}
                    {document.type !== "BRAND_TAX_INVOICE" && (
                      <MNote>{document.typeLabel}</MNote>
                    )}
                  </td>
                  <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                    {formatWon(document.vatAmount)}
                  </td>
                  <td className={cn(LTAB_CELL, "tabular-nums")}>
                    {issued ? formatFullDate(document.issuedDate) : "—"}
                  </td>
                  <td className={cn(LTAB_CELL, "tabular-nums")}>
                    {issued ? (document.approvalNumber ?? "—") : "—"}
                  </td>
                  <td className={LTAB_CELL}>
                    <StatusBadge
                      variant={TAX_DOCUMENT_STATUS_VARIANT[document.status]}
                    >
                      {TAX_DOCUMENT_STATUS_LABEL[document.status]}
                    </StatusBadge>
                    {!issued && document.dueDate && (
                      <MNote>
                        운영팀이 {formatFullDate(document.dueDate)}까지
                        발행합니다
                      </MNote>
                    )}
                  </td>
                  <td className={LTAB_CELL}>
                    <ActBtn
                      disabled={
                        !document.downloadable ||
                        downloadingId === document.documentId
                      }
                      onClick={() => onDownload(document)}
                    >
                      다운로드
                    </ActBtn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <Note>
        세금계산서는 <B>운영팀이 홈택스에서 발행</B>하고 발행본을 업로드하면
        [다운로드]가 열립니다. 홈택스 발행 시 <B>세금계산서 수신 이메일</B>로도
        발송됩니다. 발행 기한은 공급일(정산 확정일)이 속한 달의{" "}
        <B>다음 달 10일</B>입니다. 일반과세 브랜드는 이 부가세를{" "}
        <B>매입세액으로 공제</B>받을 수 있습니다.
      </Note>
      <ReadRow
        label="인플루언서 세무"
        className="mt-3"
        sub="플랫폼이 처리합니다 — 브랜드가 챙길 인플루언서 증빙은 없습니다"
      >
        {detail.influencerTax.label}
      </ReadRow>
    </Sec>
  )
}

/**
 * 반품·교환 배송비(§43-4) — 주문 결제금과 별도 결제라 분해 표·정산 반영액에 넣지 않는다.
 * 서버는 부담 주체별 합계(소비자 · 브랜드)만 내린다. 사유 칸은 부담 주체를 가르는 규칙(아래 안내문과 같은
 * 기준)을 적는다.
 */
export function ShippingFeeCard({ detail }: Props) {
  const { consumer, brand } = detail.claimShipping
  const rows = [
    {
      key: "CONSUMER",
      label: "소비자",
      note: "신청 시 인앱 결제",
      reason: "단순변심 등",
      fee: consumer,
      result: "브랜드 수취",
      resultNote: "회수 택배비를 브랜드가 지출했으므로",
      muted: false,
    },
    {
      key: "BRAND",
      label: "브랜드",
      note: "회수·재발송 비용 부담",
      reason: "불량·오배송 등",
      fee: brand,
      result: "정산 대상 아님",
      resultNote: "성과 관리의 원가(배송비)에서 처리",
      muted: true,
    },
  ]

  return (
    <Sec
      title="반품 · 교환 배송비"
      note="별도 결제 · 정산 반영액에 포함되지 않음"
    >
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <td className={cn(LTAB_HEAD, "w-[210px]")}>부담 주체</td>
            <td className={cn(LTAB_HEAD, "w-[150px]")}>사유</td>
            <td className={cn(LTAB_HEAD, "w-[90px] text-right")}>건수</td>
            <td className={cn(LTAB_HEAD, "w-[130px] text-right")}>금액</td>
            <td className={LTAB_HEAD}>정산 처리</td>
          </tr>
        </thead>
        <tbody className="[&>tr:first-child>td]:border-t-0">
          {rows.map(row => (
            <tr key={row.key} className={cn(row.muted && "text-sz-n-500")}>
              <td className={LTAB_CELL}>
                {row.label}
                <MNote>{row.note}</MNote>
              </td>
              <td className={LTAB_CELL}>{row.reason}</td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {row.fee.count}건
              </td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {formatWon(row.fee.amount)}
              </td>
              <td className={LTAB_CELL}>
                {row.result} <MNote>{row.resultNote}</MNote>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        반품·교환 배송비는 <B>주문 결제금과 별도로 결제</B>되므로 위 정산 금액
        분해와 주문 명세의 <B>정산 반영액에는 포함되지 않습니다.</B> 부담 주체는{" "}
        <B>사유에 따라 갈립니다</B> — 단순변심은 소비자, 불량·오배송은
        브랜드입니다(기본정보 관리의 배송·반품 정책 기준).{" "}
        <WaitTag>[미정]</WaitTag> 반품비·교환비 금액 산정(왕복 전액 vs 회수
        편도) 확정 대기.
      </Note>
    </Sec>
  )
}

/**
 * 정산 명세 — 주문 단위 미리보기 5건(상세 응답). 나머지는 [전체 N건 보기]로 펼쳐 `GET /{id}/items`를
 * 페이지 단위로 읽는다(확정 전에도 열린다). 파일 다운로드는 확정 후만.
 */
export function StatementCard(
  props: Props & { isDownloading: boolean; onDownload: () => void }
) {
  const { detail, isDownloading, onDownload } = props
  const canDownload = detail.actions.canDownloadStatement
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const { data: itemPage, isFetching } = useGetSettlementItems(
    detail.settlementId,
    { page, size: STATEMENT_PAGE_SIZE },
    expanded
  )
  const pageInfo = usePaginationInfo({
    data: itemPage?.pageInfo,
    onPageChange: setPage,
  })
  const rows = expanded ? (itemPage?.content ?? []) : detail.items
  const hasMore = detail.itemTotalCount > detail.items.length

  return (
    <Sec
      title="정산 명세"
      note={
        canDownload
          ? `주문 단위 · 전체 ${detail.itemTotalCount.toLocaleString("ko-KR")}건`
          : "확정 후 다운로드"
      }
    >
      <table className="w-full table-fixed border-collapse text-[12px]">
        <thead>
          <tr>
            <td className={cn(LTAB_HEAD, "w-[124px]")}>주문번호</td>
            <td className={cn(LTAB_HEAD, "w-[70px]")}>소비자</td>
            <td className={LTAB_HEAD}>상품 · 옵션</td>
            <td className={cn(LTAB_HEAD, "w-[56px] text-right")}>수량</td>
            <td className={cn(LTAB_HEAD, "w-[104px] text-right")}>결제금액</td>
            <td className={cn(LTAB_HEAD, "w-[82px]")}>상태</td>
            <td className={cn(LTAB_HEAD, "w-[116px] text-right")}>
              정산 반영액
            </td>
          </tr>
        </thead>
        <tbody className="[&>tr:first-child>td]:border-t-0">
          {expanded && !itemPage ? (
            <tr>
              <td colSpan={7} className={cn(LTAB_CELL, "py-6")}>
                <Loader2 className="mx-auto size-4 animate-spin text-sz-n-400" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className={cn(LTAB_CELL, "py-6 text-center text-sz-n-500")}
              >
                명세 항목이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((line, index) => (
              <StatementRow
                key={`${line.subOrderNumber ?? line.orderNumber}-${index}`}
                line={line}
              />
            ))
          )}
        </tbody>
      </table>
      {expanded && pageInfo.totalPages > 1 && (
        <div
          className={cn("mt-3 flex justify-center", isFetching && "opacity-60")}
        >
          <Pagination {...pageInfo} />
        </div>
      )}
      <div className="mt-3 flex items-center gap-2.5">
        <span className="flex-1 text-[11px] text-sz-n-500">
          취소·반품 건은 정산 반영액이 <B>0원</B>으로 표시됩니다.
          {!canDownload && (
            <>
              {" "}
              <B>정산 확정 후 받을 수 있습니다.</B>
            </>
          )}
        </span>
        {hasMore && (
          <Btn
            variant="secondary"
            onClick={() => {
              setExpanded(prev => !prev)
              setPage(1)
            }}
          >
            {expanded
              ? "미리보기로 접기"
              : `전체 ${detail.itemTotalCount.toLocaleString("ko-KR")}건 보기`}
          </Btn>
        )}
        <Btn
          variant="secondary"
          disabled={!canDownload}
          isLoading={isDownloading}
          onClick={onDownload}
        >
          전체 명세 다운로드
        </Btn>
      </div>
    </Sec>
  )
}

function StatementRow({ line }: { line: SettlementItem }) {
  const partial = line.status === "PARTIAL_RETURNED"
  return (
    <tr className={cn(line.status !== "CONFIRMED" && "text-sz-n-500")}>
      <td className={cn(LTAB_CELL, "tabular-nums")}>{line.orderNumber}</td>
      <td className={LTAB_CELL}>{line.consumerNameMasked}</td>
      <td className={cn(LTAB_CELL, "truncate")}>
        {line.optionName
          ? `${line.productName} · ${line.optionName}`
          : line.productName}
      </td>
      <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
        {line.quantity}
        {partial && (
          <MNote>
            확정 {line.settledQuantity}/{line.quantity}
          </MNote>
        )}
      </td>
      <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
        {formatWon(line.paidAmount)}
      </td>
      <td className={LTAB_CELL}>{line.statusLabel}</td>
      <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
        {formatWon(line.settledAmount)}
      </td>
    </tr>
  )
}
