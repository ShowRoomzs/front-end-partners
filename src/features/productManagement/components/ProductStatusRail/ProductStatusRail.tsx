import { formatDateTimeShort } from "@/common/utils/formatDate"
import {
  DisplayStatusBadge,
  GroupBuyStatusBadge,
} from "@/features/productManagement/components/StatusBadge/StatusBadge"
import type {
  ProductDetailResponse,
  ProductHistoryItem,
} from "@/features/productManagement/services/productService"
import { getHideReasonLabel } from "@/features/productManagement/utils/productPermission"
import { cn } from "@/lib/utils"

function Card(props: {
  title: string
  note?: string
  tone?: "default" | "danger" | "neutral"
  children: React.ReactNode
}) {
  const { title, note, tone = "default", children } = props

  return (
    <section className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between border-b border-sz-n-200 bg-sz-n-50 px-4 py-3.5">
        <h2
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-semibold",
            tone === "danger" ? "text-sz-danger-text" : "text-sz-n-900",
            tone === "neutral" && "text-sz-n-700"
          )}
        >
          {tone === "danger" && <span>⚠</span>}
          {tone === "neutral" && <span>ⓘ</span>}
          {title}
        </h2>
        {note && <span className="text-[11px] text-sz-n-500">{note}</span>}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  )
}

const DOT_CLASS: Record<string, string> = {
  accent: "bg-sz-accent-500",
  success: "bg-sz-success-text",
  muted: "bg-sz-n-500",
  warn: "bg-sz-warning-text",
}

function historyTone(item: ProductHistoryItem) {
  if (item.historyType === "HIDDEN" || item.historyType === "HIDE_REQUESTED") {
    return "muted"
  }
  if (item.historyType === "PENDING_REVIEW") {
    return "warn"
  }
  if (
    item.historyType === "REDISPLAYED" ||
    item.historyType === "PRODUCT_CREATED"
  ) {
    return "success"
  }
  return "accent"
}

interface ProductStatusRailProps {
  detail: ProductDetailResponse
}

/**
 * 수정 화면 우측 레일 — 상태 관리 + 미진열 사유 + 처리 이력.
 *
 * ⚠️ **액션 버튼이 없다.** 진열 상태 전환은 운영자 전용 권한이라 브랜드 화면에는
 * 조회만 노출한다(§11-2·§11-12). 어드민 상세와 구성은 같되 버튼만 빠진 형태다.
 */
export default function ProductStatusRail({ detail }: ProductStatusRailProps) {
  const history = detail.processingHistory ?? []
  const hideInfo = detail.latestHideInfo

  // 사유 패널은 미진열 계열에서만 뜬다. 재검토 대기는 트리거가 미진열 처리가 아니라
  // "브랜드의 정보 수정"이라 새로 지적된 사유가 없어 표시할 내용 자체가 없다(§11-11).
  const showHideReason =
    !!hideInfo &&
    (detail.displayStatus === "HIDDEN" ||
      detail.displayStatus === "HIDE_REQUEST")
  const isBrandRequest = hideInfo?.hideReasonType === "BRAND_REQUEST"

  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-4">
      <Card title="상품 관리">
        <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">진열 상태</span>
          <DisplayStatusBadge status={detail.displayStatus} />
        </div>
        <div className="flex items-center justify-between gap-2.5 pt-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">공구 상태</span>
          <GroupBuyStatusBadge status={detail.groupBuyStatus} />
        </div>
      </Card>

      {showHideReason && hideInfo && (
        <Card title="미진열 사유" tone={isBrandRequest ? "neutral" : "danger"}>
          <div className="mb-3">
            <div className="mb-1 text-[11px] text-sz-n-500">사유</div>
            <div className="text-[12px] font-medium text-sz-n-900">
              {getHideReasonLabel(hideInfo.hideReasonType)}
            </div>
          </div>
          {hideInfo.hideDetail && (
            <div className="mb-3">
              <div className="mb-1 text-[11px] text-sz-n-500">상세 내용</div>
              <div className="rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[12px] leading-relaxed text-sz-n-700">
                {hideInfo.hideDetail}
              </div>
            </div>
          )}
          <div className="text-[11px] text-sz-n-500">
            {[formatDateTimeShort(hideInfo.hiddenAt), hideInfo.processorName]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </Card>
      )}

      <Card title="처리 이력" note="최신순">
        {history.length === 0 ? (
          <p className="text-[12px] text-sz-n-500">처리 이력이 없습니다.</p>
        ) : (
          <div>
            {history.map(item => (
              <div
                key={item.historyId}
                className="flex gap-2.5 border-b border-sz-n-100 py-[9px] last:border-b-0"
              >
                <span
                  className={cn(
                    "mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full",
                    DOT_CLASS[historyTone(item)]
                  )}
                />
                <div className="min-w-0">
                  {/* title은 서버가 historyType.description으로 채워 내려준다 */}
                  <div className="text-[12px] text-sz-n-900">{item.title}</div>
                  <div className="text-[11px] text-sz-n-500">
                    {[formatDateTimeShort(item.createdAt), item.processorName]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {item.hideReason && (
                    <div className="mt-1.5 rounded-[6px] bg-sz-n-50 px-2.5 py-2 text-[11px] leading-relaxed text-sz-n-600">
                      <b className="font-semibold text-sz-n-700">사유</b> —{" "}
                      {item.hideReason.reasonDescription}
                      {item.hideReason.detail && ` · ${item.hideReason.detail}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
