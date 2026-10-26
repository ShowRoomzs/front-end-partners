import { parseServerDateTime } from "@/common/utils/formatDate"
import { HomeCard, HomeEmpty } from "@/features/home/components/HomeCard"
import { HOME_LINKS, productEditPath } from "@/features/home/constants/links"
import type {
  HomeLive,
  HomeLiveHour,
  HomeLiveItem,
} from "@/features/home/types"
import { formatNumber } from "@/features/home/utils/format"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { useState } from "react"
import { Link } from "react-router-dom"

const TITLE = "진행 중 공구 · 실시간"

/**
 * 진행 중 공구 · 실시간 — 시안 `.lv-one`. 공구는 보통 하나씩 진행되므로 1개를 전체 폭으로,
 * 드물게 겹치면 같은 줄을 세로로 쌓는다. 결제 기준(취소 전 포함) · 확정 성과는 성과 관리 몫.
 */
export default function LiveGroupBuyCard(props: {
  live: HomeLive | undefined
}) {
  const items = props.live?.items ?? []

  if (!props.live || items.length === 0) {
    return (
      <HomeCard title={TITLE}>
        <HomeEmpty>
          공구가 오픈되면 오늘 주문 · 결제 · 재고가 실시간으로 표시됩니다.
        </HomeEmpty>
      </HomeCard>
    )
  }

  const asOf = parseServerDateTime(props.live.asOf).format("YYYY.MM.DD HH:mm")

  return (
    <HomeCard
      title={
        <span className="flex items-center gap-2">
          <span className="h-[7px] w-[7px] rounded-full bg-sz-success-text shadow-[0_0_0_3px_var(--color-sz-success-bg)]" />
          {TITLE}
        </span>
      }
      count={`${asOf} 기준 · 1분마다 갱신 · 결제 기준`}
      link={{ label: "공구 관리 ›", to: HOME_LINKS.groupBuys }}
    >
      {items.map((item, index) => (
        <LiveRow key={item.groupBuyId} item={item} divided={index > 0} />
      ))}
    </HomeCard>
  )
}

/** 마감까지 남은 시간 — 종료 시각은 KST 벽시계 그대로 */
function remainingText(endAt: string) {
  const end = dayjs(endAt)
  const minutes = end.diff(dayjs(), "minute")
  if (minutes <= 0) return `마감 · ${end.format("MM.DD HH:mm")}`
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  const left =
    days > 0 ? `${days}일 ${hours}시간` : `${hours}시간 ${minutes % 60}분`
  return `마감까지 ${left} · ${end.format("MM.DD HH:mm")}`
}

function LiveRow(props: { item: HomeLiveItem; divided: boolean }) {
  const { item, divided } = props
  const progress = Math.round(
    Math.min(1, Math.max(0, item.progressRatio)) * 100
  )
  const kpis = [
    {
      label: "쇼룸 방문 · 오늘",
      value: `${formatNumber(item.visitorsToday)}명`,
      sub: `누적 ${formatNumber(item.visitorsCumulative)}명`,
    },
    {
      label: "오늘 주문",
      value: `${formatNumber(item.ordersToday)}건`,
      sub: `어제 같은 시각 ${formatNumber(item.ordersYesterdaySameTime)}건`,
    },
    {
      label: "오늘 결제",
      value: `${formatNumber(item.paidToday)}원`,
      sub: `누적 ${formatNumber(item.paidCumulative)}원`,
    },
    {
      label: "누적 주문",
      value: `${formatNumber(item.ordersCumulative)}건`,
      sub: `판매 ${formatNumber(item.soldQuantity)}개`,
    },
    {
      // 재고는 숫자만 — 경고 · 품절 예상 문구는 두지 않는다(16 rule rev.3)
      label: "재고",
      value: `${formatNumber(item.stock.remaining)}개`,
      sub:
        item.stock.minQuantity != null
          ? `최소 준비 물량 ${formatNumber(item.stock.minQuantity)}개 중`
          : null,
    },
  ]

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_360px]",
        divided && "border-t border-sz-n-100"
      )}
    >
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold text-sz-n-900">
            {item.name}
          </span>
          <span className="text-[11px] text-sz-n-500">{item.creatorName}</span>
          <span className="ml-auto text-[11px] text-sz-n-700 tabular-nums">
            {remainingText(item.endAt)}
          </span>
        </div>
        <div className="mt-2 mb-3 h-1 overflow-hidden rounded-[2px] bg-sz-n-100">
          <i
            className="block h-full bg-sz-accent-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {kpis.map(kpi => (
            <div key={kpi.label}>
              <div className="text-[10.5px] text-sz-n-500">{kpi.label}</div>
              <div className="mt-0.5 text-[16px] font-bold text-sz-n-900 tabular-nums">
                {kpi.value}
              </div>
              {kpi.sub && (
                <div className="mt-px text-[10.5px] text-sz-n-500 tabular-nums">
                  {kpi.sub}
                </div>
              )}
            </div>
          ))}
        </div>
        {item.stock.productId != null && (
          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            <Link
              to={productEditPath(item.stock.productId)}
              className="ml-auto text-sz-accent-500 hover:text-sz-accent-600"
            >
              상품 재고 수정 ›
            </Link>
          </div>
        )}
      </div>
      <HourlyChart hourly={item.hourly} />
    </div>
  )
}

/**
 * 오늘 시간대별 주문 막대 — 지금 시각 칸까지만 그린다(뒤 칸은 아직 0이라 정보가 없다).
 * 마우스를 올리면 「시간 · 주문 수 · 결제 금액」, 지금 칸은 「집계 중」.
 */
function HourlyChart(props: { hourly: Array<HomeLiveHour> }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const nowIndex = props.hourly.findIndex(bucket => bucket.collecting)
  const bars =
    nowIndex >= 0 ? props.hourly.slice(0, nowIndex + 1) : props.hourly
  const max = Math.max(1, ...bars.map(bucket => bucket.orders))
  const nowHour = bars[bars.length - 1]?.hour ?? 0
  const marks = [0, 6, 12, 18].filter(hour => hour < nowHour - 1)
  const tip = hovered != null ? bars[hovered] : null

  return (
    <div className="flex flex-col border-l border-sz-n-100 px-4 pt-3.5 pb-3">
      <div className="text-[10.5px] text-sz-n-500">오늘 시간대별 주문</div>
      <div
        className="relative mt-3 flex h-[72px] flex-1 items-end gap-[3px]"
        onMouseLeave={() => setHovered(null)}
      >
        {bars.map((bucket, index) => (
          <i
            key={bucket.hour}
            onMouseEnter={() => setHovered(index)}
            title={hourTitle(bucket)}
            className={cn(
              "flex-1 rounded-t-[2px]",
              bucket.collecting ? "bg-sz-accent-500" : "bg-sz-n-200",
              hovered === index && !bucket.collecting && "bg-sz-n-300"
            )}
            // 0건도 자리가 보이게 바닥 높이를 둔다(시안 6%)
            style={{ height: `${Math.max(6, (bucket.orders / max) * 100)}%` }}
          />
        ))}
        {tip && hovered != null && (
          <span
            className="pointer-events-none absolute bottom-[calc(100%+6px)] z-[2] rounded-[6px] bg-sz-n-900 px-[9px] py-1.5 text-[10.5px] leading-[1.5] whitespace-nowrap text-white"
            // 오른쪽 절반 막대는 툴팁을 왼쪽으로 펼친다 — 카드 밖으로 잘리지 않게
            style={
              hovered < bars.length / 2
                ? { left: `${(hovered / bars.length) * 100}%` }
                : { right: `${(1 - (hovered + 1) / bars.length) * 100}%` }
            }
          >
            <b className="font-semibold">
              {pad(tip.hour)}시{tip.collecting && " · 집계 중"}
            </b>
            <br />
            주문 {formatNumber(tip.orders)}건 · 결제 {formatNumber(tip.amount)}
            원
          </span>
        )}
      </div>
      <div className="mt-[3px] flex justify-between text-[10px] text-sz-n-400">
        {marks.map(hour => (
          <span key={hour}>{pad(hour)}시</span>
        ))}
        <span>지금 {pad(nowHour)}시</span>
      </div>
    </div>
  )
}

const pad = (hour: number) => String(hour).padStart(2, "0")

const hourTitle = (bucket: HomeLiveHour) =>
  `${pad(bucket.hour)}시 · 주문 ${formatNumber(bucket.orders)}건 · 결제 ${formatNumber(bucket.amount)}원${bucket.collecting ? " · 집계 중" : ""}`
