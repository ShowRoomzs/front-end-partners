import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  B,
  KpiCard,
  KpiGrid,
} from "@/features/performance/components/PerformanceParts"
import { Grp } from "@/features/performance/components/detail/PerformanceSections"
import { COST_MAX } from "@/features/performance/constants/params"
import type {
  PerformanceCost,
  PerformanceCostRequest,
} from "@/features/performance/types"
import {
  formatCostInput,
  formatNumber,
  formatWon,
  parseCostInput,
} from "@/features/performance/utils/format"
import {
  LTAB_HEAD,
  Note,
  Sec,
} from "@/features/settlement/components/detail/DetailParts"
import { cn } from "@/lib/utils"
import { useState } from "react"

type ExtraKey =
  | "packagingCost"
  | "shippingCost"
  | "returnDisposalCost"
  | "etcCost"

const EXTRA_ROWS: Array<{ key: ExtraKey; label: string; sub: string }> = [
  { key: "packagingCost", label: "부자재비", sub: "박스·완충재·증정품·인쇄물" },
  { key: "shippingCost", label: "배송비", sub: "실제 택배 계약 기준 지출액" },
  {
    key: "returnDisposalCost",
    label: "반품 폐기 손실",
    sub: "재판매 불가로 폐기한 상품의 원가",
  },
  { key: "etcCost", label: "기타", sub: "위에 해당하지 않는 이번 공구 지출" },
]

const INPUT =
  "h-[30px] w-full rounded-[6px] border border-sz-n-300 bg-white px-[9px] text-right text-[12px] text-sz-n-900 tabular-nums outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-50 disabled:text-sz-n-400"

/** 숫자만 받고 서버 한도(10억)를 넘는 입력은 받지 않는다 */
function CostInput(props: {
  value: number | null
  disabled: boolean
  label: string
  onChange: (value: number | null) => void
}) {
  return (
    <input
      className={INPUT}
      inputMode="numeric"
      aria-label={props.label}
      placeholder={props.disabled ? undefined : "0"}
      disabled={props.disabled}
      value={formatCostInput(props.value)}
      onChange={event => {
        const next = parseCostInput(event.target.value)
        if (next != null && next > COST_MAX) return
        props.onChange(next)
      }}
    />
  )
}

/**
 * ⑤ 원가 · 수익(D1-C 미입력 · D1-D 입력 완료 · D2 잠김) — 브랜드 전용, 이 섹션 밖으로 나가지 않는다.
 * 원가는 선택 입력이라 비어 있는 것이 기본 상태다. 저장은 전체 교체(PUT)이고 총 원가 · 수익 · 수익률은
 * 저장 응답(서버 계산)으로만 바꾼다 — 원가 소계만 입력하는 대로 미리 곱해 보여 준다(개당 원가 × 확정 수량).
 */
export default function CostSection(props: {
  cost: PerformanceCost
  isSaving: boolean
  onSave: (body: PerformanceCostRequest) => void
}) {
  const { cost, isSaving, onSave } = props
  const locked = !cost.editable
  const [unitCosts, setUnitCosts] = useState<Record<number, number | null>>(
    () =>
      Object.fromEntries(
        cost.items.map(item => [item.contractItemId, item.unitCost])
      )
  )
  const [extras, setExtras] = useState<Record<ExtraKey, number | null>>(() => ({
    packagingCost: cost.packagingCost,
    shippingCost: cost.shippingCost,
    returnDisposalCost: cost.returnDisposalCost,
    etcCost: cost.etcCost,
  }))

  const hasAnyInput =
    Object.values(unitCosts).some(value => value != null) ||
    Object.values(extras).some(value => value != null)

  const handleSave = () =>
    onSave({
      items: cost.items.map(item => ({
        contractItemId: item.contractItemId,
        unitCost: unitCosts[item.contractItemId] ?? null,
      })),
      ...extras,
    })

  const pendingSettlement = cost.totalCost.state === "PENDING_SETTLEMENT"
  const notComputed = !pendingSettlement && cost.totalCost.value == null
  const emptyText =
    cost.totalCost.basis ?? "개당 원가를 입력하면 수익이 계산됩니다"
  const head = cn(LTAB_HEAD, "text-right")
  const cell = "border-t border-sz-n-100 px-3 py-2.5"

  return (
    <>
      <Grp title="원가" sub="얼마가 남았나 · 브랜드 전용" />
      <Sec title="원가 · 수익" note="선택 입력 · 브랜드 전용">
        <Notice tone="neutral" className="mb-4">
          {locked ? (
            <>
              <B>집계가 끝나면 원가를 입력할 수 있습니다.</B> 확정 수량이 바뀌면
              원가 소계도 달라지므로, 반품·회수 처리가 완료된 뒤 입력합니다.
              입력한 원가는 인플루언서·운영자에게 공유되지 않습니다.
            </>
          ) : (
            <>
              <B>이 정보는 브랜드에게만 보입니다.</B> 입력한 원가는
              인플루언서·운영자에게 공유되지 않습니다.
            </>
          )}
        </Notice>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <td className={LTAB_HEAD}>상품</td>
              <td className={cn(head, "w-[110px]")}>확정 수량</td>
              <td className={cn(head, "w-[150px]")}>개당 원가</td>
              <td className={cn(head, "w-[150px]")}>원가 소계</td>
            </tr>
          </thead>
          <tbody className="[&>tr:first-child>td]:border-t-0">
            {cost.items.map(item => {
              const quantity = item.confirmedQuantity.value
              const projected = item.confirmedQuantity.state === "PROJECTED"
              const unitCost = unitCosts[item.contractItemId] ?? null
              const subtotal =
                !locked && unitCost != null && quantity != null
                  ? unitCost * quantity
                  : null
              return (
                <tr key={item.contractItemId}>
                  <td className={cell}>{item.productName}</td>
                  <td
                    className={cn(
                      cell,
                      "text-right tabular-nums",
                      projected && "text-sz-n-500"
                    )}
                  >
                    {quantity == null
                      ? "—"
                      : `${formatNumber(quantity)}개${projected ? " 예정" : ""}`}
                  </td>
                  <td className={cell}>
                    <CostInput
                      label={`${item.productName} 개당 원가`}
                      value={unitCost}
                      disabled={locked}
                      onChange={value =>
                        setUnitCosts(prev => ({
                          ...prev,
                          [item.contractItemId]: value,
                        }))
                      }
                    />
                  </td>
                  <td
                    className={cn(
                      cell,
                      "text-right tabular-nums",
                      subtotal == null && "text-sz-n-400"
                    )}
                  >
                    {subtotal == null ? "—" : formatWon(subtotal)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <table className="mt-3 w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <td className={LTAB_HEAD}>공구 전체 비용</td>
              <td className={cn(head, "w-[180px]")}>총액 입력</td>
            </tr>
          </thead>
          <tbody className="[&>tr:first-child>td]:border-t-0">
            {EXTRA_ROWS.map(row => (
              <tr key={row.key}>
                <td className={cell}>
                  {row.label}{" "}
                  <span className="text-[11px] text-sz-n-500">{row.sub}</span>
                </td>
                <td className={cell}>
                  <CostInput
                    label={row.label}
                    value={extras[row.key]}
                    disabled={locked}
                    onChange={value =>
                      setExtras(prev => ({ ...prev, [row.key]: value }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-end">
          <Btn
            variant="secondary"
            disabled={locked || !hasAnyInput}
            isLoading={isSaving}
            onClick={handleSave}
          >
            저장
          </Btn>
        </div>
        {notComputed ? (
          <div className="mt-4 rounded-[6px] border border-dashed border-sz-n-300 px-5 py-8 text-center text-[12px] text-sz-n-500">
            {emptyText.endsWith(".") ? emptyText : `${emptyText}.`}
          </div>
        ) : (
          <KpiGrid cols={3} className="mt-4 mb-3">
            <KpiCard label="총 원가" figure={cost.totalCost} unit="won" />
            <KpiCard
              label="원가 차감 후 수익"
              figure={cost.profit}
              unit="won"
            />
            <KpiCard label="수익률" figure={cost.profitRate} unit="rate" />
          </KpiGrid>
        )}
        <Note>
          여기서 원가는 상품이 소비자에게 도달하기까지{" "}
          <B>브랜드가 실제로 지출한 비용</B>입니다. 인플루언서 리워드 · PG 결제
          수수료 · 플랫폼 수수료는 <B>정산액에서 이미 차감</B>되었고, 고정
          지급비는 <B>수익 계산에 자동 반영</B>됩니다 — 여기에 다시 입력하지
          마세요.
        </Note>
      </Sec>
    </>
  )
}
