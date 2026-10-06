import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  TK_CLASS,
  TROW_CLASS,
  TV_CLASS,
} from "@/features/contracts/components/shared/styles"
import { useClaimMutations } from "@/features/claims/hooks/useClaimQueries"
import type { ReshipParseResponse } from "@/features/claims/types"
import { useRef, useState } from "react"

/**
 * 시안 E2 — 재발송 송장 일괄 업로드. 검증은 **상태를 바꾸지 않는다** —
 * [등록하기]를 눌러도 재발송 목록의 택배사·송장 칸이 채워질 뿐이고, 확정은 [N건 송장 등록] 하나다.
 * 오류 행은 제외하고 나머지만 채운다.
 */
export default function ReshipUploadModal(props: {
  isOpen: boolean
  onClose: () => void
  onFill: (rows: ReshipParseResponse["rows"]) => void
}) {
  const { isOpen, onClose, onFill } = props
  const { parseReshipments } = useClaimMutations()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<ReshipParseResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const close = () => {
    setFileName(null)
    setResult(null)
    onClose()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setResult(null)
    try {
      setResult(await parseReshipments.mutateAsync(file))
    } catch {
      setFileName(null)
    }
  }

  const errorRows = result?.rows.filter(row => !row.valid) ?? []

  return (
    <ModalShell
      isOpen={isOpen}
      title={
        result ? "업로드한 송장을 채울까요?" : "재발송 송장을 일괄 등록할까요?"
      }
      width={520}
      onClose={close}
      footer={
        <>
          <Btn variant="ghost" onClick={close}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!result || result.validRows === 0}
            onClick={() => {
              if (!result) return
              onFill(result.rows.filter(row => row.valid))
              close()
            }}
          >
            {result ? `${result.validRows}건 등록하기` : "등록하기"}
          </Btn>
        </>
      }
    >
      {!result ? (
        <div
          onDragOver={event => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={event => {
            event.preventDefault()
            setDragOver(false)
            void handleFile(event.dataTransfer.files[0])
          }}
          className={`rounded-[8px] border-[1.5px] border-dashed px-5 py-8 text-center ${
            dragOver
              ? "border-sz-accent-500 bg-sz-accent-50"
              : "border-sz-n-300 bg-sz-n-50"
          }`}
        >
          <div className="mb-[5px] text-[13px] font-semibold text-sz-n-700">
            {parseReshipments.isPending
              ? `${fileName} 검증 중…`
              : "엑셀 파일을 여기에 끌어다 놓으세요"}
          </div>
          <div className="text-[12px] leading-[1.7] text-sz-n-500">
            <b className="font-semibold">접수번호와 송장번호</b>가 있는 엑셀을
            올려주세요.
            <br />
            [재발송 목록 다운로드]로 받은 파일에 송장을 채워 그대로 올리면
            됩니다.
          </div>
          <div className="mt-4 flex justify-center">
            <Btn
              variant="secondary"
              isLoading={parseReshipments.isPending}
              onClick={() => inputRef.current?.click()}
            >
              파일 선택
            </Btn>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={event => {
                void handleFile(event.target.files?.[0])
                event.target.value = ""
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[2px]">
            <div className={TROW_CLASS}>
              <div className={TK_CLASS} style={{ width: 96 }}>
                파일
              </div>
              <div className={TV_CLASS}>{fileName}</div>
            </div>
            <div className={TROW_CLASS}>
              <div className={TK_CLASS} style={{ width: 96 }}>
                검증 결과
              </div>
              <div className={`${TV_CLASS} tabular-nums`}>
                성공{" "}
                <b className="font-semibold text-sz-n-900">
                  {result.validRows}
                </b>
                건 · 오류{" "}
                <b className="font-semibold text-sz-n-900">
                  {errorRows.length}
                </b>
                건
              </div>
            </div>
          </div>
          {errorRows.length > 0 && (
            <div className="mb-4 rounded-[6px] border border-[#F0DADA] bg-[#FEF7F7] p-3">
              {errorRows.map(row => (
                <div
                  key={row.rowNumber}
                  className="flex gap-2 py-1 text-[11px] leading-[1.6] text-sz-n-700"
                >
                  <span className="w-[78px] shrink-0 tabular-nums text-sz-n-500">
                    {row.rowNumber}행
                  </span>
                  <span>
                    <b className="font-semibold">{row.claimNumber || "—"}</b> ·{" "}
                    {row.message}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700">
            <b className="font-semibold text-sz-n-900">
              등록하기를 눌러도 바로 확정되지 않습니다.
            </b>{" "}
            재발송 목록의 택배사·송장 칸이 채워지며, 확인한 뒤{" "}
            <b className="font-semibold text-sz-n-900">[N건 송장 등록]</b>으로
            확정하세요.
          </div>
        </>
      )}
    </ModalShell>
  )
}
