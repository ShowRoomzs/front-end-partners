import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  ActBtn,
  LTAB_CELL,
  LTAB_HEAD,
  MNote,
  Note,
  ReadRow,
  Sec,
  SecEmpty,
  WaitTag,
} from "@/features/settlement/components/detail/DetailParts"
import {
  SETTLEMENT_ACCOUNT_PATH,
  STATEMENT_LINE_LABEL,
  TAX_INVOICE_STATUS_LABEL,
  TAX_INVOICE_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import type {
  SettlementDetail,
  SettlementShippingFee,
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
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

type Props = { detail: SettlementDetail }

const B = ({ children }: { children: ReactNode }) => (
  <b className="font-semibold">{children}</b>
)

/** 「자동 확정 10.06 + 3영업일 · 10.09 한글날 제외」 — 날짜만 있으면 왜 그 날인지 알 수 없다 */
function payoutBasis(detail: SettlementDetail) {
  const holidays = detail.excludedHolidays
    .map(holiday => ` · ${formatMonthDay(holiday.date)} ${holiday.name} 제외`)
    .join("")
  return `자동 확정 ${formatMonthDay(detail.autoConfirmedAt)} + ${detail.payoutBusinessDays}영업일${holidays}`
}

/** D-4 · 남은 영업일이 0이면 D-day */
function dDay(days: number) {
  return days > 0 ? `D-${days}` : "D-day"
}

/** 상단 요약 바 — 상태별 날짜 2개 + 정산 근거(또는 지급 보류) */
export function SummaryBar({ detail }: Props) {
  const items: Array<{ label: string; value: ReactNode; warn?: boolean }> =
    (() => {
      switch (detail.status) {
        case "REVIEWING":
          return [
            { label: "정산 생성", value: formatFullDate(detail.createdAt) },
            {
              label: "확인 기간",
              value: `~ ${formatMonthDayTime(detail.reviewDeadlineAt)}`,
            },
            {
              label: "자동 확정",
              value: formatMonthDay(detail.autoConfirmedAt),
            },
          ]
        case "ADJUSTING": {
          const adjustment = detail.adjustment
          return [
            {
              label: "조정 요청",
              value: formatFullDate(adjustment?.requestedAt ?? null),
            },
            {
              label: "합의 기한",
              value: adjustment
                ? `${formatMonthDay(adjustment.deadlineAt)} · ${dDay(adjustment.remainingBusinessDays)}`
                : "—",
              warn: true,
            },
            { label: "지급", value: "전액 보류", warn: true },
          ]
        }
        case "SCHEDULED":
          return [
            {
              label: "자동 확정",
              value: formatFullDate(detail.autoConfirmedAt),
            },
            {
              label: "지급 예정일",
              value: formatFullDate(detail.payoutInfo?.scheduledDate ?? null),
            },
            { label: "정산 근거", value: payoutBasis(detail) },
          ]
        case "PAID":
          return [
            {
              label: "자동 확정",
              value: formatFullDate(detail.autoConfirmedAt),
            },
            {
              label: "지급일",
              value: formatFullDate(detail.payoutInfo?.paidDate ?? null),
            },
            { label: "정산 근거", value: payoutBasis(detail) },
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
              "font-semibold tabular-nums",
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

const MTAB_CELL = "px-3 py-2.5"
const MTAB_AMOUNT = "px-3 py-2.5 text-right tabular-nums"

/** 시안 `.mtab tr.sub` — 보조 줄(`.mnote`)은 라벨 아래 블록으로 */
function SubRow(props: {
  label: ReactNode
  note?: ReactNode
  amount: ReactNode
}) {
  return (
    <tr className="text-sz-n-600">
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
    <tr className="border-t-[1.5px] border-sz-n-400 bg-sz-n-50 text-[16px] font-semibold text-sz-n-900">
      <td className={MTAB_CELL}>{props.label}</td>
      <td className={MTAB_AMOUNT}>{formatWon(props.amount)}</td>
    </tr>
  )
}

/**
 * D4 조정 내역 — 원래 → 요청 → 다른 금액 제안 → 진행. 협의는 이슈 스레드에서 양측이 직접 하고
 * 이 화면은 내역만 보여준다 — 동의·제안·반대 버튼을 두지 않는다(같은 행동이 두 화면에 있으면
 * 어느 쪽이 기록인지 흐려진다 · §43-3).
 */
export function AdjustmentCard(props: Props & { onOpenThread: () => void }) {
  const adjustment = props.detail.adjustment
  if (props.detail.status !== "ADJUSTING" || !adjustment) return null
  const mine = adjustment.turn === "MINE"

  return (
    <Sec
      title="조정 내역"
      tone="warning"
      note="이슈 스레드 진행 중 · 운영팀은 열람만 합니다"
    >
      <table className="w-full border-collapse text-[12px]">
        <tbody>
          <tr>
            <td className={MTAB_CELL}>
              원래 리워드
              <MNote>
                계약 리워드율 {formatPercent(props.detail.breakdown.rewardRate)}
              </MNote>
            </td>
            <td className={MTAB_AMOUNT}>
              {formatWon(adjustment.originalReward)}
            </td>
          </tr>
          {adjustment.proposals.map((proposal, index) => (
            <SubRow
              key={proposal.seq}
              label={index === 0 ? "조정 요청" : "다른 금액 제안"}
              note={[
                proposal.byName,
                formatMonthDay(proposal.at),
                proposal.reason,
              ]
                .filter(Boolean)
                .join(" · ")}
              amount={formatWon(proposal.rewardAmount)}
            />
          ))}
          <tr>
            <td className={MTAB_CELL}>진행</td>
            <td
              className={cn(
                MTAB_AMOUNT,
                mine ? "text-sz-warning-text" : "text-sz-info-text"
              )}
            >
              {mine ? "내 응답 대기" : "상대 응답 대기"}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="flex-1 text-[11px] text-sz-n-500">
          합의되면 금액이 바로 반영되고 지급 예정으로 넘어갑니다.{" "}
          {formatMonthDay(adjustment.deadlineAt)}까지 합의가 없으면 원래 금액(
          {formatWon(adjustment.originalReward)})으로 확정됩니다.
        </span>
        <Btn variant="primary" onClick={props.onOpenThread}>
          이슈 스레드 열기
        </Btn>
      </div>
    </Sec>
  )
}

/**
 * 정산 금액 분해(§41-4 브랜드 축) — 계산 순서 그대로 세로로. 소계(확정 거래액)와 총계(내 수취액)를
 * 가른다. PG 결제 수수료는 PG사가 먼저 떼므로 리워드보다 위, 플랫폼 수수료는 베타 0%라도 행을 남긴다.
 * 정산은 금액이 확정된 뒤에만 생기므로 「예정」 표시가 없다. 이전 정산 뒤 환불분은 「차감 반영」 행으로
 * 빼고 「이번 지급액」을 따로 적는다.
 */
export function BreakdownCard({ detail }: Props) {
  const b = detail.breakdown
  const reviewing = detail.status === "REVIEWING"

  return (
    <Sec
      title="정산 금액 분해"
      note={
        reviewing ? "확정 금액 · 조정 요청이 없으면 이 금액으로 지급" : "확정"
      }
    >
      <table className="w-full border-collapse text-[12px]">
        <tbody>
          <tr>
            <td className={MTAB_CELL}>총 주문 금액</td>
            <td className={MTAB_AMOUNT}>{formatWon(b.totalOrderAmount)}</td>
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
          <tr className="border-t border-sz-n-300 bg-sz-n-50 font-semibold">
            <td className={MTAB_CELL}>확정 거래액</td>
            <td className={MTAB_AMOUNT}>{formatWon(b.confirmedSales)}</td>
          </tr>
          <SubRow
            label="플랫폼 수수료"
            amount={formatMinusWon(b.platformFee)}
          />
          <SubRow
            label="PG 결제 수수료"
            note={
              <>
                카드·간편결제 {formatRate(b.pgFeeRate)}%{" "}
                <WaitTag>[자문대기-PG]</WaitTag> 요율 확정 대기
              </>
            }
            amount={formatMinusWon(b.pgFee)}
          />
          <SubRow label="인플루언서 리워드" amount={formatMinusWon(b.reward)} />
          <SubRow
            label="리워드 부가세"
            note={`${formatPercent(b.rewardVatRate)} · 별도 · SHOWROOMZ 세금계산서 발행분`}
            amount={formatMinusWon(b.rewardVat)}
          />
          <SubRow
            label="재발송비"
            note={`교환·반려 재발송 · 브랜드 수취액에만 가산 · 리워드 기준 판매금액에 포함하지 않음${b.reshipFee === 0 ? " · 이 공구 해당 없음" : ""}`}
            amount={formatPlusWon(b.reshipFee)}
          />
          <TotalRow label="내 수취액" amount={b.brandReceivable} />
          {b.deductions.map(deduction => (
            <SubRow
              key={deduction.orderNumber}
              label="차감 반영"
              note={
                <>
                  {deduction.orderNumber} · {deduction.sourceGroupBuyTitle} ·{" "}
                  {deduction.reason} ·{" "}
                  <B>
                    수정세금계산서{" "}
                    {TAX_INVOICE_STATUS_LABEL[deduction.revisedInvoiceStatus]}
                  </B>
                </>
              }
              amount={formatMinusWon(deduction.amount)}
            />
          ))}
          {b.deductions.length > 0 && (
            <TotalRow label="이번 지급액" amount={b.payoutAmount} />
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

/**
 * 3자 분배 — 플랫폼이 대금을 보관했다 나눠주는 구조가 아니라 **PG가 각 수령자에게 직접 지급**한다.
 * 리워드는 SHOWROOMZ 명의로 지급된다. 정산 확인 중에는 일정·계좌가 정해지지 않아 값 대신 안내만,
 * 조정 협의 중에는 모든 몫이 「보류 중」(차액 선지급 없음).
 */
export function DistributionCard({ detail }: Props) {
  const dist = detail.distribution
  if (detail.status === "REVIEWING" || !dist) {
    return (
      <Sec title="3자 분배 내역" note="정산 확정 후 표시" className="mb-0">
        <SecEmpty>
          정산이 확정되면 수령자별 지급 내역이 표시됩니다. 소비자 결제 금액은
          PG사에서 각 수령자에게 직접 분배되며, 인플루언서 리워드는 SHOWROOMZ
          명의로 지급됩니다.
        </SecEmpty>
      </Sec>
    )
  }

  const b = detail.breakdown
  const held = detail.status === "ADJUSTING"
  const statusText = held
    ? "보류 중"
    : detail.status === "PAID"
      ? `${formatMonthDay(detail.payoutInfo?.paidDate ?? null)} 지급 완료`
      : `${formatMonthDay(detail.payoutInfo?.scheduledDate ?? null)} 지급 예정`
  const statusClass = cn(LTAB_CELL, "text-center", held && "text-sz-n-500")
  const deducted = b.deductions.reduce((sum, d) => sum + d.amount, 0)
  const platformFeeNote =
    b.platformFee === 0
      ? "플랫폼 수수료 0원(베타)"
      : `플랫폼 수수료 ${formatWon(b.platformFee)} 포함`

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
          <tr>
            <td className={LTAB_CELL}>
              브랜드
              <MNote>우리</MNote>
            </td>
            <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
              <b className="font-semibold">
                {formatWon(b.payoutAmount)}
                {deducted > 0 && <MNote>차감 {formatWon(deducted)} 반영</MNote>}
              </b>
            </td>
            <td className={statusClass}>{statusText}</td>
          </tr>
          <tr>
            <td className={LTAB_CELL}>
              인플루언서
              <MNote>{detail.creatorShowroomName}</MNote>
            </td>
            <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
              {formatWon(dist.creatorNetAmount)}
              <MNote>
                {dist.creatorIsBusiness
                  ? `사업자 · 원천징수 없음 · 부가세 포함 지급(리워드 ${b.reward.toLocaleString("ko-KR")} + 부가세 ${b.rewardVat.toLocaleString("ko-KR")})`
                  : `리워드 ${formatWon(b.reward)} − 원천징수 ${formatWon(dist.withholdingAmount)} (${formatPercent(detail.creatorTax.withholdingRate)})`}
              </MNote>
            </td>
            <td className={statusClass}>{statusText}</td>
          </tr>
          <tr>
            <td className={LTAB_CELL}>플랫폼</td>
            <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
              {formatWon(dist.platformAmount)}
            </td>
            <td className={LTAB_CELL}>
              {dist.creatorIsBusiness
                ? "사업자 건 · 부가세는 인플루언서에게 지급"
                : "리워드 부가세 · 플랫폼 신고·납부"}{" "}
              <MNote>
                {held && !dist.creatorIsBusiness
                  ? "보류 중 · 합의 후 확정"
                  : platformFeeNote}
              </MNote>
            </td>
          </tr>
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

export function PayoutInfoCard({ detail }: Props) {
  const info = detail.payoutInfo
  if (detail.status === "REVIEWING" || !info) {
    return (
      <Sec title="지급 정보" className="mb-0">
        <SecEmpty>
          정산이 확정되면 지급 예정일과 입금 계좌가 표시됩니다.
        </SecEmpty>
      </Sec>
    )
  }

  const held = detail.status === "ADJUSTING"

  return (
    <Sec title="지급 정보" className="mb-0">
      <ReadRow
        label="입금 계좌"
        first
        sub={
          <>
            예금주 {info.accountHolder} ·{" "}
            <Link
              to={SETTLEMENT_ACCOUNT_PATH}
              className="text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
            >
              입금 계좌 변경은 기본정보 관리에서
            </Link>
          </>
        }
      >
        {info.bankName} {info.maskedAccountNumber}
      </ReadRow>
      <ReadRow label="지급 예정일" muted={held}>
        {info.scheduledDate
          ? formatMonthDay(info.scheduledDate)
          : held
            ? "보류 해제 후 결정"
            : "—"}
      </ReadRow>
      <ReadRow label="실지급일" muted={held}>
        {info.paidDate ? formatMonthDay(info.paidDate) : "—"}
      </ReadRow>
      <ReadRow label="PG 거래 참조번호" muted={held}>
        {info.pgReference ?? (held ? "지급 시 부여" : "—")}
      </ReadRow>
    </Sec>
  )
}

/**
 * SHOWROOMZ 발행 세금계산서 — 브랜드가 받는 증빙은 언제나 이 1장이다(사업자 인플루언서 건도 같다).
 * 【MVP】 운영팀이 홈택스에서 발행하고 발행본을 올리면 [다운로드]가 열린다. 인플루언서 세무
 * (원천징수 · 세금계산서 수취)는 플랫폼이 처리하므로 표시만 한다.
 */
export function TaxInvoiceCard(
  props: Props & { onDownload: (label: string) => void }
) {
  const { detail, onDownload } = props
  const invoice = detail.taxInvoice
  const issued = invoice.status === "ISSUED"
  const waitingNote = invoice.dueDate
    ? `운영팀이 ${formatFullDate(invoice.dueDate)}까지 발행합니다`
    : detail.status === "ADJUSTING"
      ? "합의·확정 후 다음 달 10일까지 발행"
      : "정산 확정 후 다음 달 10일까지 발행"
  const tax = detail.creatorTax

  return (
    <Sec
      title="SHOWROOMZ 발행 세금계산서"
      note="정산 1건당 1장 · 공급가액 = 리워드 + 플랫폼 수수료"
    >
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
          <tr>
            <td className={cn(LTAB_CELL, "tabular-nums")}>
              {formatWon(invoice.supplyAmount)}
            </td>
            <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
              {formatWon(invoice.vatAmount)}
            </td>
            <td className={cn(LTAB_CELL, "tabular-nums")}>
              {issued ? formatFullDate(invoice.issuedAt) : "—"}
            </td>
            <td className={cn(LTAB_CELL, "tabular-nums")}>
              {issued ? (invoice.approvalNumber ?? "—") : "—"}
            </td>
            <td className={LTAB_CELL}>
              <StatusBadge variant={TAX_INVOICE_STATUS_VARIANT[invoice.status]}>
                {TAX_INVOICE_STATUS_LABEL[invoice.status]}
              </StatusBadge>
              {!issued && <MNote>{waitingNote}</MNote>}
            </td>
            <td className={LTAB_CELL}>
              <ActBtn
                disabled={!issued}
                onClick={() => onDownload("세금계산서")}
              >
                다운로드
              </ActBtn>
            </td>
          </tr>
        </tbody>
      </table>
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
        {tax.isBusiness
          ? "사업자 · 세금계산서 플랫폼 수취"
          : `비사업자 · 원천징수 ${formatPercent(tax.withholdingRate)} · 플랫폼 신고`}
      </ReadRow>
    </Sec>
  )
}

const PAYER_TEXT: Record<
  SettlementShippingFee["payer"],
  { label: string; note: string; result: string; resultNote: string }
> = {
  CONSUMER: {
    label: "소비자",
    note: "신청 시 인앱 결제",
    result: "브랜드 수취",
    resultNote: "회수 택배비를 브랜드가 지출했으므로",
  },
  BRAND: {
    label: "브랜드",
    note: "회수·재발송 비용 부담",
    result: "정산 대상 아님",
    resultNote: "성과 관리의 원가(배송비)에서 처리",
  },
  UNDECIDED: {
    label: "판정 대기",
    note: "검수 전",
    result: "검수 후 부담 주체가 결정됩니다",
    resultNote: "단순변심이면 소비자, 불량·오배송이면 브랜드",
  },
}

/** 반품·교환 배송비(§43-4) — 주문 결제금과 별도 결제라 분해 표·정산 반영액에 넣지 않는다 */
export function ShippingFeeCard({ detail }: Props) {
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
          {detail.shippingFees.map(fee => {
            const text = PAYER_TEXT[fee.payer]
            return (
              <tr
                key={fee.payer}
                className={cn(fee.payer !== "CONSUMER" && "text-sz-n-500")}
              >
                <td className={LTAB_CELL}>
                  {text.label}
                  <MNote>{text.note}</MNote>
                </td>
                <td className={LTAB_CELL}>{fee.reasonLabel}</td>
                <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                  {fee.count}건
                </td>
                <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                  {fee.amount === null ? "—" : formatWon(fee.amount)}
                </td>
                <td className={LTAB_CELL}>
                  {text.result} <MNote>{text.resultNote}</MNote>
                </td>
              </tr>
            )
          })}
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

/** 정산 명세 — 주문 단위 미리보기 5건. 정산 확인 중에는 자동 확정 후에 파일을 받는다 */
export function StatementCard(props: Props & { onDownload: () => void }) {
  const { detail, onDownload } = props
  const reviewing = detail.status === "REVIEWING"

  return (
    <Sec
      title="정산 명세"
      note={
        reviewing
          ? "확정 후 다운로드"
          : `주문 단위 · 미리보기 ${detail.statementPreview.length}건`
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
          {detail.statementPreview.map(line => (
            <tr
              key={line.orderNumber}
              className={cn(line.status !== "CONFIRMED" && "text-sz-n-500")}
            >
              <td className={cn(LTAB_CELL, "tabular-nums")}>
                {line.orderNumber}
              </td>
              <td className={LTAB_CELL}>{line.consumerName}</td>
              <td className={cn(LTAB_CELL, "truncate")}>
                {line.productOption}
              </td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {line.quantity}
              </td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {formatWon(line.paidAmount)}
              </td>
              <td className={LTAB_CELL}>{STATEMENT_LINE_LABEL[line.status]}</td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {line.reflectedAmount === null
                  ? "미확정"
                  : formatWon(line.reflectedAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="flex-1 text-[11px] text-sz-n-500">
          취소·반품 건은 정산 반영액이 <B>0원</B>으로 표시됩니다.
          {reviewing && (
            <>
              {" "}
              <B>자동 확정 후 받을 수 있습니다.</B>
            </>
          )}
        </span>
        <Btn variant="secondary" disabled={reviewing} onClick={onDownload}>
          전체 명세 다운로드
        </Btn>
      </div>
    </Sec>
  )
}
