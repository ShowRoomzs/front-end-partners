import DetailCard from "@/common/components/DetailCard/DetailCard"
import type { ReactNode } from "react"
import Notice from "@/common/components/Notice/Notice"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import {
  formatKRW,
  formatNumber,
  formatPercent,
  periodText,
} from "@/features/contracts/utils/format"
import {
  B,
  FRow,
  FSub,
  GbBadge,
  GbEmpty,
  KpiRow,
  type KpiItem,
} from "@/features/groupBuy/components/shared/GbParts"
import { POST_REJECT_REASON_LABEL } from "@/features/groupBuy/constants/params"
import {
  type Detail,
  d,
  dt,
  hasNamedOptions,
  lastEventAt,
  quantityText,
} from "@/features/groupBuy/utils/view"

/** 시안 「공구 정보」 — 계약에서 상속한 값만 읽기 전용으로 */
export function GroupBuyInfoCard(props: {
  detail: Detail
  onOpenThread: () => void
  onOpenContract: () => void
}) {
  const { detail, onOpenThread, onOpenContract } = props
  const { counterparty, contract, timeline, fixedFee, groupBuy } = detail
  const isSuspended = groupBuy.status === "SUSPENDED"
  // 시안 B4d 「(15일 · 7일 연장)」 — 수락된 연장은 기간 표기에 함께 적는다
  const extendedDays =
    detail.extension.status === "ACCEPTED" ? detail.extension.days : null

  return (
    <DetailCard title="공구 정보" note="계약에서 상속 · 변경 불가">
      <FRow label="인플루언서">
        {counterparty.name}{" "}
        {detail.permissions.canOpenPairThread && (
          <button type="button" className={FLINK_CLASS} onClick={onOpenThread}>
            스레드 열기
          </button>
        )}
      </FRow>
      <FRow label="원 계약">
        <span className="tabular-nums">{contract.contractNumber}</span>{" "}
        <button type="button" className={FLINK_CLASS} onClick={onOpenContract}>
          계약서 보기
        </button>
        {!isSuspended && (
          <FSub>{d(contract.concludedAt)} 체결 · 계약 1건당 공구 1건</FSub>
        )}
      </FRow>
      <FRow label="공구 기간">
        <span className="tabular-nums">
          {periodText(timeline.startAt, timeline.endAt)}{" "}
          <span className="text-sz-n-500">
            {isSuspended
              ? groupBuy.openedAt === null
                ? "(시작 전 중단)"
                : `(${timeline.elapsedDays}일차 중단)`
              : extendedDays
                ? `(${timeline.totalDays}일 · ${extendedDays}일 연장)`
                : `(${timeline.totalDays}일)`}
          </span>
        </span>
      </FRow>
      <FRow label="고정 지급비">
        {fixedFee.amount === null ? (
          "없음"
        ) : (
          <>
            <span className="tabular-nums">{formatKRW(fixedFee.amount)}</span>
            <FSub>
              지급 시점: <B>{fixedFee.triggerLabel ?? "—"}</B> · 브랜드 직접
              지급
            </FSub>
          </>
        )}
      </FRow>
    </DetailCard>
  )
}

/** 시안 「공구 상품 항목」 — 상품명만 링크(상품 상세 · 새 탭), 나머지는 계약 확정값 */
export function GroupBuyItemsCard(props: { detail: Detail }) {
  const { detail } = props
  // 시안 B1·B2·B2a만 — 준비완료(B3)부터는 안내 없이 항목만 둔다
  const showNotice = detail.groupBuy.status === "PREPARING"

  return (
    <DetailCard
      title="공구 상품 항목"
      note={`${detail.items.length}건 · 상품명을 누르면 상품 상세로 이동`}
    >
      <Terms>
        {detail.items.map((item, index) => (
          <TermRow
            key={`${item.productId ?? "x"}-${index}`}
            labelWidth={176}
            label={
              item.productId !== null ? (
                <button
                  type="button"
                  className={`${FLINK_CLASS} text-left`}
                  onClick={() =>
                    window.open(`/product/edit/${item.productId}`, "_blank")
                  }
                >
                  {item.productName}
                </button>
              ) : (
                item.productName
              )
            }
          >
            <span className="tabular-nums">
              정가 {formatKRW(item.regularPrice)} · 공구가{" "}
              <B className="text-sz-n-900">{formatKRW(item.groupBuyPrice)}</B> ·
              리워드율{" "}
              <B className="text-sz-n-900">{formatPercent(item.rewardRate)}</B>{" "}
              · 예상 리워드 {formatKRW(item.expectedUnitReward)} · 최소 물량{" "}
              <B className="text-sz-n-900">
                {item.minQuantity === null
                  ? "—"
                  : `${formatNumber(item.minQuantity)}개`}
              </B>
            </span>
            {/* 옵션 상품은 옵션마다 판매가·최소 물량이 다르다 — 최소 물량은 옵션끼리 대체 충족되지 않는다 */}
            {hasNamedOptions(item) && (
              <FSub>
                옵션 —{" "}
                {item.options
                  .map(
                    option =>
                      `${option.variantName ?? "단품"} ${formatKRW(option.salePrice)} · 최소 ${
                        option.minQuantity === null
                          ? "—"
                          : `${formatNumber(option.minQuantity)}개`
                      }`
                  )
                  .join(" / ")}
              </FSub>
            )}
          </TermRow>
        ))}
      </Terms>
      {showNotice && (
        <Notice tone="neutral" className="mt-3">
          공구가·리워드율·최소 물량은 <B>체결된 계약의 확정값</B>이라 공구에서
          바꿀 수 없습니다. 조건을 바꾸려면 이 공구를 중단하고 새 계약을
          체결해야 합니다.
        </Notice>
      )}
    </DetailCard>
  )
}

/**
 * 판매 실적 KPI — 진행중·중단 예정은 실시간(LIVE), 정산완료는 확정(SETTLED), 중단은 중단 시점.
 * 종료(정산 대기)에는 서버가 값을 내리지 않는다 — 잠정치가 지급액으로 읽히기 때문이다.
 * 판매 모듈이 없으면 null이라 0이 아니라 「—」로 둔다.
 */
export function GroupBuySalesCard(props: { detail: Detail }) {
  const { detail } = props
  const { sales, groupBuy, orderClosure } = detail
  const confirmed = orderClosure?.purchaseConfirmedCount ?? null
  const refunded = orderClosure?.refundedCount ?? null
  const basis =
    groupBuy.status === "SETTLED"
      ? "SETTLED"
      : groupBuy.status === "SUSPENDED"
        ? "AT_SUSPENSION"
        : "LIVE"
  const { total, breakdown } = quantityText(detail)
  const orders = sales ? formatNumber(sales.orderCount) : "—"
  const quantity = sales ? formatNumber(total) : "—"
  const amount = sales ? formatNumber(sales.amount) : "—"
  const reward = sales ? formatNumber(sales.rewardAmount) : "—"

  const items: Array<KpiItem> =
    basis === "SETTLED"
      ? [
          {
            value: orders,
            label: "주문",
            // 시안 B6 「확정 310 · 환불 2」 — 판매 모듈이 내역을 모르면 「확정」만
            sub:
              confirmed !== null && refunded !== null
                ? `확정 ${formatNumber(confirmed)} · 환불 ${formatNumber(refunded)}`
                : "확정",
          },
          { value: quantity, label: "판매 수량", sub: breakdown || "—" },
          { value: amount, label: "판매 금액(원)", sub: "확정" },
          { value: reward, label: "인플루언서 리워드(원)", sub: "지급 완료" },
        ]
      : basis === "AT_SUSPENSION"
        ? [
            { value: orders, label: "주문", sub: "배송·환불 처리 필요" },
            { value: quantity, label: "판매 수량", sub: breakdown || "—" },
            { value: amount, label: "판매 금액(원)", sub: "확정 시 변동" },
            {
              value: reward,
              label: "인플루언서 리워드(원)",
              sub: "확정분 지급",
            },
          ]
        : [
            { value: orders, label: "주문", sub: "누적" },
            { value: quantity, label: "판매 수량", sub: breakdown || "—" },
            { value: amount, label: "판매 금액(원)", sub: "취소·반품 제외" },
            {
              value: reward,
              label: "인플루언서 리워드(원)",
              sub: "정산 시 지급",
            },
          ]

  const title =
    basis === "SETTLED"
      ? "확정 실적"
      : basis === "AT_SUSPENSION"
        ? "중단 시점 실적"
        : "판매 실적"
  const settledAt = lastEventAt(detail, "SALES_FINALIZED")
  // 시안 B6 「구매확정 310건(…) · 환불 2건 제외 · 2026.09.01 확정」
  const settledNote = [
    confirmed !== null ? `구매확정 ${formatNumber(confirmed)}건` : null,
    refunded !== null ? `환불 ${formatNumber(refunded)}건 제외` : null,
    settledAt ? `${d(settledAt)} 확정` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const note =
    basis === "SETTLED"
      ? settledNote || "정산 확정 실적"
      : basis === "AT_SUSPENSION"
        ? "접수분은 판매 관리에서 계속 처리됩니다"
        : "판매 관리 집계 기준 · 취소·반품 반영"

  return (
    <DetailCard title={title} note={note}>
      <KpiRow items={items} />
      {basis === "AT_SUSPENSION" && (
        <Notice tone="warn" className="mt-3">
          공구가 중단돼도 <B>접수된 주문의 배송 의무는 남습니다.</B> 미종결
          주문이 있으면 판매 관리에서 처리해 주세요.
        </Notice>
      )}
    </DetailCard>
  )
}

/** 게시물 카드 하단 안내 — 왜 내려갔는지(정상 종료 / 조기 마감 / 중단)를 문장이 구분한다 */
function postFooter(detail: Detail) {
  const { groupBuy, closure } = detail
  switch (groupBuy.status) {
    case "READY":
    case "IN_PROGRESS":
    case "SUSPENSION_SCHEDULED":
      return (
        <>
          게시물은 <B>인플루언서 소관</B>이라 브랜드가 수정·숨김 처리할 수
          없습니다. 사실과 다른 내용이 있으면 <B>스레드에서 수정을 요청</B>하고,
          법령 위반이 의심되면 운영자에게 신고하세요.
        </>
      )
    case "ENDED":
      return groupBuy.closeType === "EARLY_CLOSED" ? (
        <>
          조기 마감으로 게시물이 <B>예정보다 일찍 내려갔습니다</B>. 원문은
          그대로 보관됩니다.
        </>
      ) : (
        <>
          공구가 끝나 게시물은 <B>쇼룸에서 내려갔습니다</B>. 이행 여부를
          확인하거나 분쟁 시 근거로 쓸 수 있도록 <B>원문은 그대로 보관</B>
          됩니다.
        </>
      )
    case "SETTLED":
      return (
        <>
          정산이 끝난 뒤에도 <B>원문은 보관</B>됩니다 — 콘텐츠 이행 여부를
          나중에 확인할 근거가 됩니다.
        </>
      )
    case "SUSPENDED":
      return closure?.source === "REQUEST" || !closure?.source ? (
        <>
          공구 중단으로 게시물이 <B>강제로 내려갔습니다</B>. 분쟁 대비로{" "}
          <B>원문은 그대로 보관</B>되며, 콘텐츠 이행 여부를 확인할 근거가
          됩니다.
        </>
      ) : (
        <>
          직권 중단으로 게시물이 내려갔습니다. 원문은 그대로 보관되며 이의 제기
          시 근거로 쓰입니다. <B>게시물을 고칠 권한은 인플루언서에게</B>{" "}
          있습니다.
        </>
      )
    default:
      return null
  }
}

/** 게시물 메타 줄(`.pm2`) — 등록 · 오픈 · 반려/숨김/내려감 */
function postMeta(detail: Detail) {
  const { post, groupBuy, timeline, closure } = detail
  const parts: Array<ReactNode> = []
  if (post.submittedAt) {
    parts.push(`등록 ${dt(post.submittedAt)}`)
  }
  switch (post.status) {
    case "PENDING_APPROVAL":
      parts.push("운영자 검토 중")
      break
    case "REJECTED": {
      // 서버가 마지막 반려 시각을 내린다(재제출 후에도 남는다) — 이력 조회는 구버전 응답 대비
      const rejectedAt = post.rejectedAt ?? lastEventAt(detail, "OPEN_REJECTED")
      parts.push(
        <B key="rej" className="text-sz-warning-text">
          {rejectedAt ? `${dt(rejectedAt)} 반려` : "반려"}
        </B>
      )
      break
    }
    case "SCHEDULED":
      parts.push(`오픈 예정 ${dt(timeline.startAt)}`)
      break
    case "EXPOSED":
      parts.push(`오픈 ${dt(post.openedAt ?? groupBuy.openedAt)}`)
      break
    case "HIDDEN":
      parts.push(`오픈 ${dt(post.openedAt ?? groupBuy.openedAt)}`)
      parts.push(
        <B key="hid" className="text-sz-warning-text">
          {dt(post.hiddenAt)} 운영자 노출 중지
        </B>
      )
      break
    case "CLOSED": {
      if (post.openedAt ?? groupBuy.openedAt) {
        parts.push(`오픈 ${dt(post.openedAt ?? groupBuy.openedAt)}`)
      }
      const closedAt = dt(post.closedAt ?? groupBuy.endedAt)
      const reason =
        groupBuy.status === "SUSPENDED"
          ? closure?.source === "REQUEST" || !closure?.source
            ? "중단으로 내려감"
            : "직권 중단으로 내려감"
          : groupBuy.closeType === "EARLY_CLOSED"
            ? "조기 마감"
            : "노출 종료"
      parts.push(
        groupBuy.status === "SETTLED" ? (
          `${closedAt} ${reason}`
        ) : (
          <B key="cls">{`${closedAt} ${reason}`}</B>
        )
      )
      break
    }
    default:
      break
  }
  return parts
}

/** 시안 「인플루언서 게시물」 — 열람 전용. 사진 없이 제목 · 본문 · 담긴 상품만 */
export function GroupBuyPostCard(props: { detail: Detail }) {
  const { detail } = props
  const { post, items } = detail
  const footer = postFooter(detail)
  const hasPost = post.status !== "NOT_WRITTEN" && post.status !== "WRITING"
  const meta = postMeta(detail)

  return (
    <DetailCard
      title="인플루언서 게시물"
      note="쇼룸 게시물 · 인플루언서가 작성 · 열람 전용"
    >
      {!hasPost ? (
        <GbEmpty title="아직 등록된 게시물이 없습니다" compact>
          {post.status === "WRITING"
            ? "인플루언서가 게시물을 작성하고 있습니다. 등록하면 여기에서 볼 수 있습니다."
            : "인플루언서가 쇼룸에 공구 게시물을 등록하면 여기에서 볼 수 있습니다."}
        </GbEmpty>
      ) : (
        <>
          <div className="rounded-[6px] border border-sz-n-200 px-4 py-3.5">
            <div className="mb-[3px] flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-sz-n-900">
              {post.title ?? "(제목 없음)"}
              <GbBadge tone={post.statusTone}>{post.statusLabel}</GbBadge>
            </div>
            {post.content && (
              <div className="whitespace-pre-line text-[11px] leading-[1.65] text-sz-n-600">
                {post.content}
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {items.map((item, index) => (
                <span
                  key={`${item.productId ?? "x"}-${index}`}
                  className="rounded-[6px] bg-sz-n-100 px-[9px] py-1 text-[11px] text-sz-n-700"
                >
                  {item.productName} · {formatKRW(item.groupBuyPrice)}
                </span>
              ))}
            </div>
            {meta.length > 0 && (
              <div className="mt-1.5 text-[11px] tabular-nums text-sz-n-500">
                {meta.map((part, index) => (
                  <span key={index}>
                    {index > 0 && " · "}
                    {part}
                  </span>
                ))}
              </div>
            )}
            {post.status === "REJECTED" && post.rejectReason && (
              <Notice tone="warn" className="mt-2.5">
                <B>반려 사유</B> —{" "}
                {post.rejectReason.detail ??
                  POST_REJECT_REASON_LABEL[post.rejectReason.code] ??
                  post.rejectReason.code}
              </Notice>
            )}
          </div>
          {footer && (
            <Notice tone="neutral" className="mt-3">
              {footer}
            </Notice>
          )}
        </>
      )}
    </DetailCard>
  )
}
