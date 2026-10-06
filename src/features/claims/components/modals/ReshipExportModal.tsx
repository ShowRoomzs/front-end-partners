import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  TK_CLASS,
  TROW_CLASS,
  TV_CLASS,
} from "@/features/contracts/components/shared/styles"
import {
  useClaimMutations,
  useGetReshipTemplate,
} from "@/features/claims/hooks/useClaimQueries"
import type { ClaimReshipColumn } from "@/features/claims/types"
import { cn } from "@/lib/utils"
import { Check, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

/**
 * 시안 E1 — 재발송 목록 엑셀 다운로드. 택배사마다 양식이 달라 고정 양식이 없다 —
 * 컬럼을 골라 **선택한 순서대로**(위→아래 = 엑셀 좌→우) 만든다. 뒤에 빈 택배사·송장번호 2열이 붙는다.
 * 회수는 소비자가 직접 발송하므로 회수 쪽에는 이 경로가 없다.
 */
export default function ReshipExportModal(props: {
  isOpen: boolean
  /** 선택 건 — 비어 있으면 재발송 대기 전체 */
  claimIds: Array<number>
  totalCount: number
  onClose: () => void
}) {
  const { isOpen, claimIds, totalCount, onClose } = props
  const { data: template, isLoading } = useGetReshipTemplate(isOpen)
  const { exportReshipments } = useClaimMutations()
  const [columns, setColumns] = useState<Array<ClaimReshipColumn>>([])
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && template) {
      setColumns(template.columns)
      setSaveAsDefault(false)
    }
  }, [isOpen, template])

  const headerOf = (code: ClaimReshipColumn) =>
    template?.available.find(item => item.code === code)?.header ?? code

  const rest = (template?.available ?? []).filter(
    item => !columns.includes(item.code)
  )

  const move = (from: number, to: number) => {
    if (from === to) return
    setColumns(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const handleDownload = async () => {
    try {
      await exportReshipments.mutateAsync({
        claimIds: claimIds.length > 0 ? claimIds : null,
        columns,
        saveAsDefault,
      })
      toast.success("재발송 목록을 내려받았습니다.")
      onClose()
    } catch {
      // 토스트는 apiInstance가 띄운다
    }
  }

  const target = claimIds.length > 0 ? claimIds.length : totalCount
  // 업로드 파싱이 「접수번호」 열을 머리글로 찾는다 — 빼면 채운 파일을 다시 올릴 수 없다
  const missingClaimNumber =
    columns.length > 0 && !columns.includes("CLAIM_NUMBER")

  return (
    <ModalShell
      isOpen={isOpen}
      title="재발송 목록을 내려받을까요?"
      width={480}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={columns.length === 0 || target === 0}
            isLoading={exportReshipments.isPending}
            onClick={handleDownload}
          >
            다운로드
          </Btn>
        </>
      }
    >
      <div className="mb-4 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[2px]">
        <div className={TROW_CLASS}>
          <div className={TK_CLASS} style={{ width: 96 }}>
            대상
          </div>
          <div className={`${TV_CLASS} tabular-nums`}>
            <b className="font-semibold text-sz-n-900">{target}건</b> ·{" "}
            {claimIds.length > 0 ? "선택한 재발송" : "재발송 대기 전체"}
          </div>
        </div>
        <div className={TROW_CLASS}>
          <div className={TK_CLASS} style={{ width: 96 }}>
            파일 형식
          </div>
          <div className={TV_CLASS}>XLSX</div>
        </div>
      </div>

      <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
        포함 컬럼<span className="ml-0.5 text-sz-danger-text">*</span>
      </label>
      <div className="mb-2 text-[11px] text-sz-n-500">
        택배사마다 양식이 달라{" "}
        <b className="font-semibold">고정 양식을 두지 않습니다.</b> 넣을 컬럼을
        골라 <b className="font-semibold">선택한 순서대로</b> 열이 만들어집니다.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-4 animate-spin text-sz-n-400" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
          <div className="flex items-center gap-2 border-b border-sz-n-200 bg-sz-n-50 px-3 py-2 text-[11px] text-sz-n-600">
            <span className="flex-1">
              선택한 컬럼{" "}
              <b className="tabular-nums text-sz-n-900">{columns.length}</b>개 —
              위에서 아래가 엑셀의 좌→우 순서입니다
            </span>
            <span className="text-sz-n-500">드래그로 순서 변경</span>
          </div>
          <div className="flex flex-col gap-1 px-2.5 py-2">
            {columns.map((code, index) => (
              <div
                key={code}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, index)
                  setDragIndex(null)
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "flex cursor-grab items-center gap-[9px] rounded-[6px] border border-sz-n-200 bg-white px-2 py-1.5 text-[12px]",
                  dragIndex === index && "opacity-50"
                )}
              >
                <span className="text-[11px] tracking-[1px] text-sz-n-300">
                  ⠿
                </span>
                <b className="w-4 text-[11px] tabular-nums text-sz-n-500">
                  {index + 1}
                </b>
                <span className="flex-1 text-sz-n-900">{headerOf(code)}</span>
                <button
                  type="button"
                  onClick={() =>
                    setColumns(prev => prev.filter(item => item !== code))
                  }
                  className="cursor-pointer text-[11px] text-sz-n-400 hover:text-sz-n-700"
                >
                  제거
                </button>
              </div>
            ))}
          </div>
          {rest.length > 0 && (
            <div className="border-t border-sz-n-100 bg-sz-n-50 px-3 py-[9px]">
              <div className="mb-[7px] text-[11px] text-sz-n-600">
                추가할 컬럼
              </div>
              <div className="flex flex-wrap gap-[5px]">
                {rest.map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setColumns(prev => [...prev, item.code])}
                    className="cursor-pointer rounded-[4px] bg-sz-n-100 px-2 py-1 text-[11px] text-sz-n-700 hover:bg-sz-n-200"
                  >
                    + {item.header}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {missingClaimNumber && (
        <p className="mt-1.5 text-[11px] text-sz-warning-text">
          「접수번호」를 빼면 송장을 채운 파일을 다시 올릴 수 없습니다.
        </p>
      )}

      <button
        type="button"
        role="checkbox"
        aria-checked={saveAsDefault}
        onClick={() => setSaveAsDefault(prev => !prev)}
        className="mt-3 flex w-full cursor-pointer items-start gap-[9px] rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-left"
      >
        <span
          className={cn(
            "mt-px flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
            saveAsDefault
              ? "border-sz-accent-500 bg-sz-accent-500"
              : "border-sz-n-300 bg-white"
          )}
        >
          {saveAsDefault && (
            <Check className="size-[9px] text-white" strokeWidth={3} />
          )}
        </span>
        <span className="text-[12px] leading-[1.55] text-sz-n-900">
          <b className="font-semibold">이 구성을 기본값으로 저장</b>
          <span className="mt-[3px] block text-[11px] text-sz-n-500">
            다음부터 같은 컬럼·순서로 열립니다. 기본정보 관리에서 바꿀 수
            있습니다.
          </span>
        </span>
      </button>

      <div className="mt-4 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700">
        내려받은 파일을 택배사 시스템에 올려 송장을 발급받은 뒤, 송장이 채워진
        파일을 <b className="font-semibold text-sz-n-900">[송장 일괄 업로드]</b>
        로 다시 올리거나 각 행에{" "}
        <b className="font-semibold text-sz-n-900">직접 입력</b>해 확정하세요.
      </div>
    </ModalShell>
  )
}
