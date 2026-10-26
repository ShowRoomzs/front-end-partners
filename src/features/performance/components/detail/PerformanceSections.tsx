import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  B,
  KpiCard,
  KpiGrid,
  ProjectedTag,
} from "@/features/performance/components/PerformanceParts"
import { PERFORMANCE_TONE_VARIANT } from "@/features/performance/constants/params"
import type {
  PerformanceAdjustment,
  PerformanceBreakdownGroup,
  PerformanceDetail,
  PerformanceFigure,
  PerformanceProductRow,
  PerformanceSettlementLink,
} from "@/features/performance/types"
import {
  formatDueDateTime,
  formatEventDate,
  formatEventMonthDay,
  formatFigure,
  formatMonthDay,
  formatNumber,
  formatPeriod,
  formatValue,
  formatWon,
} from "@/features/performance/utils/format"
import {
  LTAB_CELL,
  LTAB_HEAD,
  Note,
  Sec,
  SecEmpty,
} from "@/features/settlement/components/detail/DetailParts"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

// ── 계약 조건 바 ──

/**
 * 계약 조건 바 — 총 집행비(고정 지급비 + 리워드)는 ROAS의 분모다. 리워드는 상태대로:
 * 예정(집계 중) · 협의 중(원래 값 + 「조정 협의 중」) · 합의 반영(원래 → 합의 값).
 */
export function ContractBar(props: {
  detail: PerformanceDetail
  onOpenContract: () => void
}) {
  const { contract } = props.detail
  const [feeHead, ...feeRest] = (contract.fixedFeeText ?? "").split(" · ")
  const reward = contract.reward
  const spend = contract.totalSpend
  const micro = "text-[11px] text-sz-n-500"

  const rewardText = (() => {
    if (reward.state === "NEGOTIATING")
      return `${formatFigure({ ...reward, value: reward.original ?? null }, "won")}(${reward.basis ?? "조정 협의 중"})`
    if (reward.original != null && reward.value != null)
      return `${formatWon(reward.original)} → 합의 반영 ${formatWon(reward.value)}`
    if (reward.state === "PROJECTED")
      return `${formatFigure(reward, "won")}(예정)`
    return formatFigure(reward, "won")
  })()

  return (
    <Sec bodyClassName="flex flex-wrap items-center gap-6 px-4 py-3">
      <span className="text-[12px]">
        <span className="text-sz-n-500">계약 조건</span>{" "}
        {contract.fixedFeeText ? (
          <>
            <b className="font-semibold tabular-nums">{feeHead}</b>
            {feeRest.length > 0 && (
              <span className={micro}> · {feeRest.join(" · ")}</span>
            )}
          </>
        ) : (
          <b className="font-semibold">고정 지급비 없음</b>
        )}{" "}
        <span className={micro}>
          · 리워드 = 확정 거래액 × 리워드율 {contract.rewardRateLabel ?? "—"} ={" "}
          {rewardText}
        </span>{" "}
        <span className="text-sz-n-700">
          ·{" "}
          {spend.state === "PENDING_SETTLEMENT" ? (
            <b className="font-semibold">총 집행비 정산 후 확정</b>
          ) : (
            <>
              <b className="font-semibold tabular-nums">
                총 집행비{" "}
                {formatFigure(
                  spend.state === "NEGOTIATING"
                    ? { ...spend, value: spend.original ?? null }
                    : spend,
                  "won"
                )}
              </b>
              {spend.state === "NEGOTIATING" && spend.basis && (
                <span className={micro}> ({spend.basis})</span>
              )}
              {spend.state !== "NEGOTIATING" && spend.original != null && (
                <span className={micro}>
                  {" "}
                  (원래 {formatWon(spend.original)})
                </span>
              )}
            </>
          )}
        </span>
      </span>
      <span className="text-[12px]">
        <span className="text-sz-n-500">공구 기간</span>{" "}
        <span className="tabular-nums">
          {formatPeriod(props.detail.periodStart, props.detail.periodEnd, true)}{" "}
          ({contract.periodDays}일)
        </span>
      </span>
      <button
        type="button"
        onClick={props.onOpenContract}
        className="ml-auto cursor-pointer text-[12px] text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
      >
        계약서 보기
      </button>
    </Sec>
  )
}

// ── KPI 8 ──

export function DetailKpis({ detail }: { detail: PerformanceDetail }) {
  const { kpi } = detail
  return (
    <>
      <KpiGrid cols={4}>
        <KpiCard label="확정 거래액" figure={kpi.confirmedSales} unit="won" />
        <KpiCard label="정산액" figure={kpi.payout} unit="won" />
        <KpiCard label="전환율" figure={kpi.conversionRate} unit="rate" />
        <KpiCard label="구매확정률" figure={kpi.confirmRate} unit="rate" />
      </KpiGrid>
      <KpiGrid cols={4}>
        <KpiCard
          label="확정 수량"
          figure={kpi.confirmedQuantity}
          unit="pieces"
        />
        <KpiCard label="AOV" figure={kpi.aov} unit="won" />
        <KpiCard label="ROAS" figure={kpi.roas} unit="roas" />
        <KpiCard label="재구매율" figure={kpi.repurchaseRate} unit="rate" />
      </KpiGrid>
    </>
  )
}

// ── 묶음 제목 ──

/** 시안 `.grp` — 유입 · 판매 · 배송 · 소비자 · 원가 */
export function Grp(props: { title: string; sub: string; first?: boolean }) {
  return (
    <div
      className={cn(
        "mb-3 flex items-baseline gap-[9px] border-b-[1.5px] border-sz-n-300 pb-2",
        props.first ? "mt-4" : "mt-5"
      )}
    >
      <span className="text-[16px] font-semibold text-sz-n-900">
        {props.title}
      </span>
      <span className="text-[11px] text-sz-n-500">{props.sub}</span>
    </div>
  )
}

// ── ① 유입 ──

const SHADES = [1, 0.72, 0.48, 0.28]
const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** 유입 경로 도넛 — 같은 액센트 색의 농도 4단(색으로 순위를 만들지 않는다) */
function SourceDonut(props: { counts: Array<number>; total: number }) {
  const { counts, total } = props
  const lengths = counts.map(count =>
    total > 0 ? (count / total) * CIRCUMFERENCE : 0
  )
  // 각 조각의 시작점 = 앞 조각 길이의 합
  const offsets = lengths.map((_, index) =>
    lengths.slice(0, index).reduce((sum, length) => sum + length, 0)
  )
  return (
    <svg
      viewBox="0 0 140 140"
      width="140"
      height="140"
      className="shrink-0"
      role="img"
      aria-label="유입 경로 분포"
    >
      {lengths.map((length, index) => (
        <circle
          key={index}
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          stroke="var(--sz-accent-500)"
          opacity={SHADES[index] ?? 0.2}
          strokeWidth="22"
          strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
          strokeDashoffset={-offsets[index]}
          transform="rotate(-90 70 70)"
        />
      ))}
      <text
        x="70"
        y="68"
        textAnchor="middle"
        fontSize="19"
        fontWeight="600"
        fill="var(--sz-n-900)"
        className="tabular-nums"
      >
        {formatNumber(total)}
      </text>
      <text
        x="70"
        y="84"
        textAnchor="middle"
        fontSize="9"
        fill="var(--sz-n-500)"
      >
        쇼룸 방문
      </text>
    </svg>
  )
}

/** 게시물 지표 막대 한 줄 */
function PostBar(props: {
  label: string
  value: string
  sub: ReactNode
  width: number
}) {
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="flex-1 text-[12px] text-sz-n-700">{props.label}</span>
        <b className="text-[16px] font-semibold text-sz-n-900 tabular-nums">
          {props.value}
        </b>
        <span className="text-[11px] text-sz-n-500">{props.sub}</span>
      </div>
      <div className="h-[9px] overflow-hidden rounded-[5px] bg-sz-n-100">
        <i
          className="block h-full rounded-[5px] bg-sz-accent-500"
          style={{ width: `${Math.min(100, Math.max(0, props.width))}%` }}
        />
      </div>
    </div>
  )
}

/** 퍼널 막대 한 줄 */
function FunnelRow(props: {
  label: ReactNode
  value: string
  rate: number | null
  shade: number
}) {
  const rate = props.rate ?? 0
  return (
    <div className="flex items-center gap-3 py-[5px]">
      <span className="w-[118px] shrink-0 text-[12px] text-sz-n-700">
        {props.label}
      </span>
      <span className="h-5 flex-1 overflow-hidden rounded-[6px] bg-sz-n-100">
        <i
          className="block h-full rounded-[6px] bg-sz-accent-500"
          style={{ width: `${Math.min(100, rate)}%`, opacity: props.shade }}
        />
      </span>
      <b className="w-[76px] text-right text-[12px] font-semibold text-sz-n-900 tabular-nums">
        {props.value}
      </b>
      <span className="w-[52px] text-right text-[12px] text-sz-n-500 tabular-nums">
        {props.rate == null ? "—" : `${rate.toFixed(1)}%`}
      </span>
    </div>
  )
}

const ratioOf = (part: number, whole: number) =>
  whole > 0 ? (part / whole) * 100 : 0

export function TrafficSection({ detail }: { detail: PerformanceDetail }) {
  const { traffic } = detail
  const { funnel, post } = traffic
  const confirmedProjected = funnel.confirmed.state === "PROJECTED"
  const productViews = post?.productViewCount.value ?? 0
  const postOrders = post?.orderCount.value ?? 0

  return (
    <>
      <Grp
        title="유입"
        sub="방문이 어디서 왔고 얼마나 주문으로 이어졌나"
        first
      />
      <div className="mb-4 grid grid-cols-2 items-stretch gap-3">
        <Sec
          title="유입 경로"
          note="4경로 합계 = 쇼룸 방문"
          className="mb-0 flex flex-col"
          bodyClassName="flex flex-1 flex-col"
        >
          <div className="flex flex-1 items-center gap-7">
            <SourceDonut
              counts={traffic.sources.map(source => source.count)}
              total={traffic.visitorCount}
            />
            <div className="flex flex-1 flex-col gap-2.5">
              {traffic.sources.map((source, index) => (
                <div
                  key={source.source}
                  className="flex items-center gap-2 text-[12px]"
                >
                  <i
                    className="size-2.5 shrink-0 rounded-[2px] bg-sz-accent-500"
                    style={{ opacity: SHADES[index] ?? 0.2 }}
                  />
                  <span className="flex-1 text-sz-n-700">{source.label}</span>
                  <span className="w-[60px] text-right font-medium text-sz-n-900 tabular-nums">
                    {formatNumber(source.count)}
                  </span>
                  <span className="w-[42px] text-right text-sz-n-500 tabular-nums">
                    {source.ratio == null
                      ? "—"
                      : `${Math.round(source.ratio)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {traffic.limits.length > 0 && (
            <Note className="space-y-0.5">
              {traffic.limits.map(limit => (
                <div key={limit}>{limit}</div>
              ))}
            </Note>
          )}
        </Sec>
        <Sec
          title="공구 게시물"
          note={post ? "쇼룸 내부 지표 · 게시물 1건" : undefined}
          className="mb-0 flex flex-col"
          bodyClassName="flex flex-1 flex-col"
        >
          {post ? (
            <>
              <PostBar
                label="게시물 조회"
                value={`${formatNumber(post.impressionCount)}회`}
                sub={`고유 방문 ${formatNumber(post.uniqueViewerCount)}명`}
                width={100}
              />
              <PostBar
                label="상품 상세 이동"
                value={formatFigure(post.productViewCount, "times")}
                sub={post.productViewCount.basis}
                width={ratioOf(productViews, post.impressionCount)}
              />
              <PostBar
                label="게시물 → 주문"
                value={formatFigure(post.orderCount, "orders")}
                sub={post.orderCount.basis}
                width={ratioOf(postOrders, productViews)}
              />
              <div className="mt-auto flex items-baseline gap-3.5 border-t border-sz-n-100 pt-2.5 text-[12px] text-sz-n-700">
                <span>
                  좋아요{" "}
                  <b className="font-semibold tabular-nums">
                    {formatNumber(post.likeCount)}
                  </b>
                </span>
                <span>
                  공유{" "}
                  {post.shareCount.value == null ? (
                    <span className="text-sz-n-400">
                      {post.shareCount.basis ?? "—"}
                    </span>
                  ) : (
                    <>
                      <b className="font-semibold tabular-nums">
                        {formatNumber(post.shareCount.value)}
                      </b>
                      회
                    </>
                  )}
                </span>
                <span className="ml-auto text-[11px] text-sz-n-500">
                  주문은 게시물 경유분
                </span>
              </div>
            </>
          ) : (
            <SecEmpty>이 공구에 등록된 공구 게시물이 없습니다.</SecEmpty>
          )}
        </Sec>
      </div>

      <Sec
        title="전환 퍼널"
        note="두 구간으로 나눠 봅니다 · 각 구간의 기준이 다릅니다"
      >
        <div className="mb-2.5 rounded-[6px] border border-sz-n-200 px-4 py-3.5">
          <div className="mb-2.5 text-[11px] text-sz-n-600">
            구간 1 · <B>방문에서 주문까지</B> — 막대 기준 = 쇼룸 방문{" "}
            {formatNumber(funnel.visitors)}명
          </div>
          <FunnelRow
            label="쇼룸 방문"
            value={`${formatNumber(funnel.visitors)}명`}
            rate={funnel.visitors > 0 ? 100 : null}
            shade={0.28}
          />
          <FunnelRow
            label="주문(결제완료)"
            value={`${formatNumber(funnel.orders)}건`}
            rate={funnel.orderRate}
            shade={1}
          />
          <Note className="mt-2">
            방문 {formatNumber(funnel.notOrdered)}명은 주문하지 않았습니다.
          </Note>
        </div>
        <div className="rounded-[6px] border border-sz-n-200 px-4 py-3.5">
          <div className="mb-2.5 text-[11px] text-sz-n-600">
            구간 2 · <B>주문에서 구매확정까지</B> — 막대 기준 = 주문{" "}
            {formatNumber(funnel.orders)}건
          </div>
          <FunnelRow
            label="주문"
            value={`${formatNumber(funnel.orders)}건`}
            rate={funnel.orders > 0 ? 100 : null}
            shade={0.28}
          />
          <FunnelRow
            label="발송"
            value={`${formatNumber(funnel.shipped)}건`}
            rate={funnel.shippedRate}
            shade={0.48}
          />
          <FunnelRow
            label="배송완료"
            value={`${formatNumber(funnel.delivered)}건`}
            rate={funnel.deliveredRate}
            shade={0.72}
          />
          <FunnelRow
            label={
              <>
                구매확정
                {confirmedProjected && <ProjectedTag />}
              </>
            }
            value={formatFigure(funnel.confirmed, "orders")}
            rate={funnel.confirmedRate}
            shade={1}
          />
          <Note className="mt-2">
            막대와 비율 모두 <B>주문 대비</B>입니다. 주문{" "}
            {formatNumber(funnel.orders)}건 = 구매확정
            {confirmedProjected ? " 예정" : ""}{" "}
            {formatNumber(funnel.confirmed.value ?? 0)} + 취소{" "}
            {formatNumber(funnel.cancelled)} + 반품{" "}
            {formatNumber(funnel.returned)} + 배송 예외{" "}
            {formatNumber(funnel.deliveryException)} · 건별 내역은{" "}
            <B>판매 관리</B>에서 봅니다.
          </Note>
        </div>
        <div className="mt-3 flex items-baseline border-t border-sz-n-100 pt-3 text-[11px] text-sz-n-600 tabular-nums">
          <span className="flex-1">
            방문 대비 최종 구매전환율
            {funnel.conversionRate.state === "PROJECTED" ? "(예정)" : ""}
          </span>
          <b className="text-[16px] font-semibold text-sz-n-900">
            {formatFigure(funnel.conversionRate, "rate")}
          </b>
        </div>
      </Sec>
    </>
  )
}

// ── ② 판매 ──

function ProductCells({ row }: { row: PerformanceProductRow }) {
  const num = "px-3 text-right tabular-nums"
  return (
    <>
      <td className={num}>{formatNumber(row.detailViews)}</td>
      <td className={num}>{formatNumber(row.viewers)}</td>
      <td className={num}>{formatNumber(row.orderCount)}</td>
      <td className={num}>{formatFigure(row.conversionRate, "rate")}</td>
      <td className={num}>{formatFigure(row.confirmedQuantity, "pieces")}</td>
      <td className={num}>{formatFigure(row.confirmedSales, "won")}</td>
      <td className={num}>{formatFigure(row.returnRate, "rate")}</td>
    </>
  )
}

export function SalesSection({ detail }: { detail: PerformanceDetail }) {
  const { sales, traffic } = detail
  const { products, total, highlights } = sales
  const viewerSum = products.reduce((sum, row) => sum + row.viewers, 0)
  const overlap = viewerSum - total.viewers
  const postViews = traffic.post?.productViewCount.value ?? null
  const totalReturnBasis = total.returnRate.basis?.replace(
    /^공구 전체 반품률\s*/,
    ""
  )
  const head = cn(LTAB_HEAD, "text-right")

  return (
    <>
      <Grp title="판매" sub="무엇이 얼마나 팔렸나" />
      <Sec title="상품별 성과" note="상품(SKU) 단위 · 조회부터 반품까지">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <td className={LTAB_HEAD}>상품</td>
              <td className={cn(head, "w-[88px]")}>상세 조회</td>
              <td className={cn(head, "w-[78px]")}>조회자</td>
              <td className={cn(head, "w-[78px]")}>주문</td>
              <td className={cn(head, "w-[84px]")}>전환율</td>
              <td className={cn(head, "w-[84px]")}>확정 수량</td>
              <td className={cn(head, "w-[118px]")}>확정 거래액</td>
              <td className={cn(head, "w-[78px]")}>반품률</td>
            </tr>
          </thead>
          <tbody className="[&>tr:first-child>td]:border-t-0 [&>tr>td]:border-t [&>tr>td]:border-sz-n-100 [&>tr>td]:py-2.5">
            {products.map(row => (
              <tr key={row.contractItemId ?? row.productName}>
                <td className={cn(LTAB_CELL, "px-3")}>{row.productName}</td>
                <ProductCells row={row} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-sz-n-50 font-semibold [&>td]:border-t [&>td]:border-sz-n-200 [&>td]:py-[9px]">
              <td className="px-3">{total.productName}</td>
              <ProductCells row={total} />
            </tr>
          </tfoot>
        </table>
        <Note>
          <B>전환율은 조회자 대비 주문</B>입니다(상세 조회 수가 아니라{" "}
          <B>고유 조회자</B>가 분모) — 한 사람이 여러 번 봐도 한 번으로 셉니다.
          {products.length > 1 && (
            <>
              {" "}
              <B>
                조회자 합계 {formatNumber(total.viewers)}명은 중복을 제거한 값
              </B>
              이라 상품별 합(
              {products.map(row => formatNumber(row.viewers)).join("+")}=
              {formatNumber(viewerSum)}명)보다 작습니다
              {products.length === 2 && overlap > 0
                ? ` — 두 상품을 모두 본 소비자가 ${formatNumber(overlap)}명입니다.`
                : "."}
            </>
          )}
          {postViews != null && (
            <>
              {" "}
              <B>상세 조회 {formatNumber(total.detailViews)}회</B>는 게시물을
              거친 {formatNumber(postViews)}회와 쇼룸 내부 탐색·상품 상세 직접
              링크에서 바로 들어온{" "}
              {formatNumber(Math.max(0, total.detailViews - postViews))}회의
              합입니다.
            </>
          )}{" "}
          <B>반품률은 상품별 확정 수량 대비</B>라 공구 전체 반품률
          {totalReturnBasis ? `(${totalReturnBasis})` : ""}과 분모가 달라 값이
          다를 수 있습니다.
        </Note>
        <KpiGrid cols={3} className="mt-4 mb-0">
          <KpiCard
            small
            label="가장 많이 본 상품"
            text={highlights.mostViewed?.productName ?? null}
            sub={highlights.mostViewed?.basis ?? ""}
          />
          <KpiCard
            small
            label="전환율이 높은 상품"
            text={highlights.bestConversion?.productName ?? null}
            sub={highlights.bestConversion?.basis ?? ""}
          />
          <KpiCard
            small
            label="반품률이 높은 상품"
            text={highlights.highestReturn?.productName ?? null}
            sub={highlights.highestReturn?.basis ?? ""}
          />
        </KpiGrid>
      </Sec>
    </>
  )
}

// ── ③ 배송 ──

function TreeGroup(props: {
  title: string
  group: PerformanceBreakdownGroup
  className?: string
}) {
  const { title, group } = props
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[6px] border border-sz-n-200",
        props.className
      )}
    >
      <div className="flex items-center gap-2 border-b border-sz-n-100 bg-sz-n-50 px-[13px] py-2.5 text-[12px]">
        <b className="flex-1 font-semibold text-sz-n-900">{title}</b>
        <span className="text-sz-n-700 tabular-nums">
          {formatNumber(group.count)}건 · {formatWon(group.amount)}
        </span>
      </div>
      {group.lines.map(line => (
        <div
          key={line.key}
          className="flex items-center gap-2 border-b border-sz-n-100 py-2 pr-[13px] pl-[26px] text-[12px] text-sz-n-700 last:border-b-0"
        >
          <span className="min-w-0 flex-1">{line.label}</span>
          <span className="w-[78px] text-right text-[11px] text-sz-n-500 tabular-nums">
            {formatNumber(line.quantity)}개
          </span>
          <span className="w-[104px] text-right text-sz-n-600 tabular-nums">
            {formatWon(line.amount)}
          </span>
          <span className="w-14 text-right tabular-nums">
            {formatNumber(line.count)}건
          </span>
        </div>
      ))}
    </div>
  )
}

export function DeliverySection({ detail }: { detail: PerformanceDetail }) {
  const { delivery, breakdown } = detail
  const deduction = breakdown.deductionTotal.value
  return (
    <>
      <Grp title="배송" sub="약속한 기한을 지켰나 · 얼마나 되돌아왔나" />
      <Sec title="배송 운영 품질" note="공구 기간 전체">
        <KpiGrid cols={4} className="mb-0">
          <KpiCard
            small
            label="발송기한 준수율"
            figure={delivery.shipOnTimeRate}
            unit="rate"
          />
          <KpiCard
            small
            label="평균 발송 소요"
            figure={delivery.avgShipDays}
            unit="days"
          />
          <KpiCard
            small
            label="배송 클레임률"
            figure={delivery.claimRate}
            unit="rate"
          />
          <KpiCard
            small
            label="문의 응답 평균"
            figure={delivery.avgInquiryHours}
            unit="hours"
          />
        </KpiGrid>
      </Sec>
      <Sec
        title="취소 · 반품 분해"
        note={`총 ${formatNumber(breakdown.totalCount)}건 · 거래액 차감 ${deduction ? `−${formatWon(deduction)}` : "0원"} 반영${breakdown.pendingReturnCount ? ` · 미처리 반품 ${formatNumber(breakdown.pendingReturnCount)}건 포함` : ""}`}
      >
        <div className="flex flex-col gap-2.5">
          <TreeGroup title="취소" group={breakdown.cancel} />
          <TreeGroup title="반품" group={breakdown.returned} />
        </div>
        <TreeGroup
          title="배송 예외"
          group={breakdown.deliveryException}
          className="mt-2.5"
        />
        <Note>
          배송 예외는 <B>반품률에 포함되지 않습니다.</B> 반송·분실은 소비자
          요청이 아니라 배송 과정에서 발생한 건입니다.
        </Note>
      </Sec>
    </>
  )
}

// ── ④ 소비자 ──

export function ConsumersSection({ detail }: { detail: PerformanceDetail }) {
  const { consumers } = detail
  const { gender, ageBands, estimated } = consumers
  const basisWord = estimated ? "구매확정 예정" : "구매확정"
  const maxBand = ageBands.reduce(
    (max, band) => (band.total > max.total ? band : max),
    ageBands[0]
  )
  const femaleRatio = gender.femaleRatio
  const maleRatio = gender.maleRatio
  const hasGender = femaleRatio != null && maleRatio != null

  return (
    <>
      <Grp title="소비자" sub="누가 샀나" />
      <Sec
        title="소비자 분석"
        note={`${basisWord} ${formatNumber(consumers.confirmedOrderCount)}건 기준`}
      >
        <KpiGrid cols={4}>
          <KpiCard
            label="신규 소비자"
            figure={consumers.newBuyerCount}
            unit="people"
          />
          <KpiCard
            label="재구매 소비자"
            figure={consumers.repurchaseBuyerCount}
            unit="people"
          />
          <KpiCard
            label="쇼룸 팔로워 구매 비중"
            figure={consumers.followerShare}
            unit="rate0"
          />
          <KpiCard
            label="신규 고객 획득 단가"
            figure={consumers.acquisitionCost}
            unit="won"
          />
        </KpiGrid>
        <div className="border-t border-sz-n-100 pt-4">
          <div className="mb-2 text-[12px] font-semibold text-sz-n-900">
            성별 분포
            {estimated && <ProjectedTag />}
          </div>
          {hasGender && (
            <div className="mb-4 flex h-[26px] overflow-hidden rounded-[6px] border border-sz-n-200">
              {femaleRatio > 0 && (
                <span
                  className="flex items-center justify-center bg-sz-brand-500 text-[11px] font-medium text-white"
                  style={{ flex: femaleRatio }}
                >
                  여성 {Math.round(femaleRatio)}%
                </span>
              )}
              {maleRatio > 0 && (
                <span
                  className="flex items-center justify-center bg-sz-accent-500 text-[11px] font-medium text-white"
                  style={{ flex: maleRatio }}
                >
                  남성 {Math.round(maleRatio)}%
                </span>
              )}
            </div>
          )}
          <div className="mb-2.5 flex items-baseline gap-3">
            <span className="text-[12px] font-semibold text-sz-n-900">
              연령대 · 성별
              {estimated && <ProjectedTag />}
            </span>
            {hasGender && (
              <>
                <span className="flex items-center gap-[5px] text-[11px] text-sz-n-700">
                  <i className="size-[9px] rounded-[2px] bg-sz-brand-500" />
                  여성 {Math.round(femaleRatio)}%
                </span>
                <span className="flex items-center gap-[5px] text-[11px] text-sz-n-700">
                  <i className="size-[9px] rounded-[2px] bg-sz-accent-500" />
                  남성 {Math.round(maleRatio)}%
                </span>
              </>
            )}
            {maxBand && (
              <span className="ml-auto text-[11px] text-sz-n-500">
                막대는 최대 구간({maxBand.label}) 기준
              </span>
            )}
          </div>
          <div className="flex flex-col gap-[7px]">
            {ageBands.map(band => {
              const width = maxBand?.total
                ? (band.total / maxBand.total) * 100
                : 0
              const unknown = band.band === "UNKNOWN"
              return (
                <div
                  key={band.band}
                  className="flex items-center gap-3 text-[12px]"
                >
                  <span className="w-11 shrink-0 text-sz-n-700">
                    {band.label}
                  </span>
                  <span className="h-[15px] flex-1 overflow-hidden rounded-[6px] bg-sz-n-100">
                    <i
                      className="flex h-full overflow-hidden rounded-[6px]"
                      style={{ width: `${width}%` }}
                    >
                      {unknown ? (
                        <b className="flex-1 bg-sz-n-300" />
                      ) : (
                        <>
                          <b
                            className="bg-sz-brand-500"
                            style={{ flex: band.female }}
                          />
                          <b
                            className="bg-sz-accent-500"
                            style={{ flex: band.male }}
                          />
                        </>
                      )}
                    </i>
                  </span>
                  <b className="w-11 text-right font-semibold text-sz-n-900 tabular-nums">
                    {band.ratio == null ? "—" : `${Math.round(band.ratio)}%`}
                  </b>
                  <span className="w-[92px] text-right text-[11px] text-sz-n-500 tabular-nums">
                    {unknown
                      ? `${formatNumber(band.total)}명`
                      : `여 ${formatNumber(band.female)} / 남 ${formatNumber(band.male)}`}
                  </span>
                </div>
              )
            })}
          </div>
          <Note>
            막대 안 두 색은 여성 · 남성이고, 백분율은{" "}
            <B>
              {basisWord} {formatNumber(consumers.confirmedOrderCount)}건 대비
            </B>
            입니다 — 여 · 남 인원 합계는{" "}
            {formatNumber(consumers.confirmedBuyerCount)}명입니다. 구간 인원이
            5명 미만이면 「기타」로 합산해 표시합니다.
          </Note>
        </div>
      </Sec>
    </>
  )
}

// ── ⑥ 정산 연결 ──

function LinkRow(props: {
  label: string
  note?: ReactNode
  amount: string
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline text-[12px]">
      <span className="flex-1 text-sz-n-700">
        {props.label}
        {props.note && (
          <span className="text-[11px] text-sz-n-500"> {props.note}</span>
        )}
      </span>
      {props.strong ? (
        <b className="font-semibold text-sz-n-900 tabular-nums">
          {props.amount}
        </b>
      ) : (
        <span className="text-sz-n-600 tabular-nums">{props.amount}</span>
      )}
    </div>
  )
}

const minus = (value: number) => (value === 0 ? "0원" : `−${formatWon(value)}`)
const signed = (value: number) =>
  value < 0 ? `−${formatWon(-value)}` : `+${formatWon(value)}`
const percent = (ratio: number) => Math.round(ratio * 1000) / 10

/**
 * 협의 경위 한 줄 — 「조정 요청 ○○ · 438,400원 → 다른 금액 제안 데일리뷰티랩 · 493,200원 → 10.08 브랜드 동의」.
 * 응답 버튼은 없다(협의는 이슈 스레드에서만).
 */
function adjustmentTrail(
  adjustment: PerformanceAdjustment,
  brandName: string,
  showroomName: string
) {
  const proposals = [...(adjustment.proposals ?? [])].sort(
    (a, b) => a.seq - b.seq
  )
  const parts = proposals.map(
    (proposal, index) =>
      `${index === 0 ? "조정 요청" : "다른 금액 제안"} ${proposal.mine ? brandName : showroomName} · ${formatWon(proposal.rewardAmount)}`
  )
  const accepted = proposals.find(proposal => proposal.status === "ACCEPTED")
  if (accepted)
    parts.push(
      `${formatEventMonthDay(accepted.respondedAt)} ${accepted.mine ? showroomName : "브랜드"} 동의`
    )
  return { text: parts.join(" → "), acceptedAt: accepted?.respondedAt ?? null }
}

export function SettlementLinkSection(props: {
  detail: PerformanceDetail
  brandName: string
  onOpenSettlement: (settlementId: number) => void
  onOpenThread: (threadId: number) => void
}) {
  const { detail, brandName, onOpenSettlement, onOpenThread } = props
  const settlement = detail.settlement

  return (
    <Sec title="정산 연결" note="이 화면은 조회 전용 · 지급 명세는 정산 관리">
      {settlement ? (
        <SettlementLinkBody
          settlement={settlement}
          detail={detail}
          brandName={brandName}
          onOpenSettlement={onOpenSettlement}
          onOpenThread={onOpenThread}
        />
      ) : (
        <>
          <div className="flex items-center gap-3 text-[12px]">
            <div className="w-[140px] shrink-0 text-sz-n-500">정산 상태</div>
            <div className="flex flex-1 items-center gap-1.5">
              <StatusBadge
                variant={PERFORMANCE_TONE_VARIANT[detail.statusTone]}
              >
                {detail.statusLabel}
              </StatusBadge>
              <span className="text-[11px] text-sz-n-500">
                반품 처리가 끝나면 정산이 시작됩니다
              </span>
            </div>
          </div>
          <Note className="mt-4">정산이 완료되면 분해 내역이 표시됩니다.</Note>
        </>
      )}
    </Sec>
  )
}

function SettlementLinkBody(props: {
  settlement: PerformanceSettlementLink
  detail: PerformanceDetail
  brandName: string
  onOpenSettlement: (settlementId: number) => void
  onOpenThread: (threadId: number) => void
}) {
  const { settlement, detail, brandName, onOpenSettlement, onOpenThread } =
    props
  const b = settlement.breakdown
  const adjustment = settlement.adjustment
  const trail = adjustment
    ? adjustmentTrail(adjustment, brandName, detail.influencer.showroomName)
    : null
  const rateLabel = detail.contract.rewardRateLabel ?? "—"
  const payout: PerformanceFigure = settlement.payout
  const negotiating = payout.state === "NEGOTIATING"

  const footnote = (() => {
    switch (settlement.status) {
      case "PAYOUT_SCHEDULED":
        return (
          <>
            {formatMonthDay(settlement.payoutDueDate)} 지급 예정
            {b && (
              <>
                {" "}
                · 이번 지급액{" "}
                <b className="font-semibold text-sz-n-700 tabular-nums">
                  {formatWon(b.brandPayoutAmount)}
                </b>
                {b.brandClawbackAmount > 0 &&
                  `(이전 정산 차감 ${formatWon(b.brandClawbackAmount)} 반영)`}
              </>
            )}
          </>
        )
      case "PAID":
        return `${formatEventDate(settlement.paidAt)} 지급${trail?.acceptedAt ? ` · 합의 ${formatEventMonthDay(trail.acceptedAt)}` : ""}`
      case "ADJUSTING":
        return adjustment
          ? `합의 기한 ${formatMonthDay(adjustment.deadlineAt)}${adjustment.remainingBusinessDays != null ? ` · D-${adjustment.remainingBusinessDays}` : ""} · 합의가 없으면 원래 금액으로 확정`
          : null
      case "REVIEWING":
        return `${formatDueDateTime(settlement.reviewDueAt)}까지 정산 확인 중`
      default:
        return null
    }
  })()

  return (
    <>
      {b && (
        <div className="flex flex-col gap-[9px]">
          <LinkRow
            label="확정 거래액"
            amount={formatWon(b.confirmedSalesAmount)}
            strong
          />
          <LinkRow
            label="인플루언서 리워드"
            note={
              b.originalRewardAmount !== b.rewardAmount
                ? `합의 반영 · 원래 ${formatWon(b.originalRewardAmount)}(${rateLabel})`
                : `리워드율 ${rateLabel}`
            }
            amount={minus(b.rewardAmount)}
          />
          {trail && trail.text && (
            <div className="flex items-baseline pl-3 text-[11px] text-sz-n-500">
              <span className="flex-1">└ {trail.text}</span>
              {adjustment?.status === "OPEN" && (
                <span>{adjustment.turnLabel}</span>
              )}
            </div>
          )}
          <LinkRow
            label="리워드 부가세"
            note={`${percent(b.rewardVat.rate)}% · 별도`}
            amount={minus(b.rewardVat.amount)}
          />
          <LinkRow
            label="PG 결제 수수료"
            note={`카드·간편결제 ${percent(b.pgFee.rate).toFixed(1)}%`}
            amount={minus(b.pgFee.amount)}
          />
          <LinkRow
            label="플랫폼 수수료"
            note={
              b.platformFee.rate === 0
                ? "베타 기간 0%"
                : `${percent(b.platformFee.rate)}%`
            }
            amount={minus(b.platformFee.amount)}
          />
          {/* 정산 관리 분해의 가산 줄 — 0원이면 숨긴다(서버: 0원 행 숨김은 FE). 1021 새 줄은 개발 서버가 아직 안 줄 수 있다 */}
          {b.consumerDeliveryFee !== 0 && (
            <LinkRow
              label="배송비"
              note="소비자 결제분"
              amount={signed(b.consumerDeliveryFee)}
            />
          )}
          {b.reshipFee.amount !== 0 && (
            <LinkRow
              label="재발송비"
              note={`${formatNumber(b.reshipFee.count)}건`}
              amount={signed(b.reshipFee.amount)}
            />
          )}
          {!!b.returnDeductionFee?.amount && (
            <LinkRow
              label="반품 시 차감한 최초 배송비"
              note={`${formatNumber(b.returnDeductionFee.count)}건`}
              amount={signed(b.returnDeductionFee.amount)}
            />
          )}
          {!!b.freightAdjustment?.amount && (
            <LinkRow
              label="운임 정산"
              note={`${formatNumber(b.freightAdjustment.count)}건`}
              amount={signed(b.freightAdjustment.amount)}
            />
          )}
        </div>
      )}
      <div
        className={cn(
          "flex items-baseline",
          b && "mt-3 border-t border-sz-n-200 pt-3"
        )}
      >
        <span className="flex-1 text-[13px] font-semibold text-sz-n-900">
          정산액
        </span>
        {negotiating ? (
          <b className="text-[13px] font-semibold text-sz-n-500">
            협의 중{" "}
            {payout.original != null && (
              <span className="text-[11px] font-normal tabular-nums">
                · 원래 {formatValue(payout.original, "won")}
              </span>
            )}
          </b>
        ) : (
          <b className="text-[20px] font-semibold text-sz-n-900 tabular-nums">
            {formatFigure(payout, "won")}
          </b>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        <StatusBadge variant={PERFORMANCE_TONE_VARIANT[settlement.statusTone]}>
          {settlement.statusLabel}
        </StatusBadge>
        {footnote && (
          <span className="text-[11px] text-sz-n-500">{footnote}</span>
        )}
        <div className="ml-auto flex gap-1.5">
          {adjustment && (
            <Btn
              variant="secondary"
              onClick={() => onOpenThread(adjustment.threadId)}
            >
              {adjustment.status === "OPEN"
                ? "이슈 스레드 열기"
                : "이슈 스레드 보기"}
            </Btn>
          )}
          <Btn
            variant="secondary"
            onClick={() => onOpenSettlement(settlement.settlementId)}
          >
            정산 상세 보기
          </Btn>
        </div>
      </div>
      <Note>
        고정 지급비는 브랜드가 인플루언서에게 <B>직접 지급</B>하는 금액이라 이
        정산에 포함되지 않습니다. 이 화면은 조회 전용이며, 지급 명세는{" "}
        <B>정산 관리</B>에서 확인합니다.
      </Note>
    </>
  )
}
