import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import {
  B,
  GbModal,
  MHint,
  MSum,
  MSumRow,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts"
import { ActBtn } from "@/features/orders/components/shared/OrderParts"
import { SHIPMENT_UPLOAD_MAX_ROWS } from "@/features/orders/constants/params"
import { useParseShipments } from "@/features/orders/hooks/useOrderMutations"
import { orderService, saveFile } from "@/features/orders/services/orderService"
import type { ShipmentParseResponse } from "@/features/orders/types"
import { formatNumber } from "@/features/orders/utils/view"
import { cn } from "@/lib/utils"
import { useRef, useState, type ReactNode } from "react"

type ParsedRow = ShipmentParseResponse["rows"][number]

/** 신규 주문은 이 업로드로 처리하지 않는다(rev.7) — 사유 목록에서 따로 묶어 보여준다 */
const NEW_NOT_ALLOWED = "NEW_NOT_ALLOWED"

/**
 * E2 → E3 송장 일괄 업로드.
 *
 * 검증 결과의 [N건 목록에 채우기]는 **상태를 바꾸지 않고 셀만 채운다**(rev.5) — 브랜드가 눈으로 확인한 뒤
 * 목록의 [N건 송장 등록]으로 확정한다. 수기 입력과 같은 확정 지점을 공유하고, 잘못 올린 파일을 되돌릴
 * 구간이 생긴다. 오류가 있어도 정상 행은 채운다(부분 성공).
 */
export default function ShipmentUploadModal(props: {
  onClose: () => void
  onFill: (rows: Array<ParsedRow>, fileName: string) => void
}) {
  const { onClose, onFill } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<ShipmentParseResponse | null>(null)
  const parse = useParseShipments()

  const pickFile = (picked: File | undefined) => {
    if (picked) {
      setFile(picked)
    }
  }

  const handleUpload = () => {
    if (!file) {
      return
    }
    parse.mutate(file, { onSuccess: setResult })
  }

  if (result && file) {
    return (
      <UploadResult
        fileName={file.name}
        result={result}
        onClose={onClose}
        onFill={() =>
          onFill(
            result.rows.filter(row => row.valid),
            file.name
          )
        }
      />
    )
  }

  return (
    <GbModal
      title="송장을 일괄 등록할까요?"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!file}
            isLoading={parse.isPending}
            onClick={handleUpload}
          >
            업로드
          </Btn>
        </>
      }
    >
      <div
        onDragOver={event => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={event => {
          event.preventDefault()
          setIsDragging(false)
          pickFile(event.dataTransfer.files[0])
        }}
        className={cn(
          "rounded-[8px] border-[1.5px] border-dashed px-5 py-8 text-center",
          isDragging
            ? "border-sz-accent-500 bg-sz-accent-50"
            : "border-sz-n-300 bg-sz-n-50"
        )}
      >
        <div className="mb-[5px] text-[13px] font-semibold text-sz-n-700">
          {file ? file.name : "엑셀 파일을 여기에 끌어다 놓으세요"}
        </div>
        <div className="text-[12px] leading-[1.7] text-sz-n-500">
          {file ? (
            "다른 파일을 올리려면 다시 끌어다 놓거나 파일을 선택하세요."
          ) : (
            <>
              <B>주문번호와 송장번호</B>가 있는 엑셀을 올려주세요.
              <br />
              택배사에서 발급받은 파일을 그대로 올리면 됩니다.
            </>
          )}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Btn variant="secondary" onClick={() => inputRef.current?.click()}>
            파일 선택
          </Btn>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={event => {
            pickFile(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </div>
      <MHint className="mt-3 text-center">
        <button
          type="button"
          className={FLINK_CLASS}
          onClick={() =>
            orderService
              .downloadShipmentTemplate()
              .then(saveFile)
              .catch(() => undefined)
          }
        >
          송장 업로드 양식 받기
        </button>{" "}
        · xlsx · 최대 {formatNumber(SHIPMENT_UPLOAD_MAX_ROWS)}행
      </MHint>
      <MWarn>
        <div>
          올린 송장은 먼저 <B className="text-sz-n-900">목록의 셀에 채워지고</B>
          , 눈으로 확인한 뒤 <B className="text-sz-n-900">[송장 등록]</B>을
          눌러야 배송중으로 바뀌어 소비자에게 송장번호가 전달됩니다. 이후{" "}
          <B className="text-sz-n-900">배송 추적과 배송완료 전환은 자동</B>
          입니다.
        </div>
      </MWarn>
    </GbModal>
  )
}

/** E3 검증 결과 — 건수를 박은 버튼 라벨이 부분 반영임을, 「채우기」가 상태 불변임을 스스로 말한다 */
function UploadResult(props: {
  fileName: string
  result: ShipmentParseResponse
  onClose: () => void
  onFill: () => void
}) {
  const { fileName, result, onClose, onFill } = props
  const errors = result.rows.filter(row => !row.valid)
  const newRows = errors.filter(row => row.errorCode === NEW_NOT_ALLOWED)
  const otherErrors = errors.filter(row => row.errorCode !== NEW_NOT_ALLOWED)

  return (
    <GbModal
      title="업로드 결과를 확인해 주세요"
      width={560}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="primary"
            disabled={result.validRows === 0}
            onClick={onFill}
          >
            {result.validRows}건 목록에 채우기
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="파일">{fileName}</MSumRow>
        <MSumRow label="총 행">{formatNumber(result.totalRows)}행</MSumRow>
      </MSum>

      <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
        <ResultRow ok count={result.validRows}>
          <B className="text-sz-n-900">성공 {result.validRows}건</B> — 목록의
          송장 셀에 채워집니다
        </ResultRow>
        {errors.length > 0 && (
          <ResultRow count={errors.length}>
            <B className="text-sz-n-900">제외 {errors.length}건</B> — 아래
            사유를 확인해 주세요
          </ResultRow>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-2 rounded-[6px] border border-[#F0DADA] bg-[#FEF7F7] p-3">
          <div className="max-h-[180px] overflow-y-auto">
            {otherErrors.map(row => (
              <div
                key={row.rowNumber}
                className="flex gap-2 py-1 text-[11px] leading-[1.6] text-sz-n-700"
              >
                <span className="w-[78px] shrink-0 tabular-nums text-sz-n-500">
                  {row.rowNumber}행
                </span>
                <span>
                  {row.orderNumber && (
                    <>
                      <B className="text-sz-n-900">{row.orderNumber}</B> ·{" "}
                    </>
                  )}
                  {row.message}
                </span>
              </div>
            ))}
            {newRows.length > 0 && (
              <div className="flex gap-2 py-1 text-[11px] leading-[1.6] text-sz-n-700">
                <span className="w-[78px] shrink-0 tabular-nums text-sz-n-500">
                  {newRows.length}건
                </span>
                <span>
                  <B className="text-sz-n-900">신규(준비 대기) 주문</B> · 준비
                  시작 전이라 송장을 등록할 수 없습니다
                </span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <ActBtn onClick={() => downloadErrorRows(errors, fileName)}>
              오류 건만 엑셀로 받기
            </ActBtn>
          </div>
        </div>
      )}

      <MWarn>
        <div>
          <B className="text-sz-n-900">
            {errors.length > 0 && `제외 ${errors.length}건을 빼고 `}
            {result.validRows}건을 목록에 채웁니다.
          </B>{" "}
          <B className="text-sz-n-900">이 시점에 상태는 바뀌지 않습니다</B> —
          목록에서 값을 눈으로 확인한 뒤{" "}
          <B className="text-sz-n-900">[송장 등록]</B>을 눌러야 배송중으로
          확정됩니다. 잘못 올렸으면 그 전에 되돌릴 수 있습니다.
          {errors.length > 0 &&
            " 오류 건은 사유를 고쳐 다시 올리거나 목록에서 직접 입력하면 됩니다."}
          {newRows.length > 0 && (
            <>
              {" "}
              <B className="text-sz-n-900">
                신규 주문 {newRows.length}건은 이 업로드로 처리되지 않습니다
              </B>{" "}
              — 준비 시작 전이라 소비자 취소권이 아직 열려 있고, 파일 한 번으로
              그 권리를 닫을 수 없습니다. 신규 탭에서{" "}
              <B className="text-sz-n-900">[발주서 다운로드]</B>나{" "}
              <B className="text-sz-n-900">[준비 시작]</B>으로 먼저 처리한 뒤
              다시 올려주세요.
            </>
          )}
        </div>
      </MWarn>
    </GbModal>
  )
}

function ResultRow(props: {
  ok?: boolean
  count: number
  children: ReactNode
}) {
  const { ok = false, count, children } = props
  return (
    <div
      className={cn(
        "flex items-center gap-[9px] border-b border-sz-n-100 px-[13px] py-[11px] text-[12px] last:border-b-0",
        !ok && "bg-[#FEF7F7]"
      )}
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          ok
            ? "bg-sz-success-bg text-sz-success-text"
            : "bg-sz-danger-bg text-sz-danger-text"
        )}
      >
        {ok ? "✓" : "✕"}
      </span>
      <span className="flex-1">{children}</span>
      <span className="text-[11px] tabular-nums text-sz-n-500">{count}</span>
    </div>
  )
}

/**
 * 오류 건만 다시 받기 — 엑셀이 바로 여는 CSV(UTF-8 BOM)로 만든다. 고쳐서 같은 양식으로 다시 올릴 수
 * 있게 업로드 양식의 열(주문번호 · 택배사 · 송장번호)을 앞에 두고 사유를 붙인다.
 */
function downloadErrorRows(rows: Array<ParsedRow>, fileName: string) {
  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  const lines = [
    ["행", "주문번호", "택배사", "송장번호", "사유"],
    ...rows.map(row => [
      String(row.rowNumber),
      row.orderNumber ?? "",
      row.carrier ?? "",
      row.trackingNumber ?? "",
      row.message ?? "",
    ]),
  ].map(cells => cells.map(escape).join(","))
  // 앞의 BOM이 있어야 엑셀이 UTF-8로 읽는다(없으면 한글이 깨진다)
  const blob = new Blob([String.fromCharCode(0xfeff), lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  })
  const baseName = fileName.replace(/\.[^.]+$/, "")
  saveFile({ blob, filename: `${baseName}_오류.csv` })
}
