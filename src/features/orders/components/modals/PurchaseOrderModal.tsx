import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  B,
  GbModal,
  MHint,
  MLabel,
  MSum,
  MSumRow,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts"
import { Cb } from "@/features/orders/components/shared/OrderParts"
import { useGetPurchaseOrderTemplate } from "@/features/orders/hooks/useOrderQueries"
import type { PurchaseOrderColumn } from "@/features/orders/types"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

export interface PurchaseOrderTarget {
  /** 선택 건 — 비어 있으면 현재 탭·조회 조건 전체 */
  ids: Array<number>
  /** 대상 건수 — 선택 없이 열면 목록 총 건수 */
  count: number
  /** 공구별 건수 — 선택 건일 때만 안다 */
  groupBuys: Array<{ name: string; count: number }>
  /** 대상에 신규 주문이 있으면 다운로드가 곧 준비 시작이다 */
  startsPreparation: boolean
}

/**
 * E1 발주서 엑셀 다운로드.
 *
 * - **다운로드 = 준비 시작**(rev.5 · 34 설계서 3-1) — 결제완료에서는 소비자가 배송지를 바꿀 수 있어
 *   다운로드 시점에 상품준비중으로 넘긴다. 「다운로드만」 선택지는 없다.
 * - 택배사마다 양식이 달라 고정 양식을 두지 않는다(rev.6) — 컬럼을 골라 **선택한 순서 = 엑셀 좌→우 열**.
 */
export default function PurchaseOrderModal(props: {
  target: PurchaseOrderTarget
  isLoading: boolean
  onClose: () => void
  onConfirm: (
    columns: Array<PurchaseOrderColumn>,
    saveAsDefault: boolean
  ) => void
}) {
  const { target, isLoading, onClose, onConfirm } = props
  const { data: template, isLoading: isTemplateLoading } =
    useGetPurchaseOrderTemplate(true)

  const [columns, setColumns] = useState<Array<PurchaseOrderColumn> | null>(
    null
  )
  const [saveAsDefault, setSaveAsDefault] = useState(true)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (template && columns === null) {
      setColumns(template.columns)
    }
  }, [template, columns])

  const headerOf = useMemo(() => {
    const map = new Map(
      (template?.available ?? []).map(item => [item.code, item.header])
    )
    return (code: PurchaseOrderColumn) => map.get(code) ?? code
  }, [template])

  const selected = columns ?? []
  const addable = (template?.available ?? []).filter(
    item => !selected.includes(item.code)
  )

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= selected.length) {
      return
    }
    const next = [...selected]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setColumns(next)
  }

  return (
    <GbModal
      title="발주서를 내려받을까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={selected.length === 0 || target.count === 0}
            isLoading={isLoading}
            onClick={() => onConfirm(selected, saveAsDefault)}
          >
            {target.startsPreparation ? "다운로드 · 준비 시작" : "다운로드"}
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="대상">
          <B className="text-sz-n-900">{target.count}건</B> ·{" "}
          {target.ids.length > 0 ? "선택한 주문" : "현재 탭·조회 조건 전체"}
        </MSumRow>
        {target.groupBuys.length > 0 && (
          <MSumRow label="공구">
            {target.groupBuys
              .map(item => `${item.name} ${item.count}건`)
              .join(" · ")}
          </MSumRow>
        )}
      </MSum>

      <MLabel required first>
        포함 컬럼
      </MLabel>
      <MHint className="mb-2 mt-0">
        택배사마다 양식이 달라 <B>고정 양식을 두지 않습니다.</B> 넣을 컬럼을
        골라 <B>선택한 순서대로</B> 열이 만들어집니다.
      </MHint>

      <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
        <div className="flex items-center gap-2 border-b border-sz-n-200 bg-sz-n-50 px-3 py-2 text-[11px] text-sz-n-600">
          <span className="flex-1">
            선택한 컬럼{" "}
            <B className="tabular-nums text-sz-n-900">{selected.length}</B>개 —
            위에서 아래가 엑셀의 좌→우 순서입니다
          </span>
          <span className="text-sz-n-500">드래그로 순서 변경</span>
        </div>

        {isTemplateLoading ? (
          <div className="flex justify-center py-6 text-sz-n-400">
            <Loader2 className="size-4 animate-spin" aria-hidden />
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-2.5 py-2">
            {selected.map((code, index) => (
              <div
                key={code}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) {
                    move(dragIndex, index)
                  }
                  setDragIndex(null)
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "group flex cursor-grab items-center gap-[9px] rounded-[6px] border border-sz-n-200 bg-white px-2 py-1.5 text-[12px]",
                  dragIndex === index && "opacity-50"
                )}
              >
                <span
                  aria-hidden
                  className="text-[11px] tracking-[1px] text-sz-n-300"
                >
                  ⠿
                </span>
                <b className="w-4 text-[11px] font-semibold tabular-nums text-sz-n-500">
                  {index + 1}
                </b>
                <span className="flex-1 text-sz-n-900">{headerOf(code)}</span>
                {/* 드래그를 못 쓰는 환경(키보드)을 위한 한 칸 이동 */}
                <button
                  type="button"
                  aria-label={`${headerOf(code)} 위로`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className="cursor-pointer px-1 text-[10px] text-sz-n-400 opacity-0 hover:text-sz-n-700 focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-default disabled:!opacity-0"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`${headerOf(code)} 아래로`}
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, index + 1)}
                  className="cursor-pointer px-1 text-[10px] text-sz-n-400 opacity-0 hover:text-sz-n-700 focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-default disabled:!opacity-0"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setColumns(selected.filter(item => item !== code))
                  }
                  className="cursor-pointer text-[11px] text-sz-n-400 hover:text-sz-danger-text"
                >
                  제거
                </button>
              </div>
            ))}
            {selected.length === 0 && (
              <div className="py-3 text-center text-[11px] text-sz-n-400">
                아래에서 넣을 컬럼을 골라 주세요
              </div>
            )}
          </div>
        )}

        {addable.length > 0 && (
          <div className="border-t border-sz-n-100 bg-sz-n-50 px-3 py-[9px]">
            <div className="mb-[7px] text-[11px] text-sz-n-600">
              추가할 컬럼
            </div>
            <div className="flex flex-wrap gap-[5px]">
              {addable.map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setColumns([...selected, item.code])}
                  className="cursor-pointer rounded-[4px] bg-sz-n-100 px-2 py-1 text-[11px] text-sz-n-700 hover:bg-sz-n-200"
                >
                  + {item.header}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start gap-[9px] rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px]">
        <Cb
          label="이 구성을 기본값으로 저장"
          checked={saveAsDefault}
          onChange={setSaveAsDefault}
        />
        <span className="text-[12px] leading-[1.55] text-sz-n-900">
          <B>이 구성을 기본값으로 저장</B>
          <span className="mt-[3px] block text-[11px] text-sz-n-500">
            다음 다운로드부터 이 컬럼과 순서가 미리 선택됩니다.
          </span>
        </span>
      </div>

      {target.startsPreparation && (
        <Notice tone="neutral" className="mt-3">
          <B>다운로드하면 이 주문들은 상품준비중으로 넘어갑니다.</B> 그 시점부터
          소비자는 <B>배송지를 바꾸거나 단순 취소할 수 없습니다</B> — 발주서에
          적힌 주소가 실제 배송지로 고정됩니다.
        </Notice>
      )}

      <MWarn>
        <B className="text-sz-n-900">
          다운로드한 파일을 택배사 시스템에 업로드하면 송장번호를 발급받을 수
          있습니다.
        </B>{" "}
        택배사가 요구하는 컬럼만 골라 두면{" "}
        <B className="text-sz-n-900">매번 손보지 않아도</B> 그대로 올릴 수
        있습니다. 송장이 채워진 엑셀을 다시{" "}
        <B className="text-sz-n-900">[송장 일괄 업로드]</B>로 올리면 목록에
        채워지고, 확인 뒤 등록하면 배송중으로 전환됩니다.
      </MWarn>
    </GbModal>
  )
}
