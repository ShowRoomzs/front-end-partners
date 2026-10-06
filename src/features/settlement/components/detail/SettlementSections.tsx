import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  ActBtn,
  LTAB_CELL,
  LTAB_HEAD,
  MNote,
  Note,
  PlanBadge,
  ReadRow,
  Sec,
  SecEmpty,
  WaitTag,
} from "@/features/settlement/components/detail/DetailParts"
import {
  SETTLEMENT_ACCOUNT_PATH,
  STATEMENT_LINE_LABEL,
} from "@/features/settlement/constants/params"
import type {
  SettlementDetail,
  SettlementShippingFee,
} from "@/features/settlement/types"
import {
  formatFullDate,
  formatMinusWon,
  formatMonthDay,
  formatPlusWon,
  formatRate,
  formatWon,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

type Props = { detail: SettlementDetail }

const isPending = (detail: SettlementDetail) => detail.status === "PENDING"

/** 상단 요약 바 — 날짜만 있으면 왜 그 날인지 알 수 없어 정산 근거를 함께 적는다 */
export function SummaryBar({ detail }: Props) {
  const pending = isPending(detail)
  const lag = detail.settlementLagDays
  const payoutDate =
    detail.status === "PAID"
      ? detail.payoutInfo?.paidDate
      : detail.payoutInfo?.scheduledDate

  return (
    <Sec bodyClassName="flex flex-wrap items-center gap-6 px-4 py-3">
      <SummaryItem label="정산 확정일">
        {pending ? (
          <b className="font-semibold text-sz-n-500">미확정</b>
        ) : (
          <b className="font-semibold text-sz-n-900 tabular-nums">
            {formatFullDate(detail.confirmedAt)}
          </b>
        )}
      </SummaryItem>
      <SummaryItem label="지급일">
        {pending ? (
          <b className="font-semibold text-sz-n-500">미정</b>
        ) : detail.status === "ON_HOLD" ? (
          <b className="font-semibold text-sz-warning-text">보류 중</b>
        ) : (
          <b className="font-semibold text-sz-n-900 tabular-nums">
            {formatFullDate(payoutDate ?? null)}
            {detail.status === "CONFIRMED" && " 예정"}
          </b>
        )}
      </SummaryItem>
      <SummaryItem label="정산 근거">
        <b className="font-semibold text-sz-n-900">
          {detail.lastPurchaseConfirmedAt
            ? `마지막 구매확정 ${formatMonthDay(detail.lastPurchaseConfirmedAt)} + ${lag}일`
            : `마지막 구매확정 + ${lag}일`}
        </b>
      </SummaryItem>
    </Sec>
  )
}

function SummaryItem(props: { label: string; children: ReactNode }) {
  return (
    <span className="text-[12px] text-sz-n-600">
      {props.label} {props.children}
    </span>
  )
}

/** D4 — 왜 멈췄고 무엇이 풀려야 지급되는지. 해제는 운영자 소관이라 브랜드 액션은 [운영자 문의] 하나 */
export function HoldCard(props: Props & { onContactOperator: () => void }) {
  const hold = props.detail.hold
  if (!hold) return null

  return (
    <Sec
      title="보류 사유"
      tone="warning"
      note={`운영자 처리 · ${formatFullDate(hold.heldAt)} 보류`}
    >
      <ReadRow label="사유" first sub={hold.reasonDetail}>
        {hold.reason}
      </ReadRow>
      <ReadRow label="해제 조건" sub={hold.releaseDetail}>
        {hold.releaseCondition}
      </ReadRow>
      <ReadRow label="보류 대상">
        전액{" "}
        <span className="text-[11px] text-sz-n-500">
          {formatWon(hold.heldAmount)} · 부분 지급은 하지 않습니다
        </span>
      </ReadRow>
      <div className="mt-3 flex justify-end">
        <Btn variant="secondary" onClick={props.onContactOperator}>
          운영자 문의
        </Btn>
      </div>
    </Sec>
  )
}

const MTAB_CELL = "px-3 py-2.5"
const MTAB_AMOUNT = "px-3 py-2.5 text-right tabular-nums"

/**
 * 정산 금액 분해 — 계산 순서 그대로 세로로. 소계(확정 거래액)와 총계(내 수취액)를 가른다.
 * PG 결제 수수료는 PG사가 먼저 떼므로 리워드보다 위. 플랫폼 수수료는 베타 0%라도 행을 남긴다.
 * 정산 대기는 「예정」 배지 + 회색(미확정 금액은 값처럼 보이지 않게).
 */
export function BreakdownCard({ detail }: Props) {
  const b = detail.breakdown
  const pending = isPending(detail)
  const planValue = (value: ReactNode) => (
    <span className={pending ? "text-sz-n-500" : undefined}>{value}</span>
  )

  return (
    <Sec
      title="정산 금액 분해"
      note={pending ? "미확정 · 처리 결과에 따라 변동" : "확정"}
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
            note={
              b.return.processingCount > 0
                ? `${b.return.count}건 · 처리 중 ${b.return.processingCount}건 포함`
                : `${b.return.count}건`
            }
            amount={formatMinusWon(b.return.amount)}
          />
          <SubRow
            label="배송 예외 차감"
            note={`${b.deliveryException.count}건`}
            amount={formatMinusWon(b.deliveryException.amount)}
          />
          <tr className="border-t border-sz-n-300 bg-sz-n-50 font-semibold">
            <td className={MTAB_CELL}>
              확정 거래액
              {pending && <PlanBadge />}
            </td>
            <td className={MTAB_AMOUNT}>
              {planValue(formatWon(b.confirmedSales))}
            </td>
          </tr>
          <SubRow
            label="플랫폼 수수료"
            amount={formatMinusWon(b.platformFee)}
          />
          <SubRow
            label={
              <>
                PG 결제 수수료
                {pending && <PlanBadge />}
              </>
            }
            note={
              <>
                카드·간편결제 {formatRate(b.pgFeeRate)}%{" "}
                <WaitTag>[자문대기-PG]</WaitTag> 요율 확정 대기
              </>
            }
            amount={planValue(formatMinusWon(b.pgFee))}
          />
          <SubRow
            label={
              <>
                인플루언서 리워드
                {pending && <PlanBadge />}
              </>
            }
            amount={planValue(formatMinusWon(b.reward))}
          />
          <SubRow
            label="재발송비"
            note={`교환·반려 재발송 · 브랜드 수취액에만 가산 · 리워드 기준 판매금액에 포함하지 않음${b.reshipFee === 0 ? " · 이 공구 해당 없음" : ""}`}
            amount={planValue(formatPlusWon(b.reshipFee))}
          />
          <tr className="border-t-[1.5px] border-sz-n-400 bg-sz-n-50 text-[16px] font-semibold text-sz-n-900">
            <td className={MTAB_CELL}>
              내 수취액
              {pending && <PlanBadge />}
            </td>
            <td className={MTAB_AMOUNT}>{planValue(formatWon(b.payout))}</td>
          </tr>
        </tbody>
      </table>
    </Sec>
  )
}

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

/**
 * 3자 분배 — 플랫폼이 대금을 보관했다 나눠주는 구조가 아니라 **PG가 각 수령자에게 직접 지급**한다.
 * 정산 대기는 아직 돈이 움직이지 않았으므로 값 대신 안내만.
 */
export function DistributionCard({ detail }: Props) {
  if (isPending(detail) || !detail.withholding) {
    return (
      <Sec title="3자 분배 내역" note="정산 확정 후 표시" className="mb-0">
        <SecEmpty>
          정산이 확정되면 수령자별 지급 내역이 표시됩니다. 소비자 결제 금액은
          PG사에서 각 수령자에게 직접 지급됩니다.
        </SecEmpty>
      </Sec>
    )
  }

  const b = detail.breakdown
  const w = detail.withholding
  const statusText =
    detail.status === "PAID"
      ? `${formatMonthDay(detail.payoutInfo?.paidDate ?? null)} 지급 완료`
      : detail.status === "ON_HOLD"
        ? "보류 중"
        : `${formatMonthDay(detail.payoutInfo?.scheduledDate ?? null)} 지급 예정`
  const statusClass = cn(
    LTAB_CELL,
    "text-center",
    detail.status === "ON_HOLD" && "text-sz-n-500"
  )

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
              <b className="font-semibold">{formatWon(b.payout)}</b>
            </td>
            <td className={statusClass}>{statusText}</td>
          </tr>
          <tr>
            <td className={LTAB_CELL}>
              인플루언서
              <MNote>{detail.creatorShowroomName}</MNote>
            </td>
            <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
              {formatWon(w.creatorNetAmount)}
              <MNote>
                {w.creatorIsBusiness
                  ? "사업자 · 원천징수 없음"
                  : `리워드 ${formatWon(b.reward)} − 원천징수 ${formatWon(w.withholdingAmount)} (${w.withholdingRate}%)`}
              </MNote>
            </td>
            <td className={statusClass}>{statusText}</td>
          </tr>
          <tr>
            <td className={LTAB_CELL}>플랫폼</td>
            <td
              className={cn(
                LTAB_CELL,
                "text-right tabular-nums",
                b.platformFee === 0 && "text-sz-n-500"
              )}
            >
              {formatWon(b.platformFee)}
            </td>
            <td
              className={cn(
                LTAB_CELL,
                "text-center",
                b.platformFee === 0 && "text-sz-n-500"
              )}
            >
              {b.platformFee === 0 ? "베타 기간 수수료 0%" : statusText}
            </td>
          </tr>
        </tbody>
      </table>
      <Note>
        소비자 결제 금액은{" "}
        <b className="font-semibold">PG사에서 각 수령자에게 직접 지급</b>
        됩니다. 플랫폼이 대금을 보관했다가 나누어 지급하지 않습니다.{" "}
        <b className="font-semibold">
          PG 결제 수수료는 PG사가 결제금에서 먼저 차감
        </b>
        한 뒤 남은 금액을 분배합니다.
      </Note>
    </Sec>
  )
}

export function PayoutInfoCard({ detail }: Props) {
  const info = detail.payoutInfo
  if (isPending(detail) || !info) {
    return (
      <Sec title="지급 정보" className="mb-0">
        <SecEmpty>
          정산이 확정되면 지급 예정일과 입금 계좌가 표시됩니다.
        </SecEmpty>
      </Sec>
    )
  }

  const held = detail.status === "ON_HOLD"

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
      <ReadRow label="지급 예정일" muted={!info.scheduledDate}>
        {info.scheduledDate
          ? formatMonthDay(info.scheduledDate)
          : held
            ? "보류 해제 후 결정"
            : "—"}
      </ReadRow>
      <ReadRow label="실지급일" muted={!info.paidDate}>
        {info.paidDate ? formatMonthDay(info.paidDate) : "—"}
      </ReadRow>
      <ReadRow label="PG 거래 참조번호" muted={!info.pgReference}>
        {info.pgReference ?? "지급 시 부여"}
      </ReadRow>
    </Sec>
  )
}

/**
 * 세금계산서 · 원천징수 — 인플루언서가 비사업자면 3.3% 원천징수 + 원천징수영수증(D1),
 * 사업자면 전액 지급 + 세금계산서 수취(D3). 발행은 인플루언서 쪽 행위라 「수취 대기」(중립)만
 * 보여주고 재촉·발행 요청 액션을 두지 않는다.
 */
export function TaxCard(
  props: Props & { onDownload: (label: string) => void }
) {
  const { detail, onDownload } = props
  const w = detail.withholding
  if (isPending(detail) || !w) {
    return (
      <Sec title="세금계산서 · 원천징수">
        <SecEmpty>정산이 확정되면 증빙 발행 상태가 표시됩니다.</SecEmpty>
      </Sec>
    )
  }

  const b = detail.breakdown
  const paid = detail.status === "PAID"

  return (
    <Sec title="세금계산서 · 원천징수">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <td className={cn(LTAB_HEAD, "w-[210px]")}>발행 구분</td>
            <td className={cn(LTAB_HEAD, "w-[150px]")}>대상</td>
            <td className={cn(LTAB_HEAD, "w-[130px] text-right")}>금액</td>
            <td className={LTAB_HEAD}>상태</td>
            <td className={cn(LTAB_HEAD, "w-[190px]")}>관리</td>
          </tr>
        </thead>
        <tbody className="[&>tr:first-child>td]:border-t-0">
          <tr>
            <td className={LTAB_CELL}>플랫폼 → 브랜드</td>
            <td className={LTAB_CELL}>중개 수수료</td>
            <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
              {formatWon(b.platformFee)}
            </td>
            {b.platformFee === 0 ? (
              <td className={cn(LTAB_CELL, "text-sz-n-500")}>
                발행 대상 아님 <MNote>베타 수수료 0원</MNote>
              </td>
            ) : (
              <td className={LTAB_CELL}>발행 완료</td>
            )}
            <td className={LTAB_CELL}>
              <ActBtn
                disabled={b.platformFee === 0}
                onClick={() => onDownload("세금계산서")}
              >
                다운로드
              </ActBtn>
            </td>
          </tr>
          <tr>
            <td className={LTAB_CELL}>인플루언서 → 브랜드</td>
            <td className={LTAB_CELL}>리워드 용역</td>
            <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
              {w.creatorIsBusiness ? formatWon(b.reward) : "해당 없음"}
            </td>
            {w.creatorIsBusiness ? (
              <>
                <td className={LTAB_CELL}>
                  <StatusBadge
                    variant={w.taxInvoiceReceived ? "success" : "neutral"}
                  >
                    {w.taxInvoiceReceived ? "수취 완료" : "수취 대기"}
                  </StatusBadge>
                </td>
                <td className={cn(LTAB_CELL, "text-sz-n-500")}>
                  {w.taxInvoiceReceived ? (
                    <ActBtn onClick={() => onDownload("세금계산서")}>
                      세금계산서
                    </ActBtn>
                  ) : (
                    "인플루언서 발행 대기"
                  )}
                </td>
              </>
            ) : (
              <>
                <td className={LTAB_CELL}>
                  비사업자 원천징수 처리
                  {!paid && <MNote>지급 시 발급</MNote>}
                </td>
                <td className={LTAB_CELL}>
                  <ActBtn
                    disabled={!paid}
                    onClick={() => onDownload("원천징수영수증")}
                  >
                    원천징수영수증
                  </ActBtn>
                </td>
              </>
            )}
          </tr>
        </tbody>
      </table>
      <Note>
        {w.creatorIsBusiness ? (
          <>
            인플루언서가 <b className="font-semibold">사업자</b>인 경우 리워드에
            대한 <b className="font-semibold">세금계산서를 발행</b>합니다 —{" "}
            <b className="font-semibold">원천징수는 하지 않습니다.</b> 비사업자
            개인이면 3.3%를 원천징수하고 원천징수영수증이 발급됩니다.
          </>
        ) : (
          <>
            인플루언서가 <b className="font-semibold">비사업자 개인</b>이면
            리워드에서 <b className="font-semibold">3.3%</b>(소득세 3% + 지방세
            0.3%)를 원천징수하고 원천징수영수증이 발급됩니다. 사업자인 경우
            세금계산서를 수취합니다.
          </>
        )}{" "}
        <WaitTag>[자문대기-세무]</WaitTag> 원천징수 의무자(브랜드/플랫폼) 확정
        대기.
      </Note>
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

/** 반품·교환 배송비 — 주문 결제금과 별도 결제라 분해 표·정산 반영액에 넣지 않는다 */
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
        반품·교환 배송비는{" "}
        <b className="font-semibold">주문 결제금과 별도로 결제</b>되므로 위 정산
        금액 분해와 주문 명세의{" "}
        <b className="font-semibold">정산 반영액에는 포함되지 않습니다.</b> 부담
        주체는 <b className="font-semibold">사유에 따라 갈립니다</b> —
        단순변심은 소비자, 불량·오배송은 브랜드입니다(기본정보 관리의 배송·반품
        정책 기준). <WaitTag>[미정]</WaitTag> 반품비·교환비 금액 산정(왕복 전액
        vs 회수 편도) 확정 대기.
      </Note>
    </Sec>
  )
}

/** 고정 지급비 — 계약 시 선결제 → 게시 시점 지급되는 별도 트랙이라 분해에 섞지 않고 이력만 */
export function FixedFeeCard({ detail }: Props) {
  return (
    <Sec title="고정 지급비 이력" note="조회 전용 · 정산 금액에 포함되지 않음">
      {detail.fixedFees.length === 0 ? (
        <SecEmpty>이 공구 계약에는 고정 지급비가 없습니다.</SecEmpty>
      ) : (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <td className={cn(LTAB_HEAD, "w-[150px] text-right")}>금액</td>
              <td className={cn(LTAB_HEAD, "w-[160px]")}>브랜드 결제</td>
              <td className={cn(LTAB_HEAD, "w-[190px]")}>인플루언서 지급</td>
              <td className={LTAB_HEAD}>비고</td>
            </tr>
          </thead>
          <tbody className="[&>tr:first-child>td]:border-t-0">
            {detail.fixedFees.map(fee => (
              <tr key={`${fee.brandPaidAt}-${fee.amount}`}>
                <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                  {formatWon(fee.amount)}
                </td>
                <td className={cn(LTAB_CELL, "tabular-nums")}>
                  {formatFullDate(fee.brandPaidAt)}
                </td>
                <td className={cn(LTAB_CELL, "tabular-nums")}>
                  {fee.creatorPaidAt ? (
                    <>
                      {formatFullDate(fee.creatorPaidAt)}
                      <span className="ml-1">
                        <StatusBadge variant="success">지급 완료</StatusBadge>
                      </span>
                    </>
                  ) : (
                    <span className="text-sz-n-500">게시 전</span>
                  )}
                </td>
                <td className={cn(LTAB_CELL, "text-sz-n-500")}>
                  게시물 게시 시점 지급
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Note>
        고정 지급비는{" "}
        <b className="font-semibold">
          계약 시 선결제되어 게시 시점에 지급되는 별도 금액
        </b>
        으로, 위 정산 금액에는 포함되지 않습니다.
      </Note>
    </Sec>
  )
}

/** 정산 명세 — 주문 단위 미리보기 5건. 확정 전 파일은 근거로 돌아다니므로 다운로드를 막는다 */
export function StatementCard(props: Props & { onDownload: () => void }) {
  const { detail, onDownload } = props
  const pending = isPending(detail)

  return (
    <Sec
      title="정산 명세"
      note={
        pending
          ? "정산 확정 후 다운로드"
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
          취소·반품 건은 정산 반영액이 <b className="font-semibold">0원</b>으로
          표시됩니다.
          {pending && (
            <>
              {" "}
              <b className="font-semibold">정산 확정 후 받을 수 있습니다.</b>
            </>
          )}
        </span>
        <Btn variant="secondary" disabled={pending} onClick={onDownload}>
          전체 명세 다운로드
        </Btn>
      </div>
    </Sec>
  )
}
