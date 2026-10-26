import Notice from "@/common/components/Notice/Notice"
import { parseServerDateTime } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import {
  formatFileSize,
  formatKRW,
  formatNumber,
} from "@/features/contracts/utils/format"
import {
  B,
  FSub,
  GbModal,
  MHint,
  MLabel,
  MSelect,
  MSum,
  MSumRow,
  MTextarea,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts"
import {
  APPEAL_FILE_MAX_BYTES,
  APPEAL_FILE_MAX_COUNT,
  APPEAL_FILE_TYPES,
  EARLY_CLOSE_REASON_OPTIONS,
  EMERGENCY_REASON_LABEL,
  SUSPENSION_CLAUSE_TEXT,
  SUSPENSION_REASON_OPTIONS,
  TERMINATION_TEXT,
} from "@/features/groupBuy/constants/params"
import type {
  EarlyCloseReasonCode,
  SuspensionReasonCode,
} from "@/features/groupBuy/types"
import { type Detail, dDay, dt } from "@/features/groupBuy/utils/view"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useRef, useState } from "react"
import toast from "react-hot-toast"

/*
  시안 C1~C9 — 모달 버튼 규칙(rev.2): 제목은 「~할까요?」, 좌측은 언제나 [닫기](ghost),
  우측 확인 버튼 라벨은 그 모달을 연 버튼과 같다. 색은 결과의 성격이 정한다 — 파괴적 종결(중단 · 해지)만
  위험, 정상 절차(연장·조기 마감·소명)는 주 액션. 필수 입력 전에는 에러 문구 없이 비활성만.
  rev.5에서 이슈 개설(C5) · 이행 확인(C6 · C7) 모달은 폐기됐다 — 정산 조정 요청은 정산 관리(13) 몫이다.
*/

interface BaseProps {
  detail: Detail
  isPending: boolean
  onClose: () => void
}

function periodWithDays(detail: Detail) {
  return `${dt(detail.timeline.startAt)} ~ ${dt(detail.timeline.endAt)} (${detail.timeline.totalDays}일)`
}

function currentSales(detail: Detail) {
  return detail.sales
    ? `주문 ${formatNumber(detail.sales.orderCount)}건 · ${formatKRW(detail.sales.amount)}`
    : "—"
}

// ── C1 기간 연장 요청 ────────────────────────────────

export function ExtensionRequestModal(
  props: BaseProps & {
    onConfirm: (body: { extensionDays: number; reason?: string }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const { timeline, extension, counterparty } = detail
  const [daysText, setDaysText] = useState("")
  const [reason, setReason] = useState("")

  const days = Number(daysText)
  const isValid =
    daysText !== "" &&
    Number.isInteger(days) &&
    days >= 1 &&
    days <= extension.maxDays
  const newEnd = isValid
    ? parseServerDateTime(timeline.endAt)
        .add(days, "day")
        .format("YYYY.MM.DD HH:mm")
    : null

  return (
    <GbModal
      title="공구 기간을 연장 요청할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              onConfirm({
                extensionDays: days,
                reason: reason.trim() || undefined,
              })
            }
          >
            연장 요청
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="현재 기간">{periodWithDays(detail)}</MSumRow>
        <MSumRow label="연장 후">
          {newEnd ? (
            <>
              <B className="text-sz-n-900">{newEnd}</B> · 총{" "}
              {timeline.totalDays + days}일
            </>
          ) : (
            <span className="text-sz-n-400">
              연장 일수를 입력하면 계산됩니다
            </span>
          )}
        </MSumRow>
        <MSumRow label="연장 기회">
          1회 중 <B className="text-sz-n-900">1회 남음</B>{" "}
          <span className="text-sz-n-500">(공구당 1회)</span>
        </MSumRow>
        <MSumRow label="수락 필요">
          {counterparty.name}{" "}
          <span className="text-sz-n-500">(인플루언서)</span>
        </MSumRow>
      </MSum>

      <MLabel required first>
        연장 일수
      </MLabel>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative inline-flex w-[110px] items-center">
          <input
            className={cn(INPUT_CLASS, "w-full pr-[26px]")}
            inputMode="numeric"
            value={daysText}
            onChange={event =>
              setDaysText(event.target.value.replace(/\D/g, ""))
            }
          />
          <span className="pointer-events-none absolute right-[9px] text-[12px] text-sz-n-500">
            일
          </span>
        </div>
        <span className="text-[11px] text-sz-n-500">
          1~{extension.maxDays}일 · 최초 시작일로부터 총 30일 이내
        </span>
      </div>

      <Notice tone="warn" className="mt-4">
        <B>연장 요청 제약</B>
        <br />· 공구 <B>종료 12시간 전까지만</B> 보낼 수 있습니다
        <br />· <B>공구당 1회</B> — 수락되든 거절되든 기회가 사라지고 재요청
        경로가 없습니다
        <br />· 총 기간이 <B>최초 시작일로부터 30일</B>을 넘을 수 없습니다
        <br />· <B>시작일은 변경할 수 없습니다</B>
      </Notice>

      <MLabel optional>요청 사유</MLabel>
      <MTextarea
        placeholder="연장이 필요한 이유를 적으면 상대가 판단하기 쉽습니다"
        maxLength={300}
        value={reason}
        onChange={event => setReason(event.target.value)}
      />

      <MWarn>
        연장은 <B className="text-sz-n-900">인플루언서가 수락해야</B> 반영됩니다
        — 운영자 검토는 없습니다. 수락하면{" "}
        <B className="text-sz-n-900">종료일이 즉시 변경</B>되고 소비자에게도
        반영되며, 거절하거나 응답이 없으면{" "}
        <B className="text-sz-n-900">변경 없이</B> 원래 종료일에 닫힙니다.
        연장은 <B className="text-sz-n-900">공구당 한 번만</B> 보낼 수 있어
        거절되면 다시 요청할 수 없습니다.{" "}
        <B className="text-sz-n-900">
          공구 기간이 끝날 때까지 인플루언서가 수락하지 않으면 자동으로 거절
          처리
        </B>
        됩니다 — 자동 수락이 아니므로, 그 경우 원래 종료일에 정상 종료됩니다.
      </MWarn>
    </GbModal>
  )
}

// ── C2 공구 중단 요청(진행중) ────────────────────────

export function SuspensionRequestModal(
  props: BaseProps & {
    onConfirm: (body: {
      reasonCode: SuspensionReasonCode
      memo?: string
    }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [reasonCode, setReasonCode] = useState<SuspensionReasonCode | "">("")
  const [memo, setMemo] = useState("")
  const isValid =
    reasonCode !== "" && (reasonCode !== "ETC" || memo.trim() !== "")
  const fee = detail.fixedFee.amount
  const orders = detail.sales?.orderCount

  return (
    <GbModal
      title="공구를 중단 요청할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="danger"
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              reasonCode &&
              onConfirm({ reasonCode, memo: memo.trim() || undefined })
            }
          >
            중단 요청
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="공구명">{detail.groupBuy.title}</MSumRow>
        <MSumRow label="인플루언서">{detail.counterparty.name}</MSumRow>
        <MSumRow label="현재 실적">{currentSales(detail)}</MSumRow>
      </MSum>

      <MLabel required first>
        중단 사유
      </MLabel>
      <ReasonSelect value={reasonCode} onChange={setReasonCode} />

      <MLabel optional>운영자에게 전달할 메모</MLabel>
      <MTextarea
        placeholder="중단이 필요한 상황을 구체적으로 적어주세요"
        maxLength={1000}
        value={memo}
        onChange={event => setMemo(event.target.value)}
      />
      <MHint>사유로 “기타(직접 입력)”를 선택하면 메모가 필수가 됩니다.</MHint>

      <Notice tone="consent" className="mt-4 flex flex-col gap-2">
        <div>
          <B className="text-sz-n-900">중단이 승인되면 되돌릴 수 없습니다</B>
        </div>
        <div className="leading-[1.8]">
          {/* 지급비가 없으면(0원) 회수 문장 자체가 의미 없다 */}
          {fee !== null && fee > 0 && (
            <>
              · 이미 지급된 고정 지급비{" "}
              <B className="text-sz-n-900">
                {formatKRW(fee)}은 플랫폼이 회수해 주지 않습니다
              </B>{" "}
              — 돈이 플랫폼을 지나가지 않아 되돌릴 대상이 없습니다 · 반환이
              필요하면 <B className="text-sz-n-900">인플루언서와 직접</B>{" "}
              협의하세요
              <br />
            </>
          )}
          ·{" "}
          <B className="text-sz-n-900">
            중단 집행 시점 이전까지 결제 완료된 정상 주문의 리워드는 그대로 정산
          </B>
          되고,{" "}
          <B className="text-sz-n-900">
            중단 이후 잔여 기간의 리워드 청구권은 소멸
          </B>
          합니다(약관 제16조④2).
          <br />·{" "}
          <B className="text-sz-n-900">
            이미 접수된 주문
            {orders !== undefined ? ` ${formatNumber(orders)}건` : ""}의 배송
            의무는 남습니다
          </B>{" "}
          — 판매 관리에서 계속 처리해야 합니다
          <br />· <B className="text-sz-n-900">게시물도 함께 내려가</B> 쇼룸에서
          보이지 않게 되고 신규 주문을 받지 않습니다
          <br />· 다시 진행하려면{" "}
          <B className="text-sz-n-900">새 계약을 체결</B>해야 합니다
        </div>
      </Notice>
    </GbModal>
  )
}

// ── C4 해지 요청(준비중 · 준비완료 · 시작 전) ─────────

/**
 * 시안 C4(【잠정】 기-05) — 시작 전 종결은 중단이 아니라 해지다. 판매가 없어 환불 · 배송 의무 항목이 없고
 * 고정 지급비 미회수만 남는다. 원 계약에 해지 요청을 걸고 운영자가 상대 동의를 확인해 처리한다.
 */
export function TerminationRequestModal(
  props: BaseProps & {
    onConfirm: (body: {
      reasonCode: SuspensionReasonCode
      memo?: string
    }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [reasonCode, setReasonCode] = useState<SuspensionReasonCode | "">("")
  const [memo, setMemo] = useState("")
  // 서버 검증과 같다 — 기타면 메모 필수(ContractTerminationRequestRequest)
  const isValid =
    reasonCode !== "" && (reasonCode !== "ETC" || memo.trim() !== "")
  const fee = detail.fixedFee.amount
  const statusText = detail.groupBuy.status === "READY" ? "준비완료" : "준비중"

  return (
    <GbModal
      title={TERMINATION_TEXT.modalTitle}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="danger"
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              reasonCode &&
              onConfirm({ reasonCode, memo: memo.trim() || undefined })
            }
          >
            {TERMINATION_TEXT.action}
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="공구명">{detail.groupBuy.title}</MSumRow>
        <MSumRow label="인플루언서">{detail.counterparty.name}</MSumRow>
        <MSumRow label="상태">
          {statusText} · <B className="text-sz-n-900">시작 전</B>(
          {dt(detail.timeline.startAt)} 시작 예정)
        </MSumRow>
      </MSum>

      <MLabel required first>
        {TERMINATION_TEXT.reasonLabel}
      </MLabel>
      <ReasonSelect value={reasonCode} onChange={setReasonCode} />

      <MLabel>운영자에게 전달할 메모</MLabel>
      <MTextarea
        placeholder="해지가 필요한 상황을 구체적으로 적어주세요"
        maxLength={1000}
        value={memo}
        onChange={event => setMemo(event.target.value)}
      />
      <MHint>사유로 “기타(직접 입력)”를 선택하면 메모가 필수가 됩니다.</MHint>

      <Notice tone="consent" className="mt-4 flex flex-col gap-2">
        <div>
          <B className="text-sz-n-900">{TERMINATION_TEXT.irreversible}</B>
        </div>
        <div className="leading-[1.8]">
          ·{" "}
          <B className="text-sz-n-900">
            아직 판매가 시작되지 않아 주문 환불은 발생하지 않습니다
          </B>
          <br />
          {fee !== null && fee > 0 && (
            <>
              ·{" "}
              <B className="text-sz-n-900">
                이미 지급된 고정 지급비 {formatKRW(fee)}은 플랫폼이 회수해 주지
                않습니다
              </B>{" "}
              — 돈이 플랫폼을 지나가지 않아 되돌릴 대상이 없습니다
              <br />
            </>
          )}
          · 예약된 게시물은 공개되지 않습니다
          <br />· 다시 진행하려면{" "}
          <B className="text-sz-n-900">새 계약을 체결</B>해야 합니다
        </div>
      </Notice>
    </GbModal>
  )
}

/** C2 · C4 공용 사유 선택 — 서버 SuspensionReasonCode 4종 */
function ReasonSelect(props: {
  value: SuspensionReasonCode | ""
  onChange: (value: SuspensionReasonCode | "") => void
}) {
  return (
    <MSelect
      value={props.value}
      onChange={event =>
        props.onChange(event.target.value as SuspensionReasonCode | "")
      }
    >
      <option value="">선택하세요</option>
      {SUSPENSION_REASON_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </MSelect>
  )
}

// ── C3 조기 마감 요청 ────────────────────────────────

export function EarlyCloseRequestModal(
  props: BaseProps & {
    onConfirm: (body: {
      reasonCode: EarlyCloseReasonCode
      memo?: string
    }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [reasonCode, setReasonCode] = useState<EarlyCloseReasonCode | "">("")
  const [memo, setMemo] = useState("")
  const isValid =
    reasonCode !== "" && (reasonCode !== "ETC" || memo.trim() !== "")
  const orders = detail.sales?.orderCount

  return (
    <GbModal
      title="공구를 조기 마감 요청할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              reasonCode &&
              onConfirm({ reasonCode, memo: memo.trim() || undefined })
            }
          >
            조기 마감 요청
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="공구명">{detail.groupBuy.title}</MSumRow>
        <MSumRow label="현재 종료 예정">
          {dt(detail.timeline.endAt)}
          {detail.timeline.daysUntilEnd !== null &&
            ` (${detail.timeline.daysUntilEnd}일 남음)`}
        </MSumRow>
        <MSumRow label="현재 실적">{currentSales(detail)}</MSumRow>
      </MSum>

      <MLabel required first>
        마감 사유
      </MLabel>
      <MSelect
        value={reasonCode}
        onChange={event =>
          setReasonCode(event.target.value as EarlyCloseReasonCode | "")
        }
      >
        <option value="">선택하세요</option>
        {EARLY_CLOSE_REASON_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>

      <MLabel>운영자에게 전달할 메모</MLabel>
      <MTextarea
        placeholder="조기 마감이 필요한 상황을 적어주세요"
        maxLength={1000}
        value={memo}
        onChange={event => setMemo(event.target.value)}
      />
      <MHint>사유로 “기타(직접 입력)”를 선택하면 메모가 필수가 됩니다.</MHint>

      <Notice tone="consent" className="mt-4 flex flex-col gap-2">
        <div>
          <B className="text-sz-n-900">조기 마감은 정상 종결입니다</B>
        </div>
        <div className="leading-[1.8]">
          · 승인되면 상태가 <B className="text-sz-n-900">종료</B>가 되고 신규
          주문만 멈춥니다
          <br />·{" "}
          <B className="text-sz-n-900">
            접수된 주문
            {orders !== undefined ? ` ${formatNumber(orders)}건` : ""}은 그대로
            배송·정산
          </B>
          되며 <B className="text-sz-n-900">환불은 발생하지 않습니다</B>
          <br />· 지급된 고정 지급비도 그대로이고 인플루언서 리워드도 유지됩니다
          <br />·{" "}
          <B className="text-sz-n-900">요청 후에는 취소할 수 없습니다</B> —
          운영자 검토를 거쳐 승인 또는 반려됩니다
        </div>
      </Notice>
    </GbModal>
  )
}

// ── C9 소명 자료 제출 ────────────────────────────────

export function AppealModal(
  props: BaseProps & {
    onConfirm: (body: { content: string; files: Array<File> }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const suspension = detail.adminSuspension
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<Array<File>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const clause = suspension?.reasonClause
    ? SUSPENSION_CLAUSE_TEXT[suspension.reasonClause]
    : null
  const dday = dDay(suspension?.appealDeadlineAt)

  const handleFiles = (list: FileList | null) => {
    if (!list) {
      return
    }
    const next = [...files]
    for (const file of Array.from(list)) {
      if (!APPEAL_FILE_TYPES.includes(file.type)) {
        toast.error(`${file.name} — PNG · JPG · PDF만 첨부할 수 있습니다.`)
        continue
      }
      if (file.size > APPEAL_FILE_MAX_BYTES) {
        toast.error(`${file.name} — 10MB 이하 파일만 첨부할 수 있습니다.`)
        continue
      }
      if (next.length >= APPEAL_FILE_MAX_COUNT) {
        toast.error(
          `증빙은 최대 ${APPEAL_FILE_MAX_COUNT}개까지 첨부할 수 있습니다.`
        )
        break
      }
      next.push(file)
    }
    setFiles(next)
  }

  return (
    <GbModal
      title="소명 자료를 제출할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={content.trim() === ""}
            isLoading={isPending}
            onClick={() => onConfirm({ content: content.trim(), files })}
          >
            소명 자료 제출
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="중단 사유">
          {clause
            ? clause.label
            : suspension?.emergencyReason
              ? EMERGENCY_REASON_LABEL[suspension.emergencyReason]
              : "—"}
          {clause && <FSub>약관 {clause.clause}</FSub>}
        </MSumRow>
        <MSumRow label="집행 예정">
          {dt(suspension?.executeScheduledAt)}
        </MSumRow>
        <MSumRow label="소명 기한">
          {dt(suspension?.appealDeadlineAt)}
          {dday && <span className="text-sz-warning-text"> ({dday})</span>}
        </MSumRow>
      </MSum>

      <MLabel required first>
        소명 내용
      </MLabel>
      <MTextarea
        placeholder="통지된 사유에 대한 사실관계와 근거를 적어주세요"
        maxLength={2000}
        value={content}
        onChange={event => setContent(event.target.value)}
      />

      <MLabel>증빙 첨부</MLabel>
      <div className="rounded-[6px] border border-dashed border-sz-n-300 p-4 text-center">
        <div className="text-[12px] font-semibold text-sz-n-900">
          시험성적서 · 광고 심의 결과 등
        </div>
        <MHint className="mt-[3px]">PNG · JPG · PDF · 10MB 이하</MHint>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={APPEAL_FILE_TYPES.join(",")}
          className="hidden"
          onChange={event => {
            handleFiles(event.target.files)
            event.target.value = ""
          }}
        />
        <Btn
          variant="secondary"
          className="mt-2"
          onClick={() => inputRef.current?.click()}
        >
          파일 선택
        </Btn>
      </div>
      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-[6px] border border-sz-n-200 px-3 py-2 text-[12px]"
            >
              <span className="min-w-0 flex-1 truncate text-sz-n-900">
                {file.name}
              </span>
              <span className="shrink-0 text-[11px] text-sz-n-500">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                aria-label="첨부 삭제"
                className="text-sz-n-400 hover:text-sz-danger-text"
                onClick={() =>
                  setFiles(files.filter((_, fileIndex) => fileIndex !== index))
                }
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <MWarn>
        <B className="text-sz-n-900">제출 후에는 수정할 수 없습니다.</B> 기한 내
        제출하지 않으면{" "}
        <B className="text-sz-n-900">기존 자료를 기준으로 최종 판정</B>
        됩니다(제17조④). 소명이 타당하다고 인정되면{" "}
        <B className="text-sz-n-900">직권 중단이 철회될 수 있습니다</B>.
      </MWarn>
    </GbModal>
  )
}
