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
  ISSUE_TYPE_OPTIONS,
  SUSPENSION_CLAUSE_TEXT,
  SUSPENSION_REASON_OPTIONS,
} from "@/features/groupBuy/constants/params"
import type {
  EarlyCloseReasonCode,
  FulfillmentResult,
  GroupBuyIssueType,
  SuspensionReasonCode,
} from "@/features/groupBuy/types"
import {
  type Detail,
  contentDutyText,
  dDay,
  dt,
} from "@/features/groupBuy/utils/view"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useRef, useState } from "react"
import toast from "react-hot-toast"

/*
  시안 C1~C9 — 모달 버튼 규칙(rev.2): 제목은 「~할까요?」, 좌측은 언제나 [닫기](ghost),
  우측 확인 버튼 라벨은 그 모달을 연 버튼과 같다. 색은 결과의 성격이 정한다 — 파괴적 종결(중단)만
  위험, 정상 절차(연장·조기 마감·이슈·소명)는 주 액션. 필수 입력 전에는 에러 문구 없이 비활성만.
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

// ── C2 · C4 공구 중단 요청 ───────────────────────────

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
  const beforeStart = detail.groupBuy.status === "READY"
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
        {beforeStart ? (
          <MSumRow label="상태">
            준비완료 · <B className="text-sz-n-900">시작 전</B>(
            {dt(detail.timeline.startAt)} 시작 예정)
          </MSumRow>
        ) : (
          <MSumRow label="현재 실적">{currentSales(detail)}</MSumRow>
        )}
      </MSum>

      <MLabel required first>
        중단 사유
      </MLabel>
      <MSelect
        value={reasonCode}
        onChange={event =>
          setReasonCode(event.target.value as SuspensionReasonCode | "")
        }
      >
        <option value="">선택하세요</option>
        {SUSPENSION_REASON_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>

      <MLabel optional={!beforeStart}>운영자에게 전달할 메모</MLabel>
      <MTextarea
        placeholder="중단이 필요한 상황을 구체적으로 적어주세요"
        maxLength={1000}
        value={memo}
        onChange={event => setMemo(event.target.value)}
      />
      {!beforeStart && (
        <MHint>사유로 “기타(직접 입력)”를 선택하면 메모가 필수가 됩니다.</MHint>
      )}

      <Notice tone="consent" className="mt-4 flex flex-col gap-2">
        <div>
          <B className="text-sz-n-900">중단이 승인되면 되돌릴 수 없습니다</B>
        </div>
        <div className="leading-[1.8]">
          {beforeStart ? (
            <>
              ·{" "}
              <B className="text-sz-n-900">
                아직 판매가 시작되지 않아 주문 환불은 발생하지 않습니다
              </B>
              <br />
            </>
          ) : null}
          {fee !== null && (
            <>
              · 이미 지급된 고정 지급비{" "}
              <B className="text-sz-n-900">
                {formatKRW(fee)}은 플랫폼이 회수해 주지 않습니다
              </B>{" "}
              — 돈이 플랫폼을 지나가지 않아 되돌릴 대상이 없습니다
              {!beforeStart && (
                <>
                  {" "}
                  · 반환이 필요하면{" "}
                  <B className="text-sz-n-900">인플루언서와 직접</B> 협의하세요
                </>
              )}
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
          <br />
          {!beforeStart && (
            <>
              ·{" "}
              <B className="text-sz-n-900">
                이미 접수된 주문
                {orders !== undefined ? ` ${formatNumber(orders)}건` : ""}의
                배송 의무는 남습니다
              </B>{" "}
              — 판매 관리에서 계속 처리해야 합니다
              <br />
            </>
          )}
          {beforeStart ? (
            <>· 게시물도 함께 내려가 쇼룸에서 보이지 않게 됩니다</>
          ) : (
            <>
              · <B className="text-sz-n-900">게시물도 함께 내려가</B> 쇼룸에서
              보이지 않게 되고 신규 주문을 받지 않습니다
            </>
          )}
          <br />· 다시 진행하려면{" "}
          <B className="text-sz-n-900">새 계약을 체결</B>해야 합니다
        </div>
      </Notice>
    </GbModal>
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

// ── C5 이슈 스레드 열기 ──────────────────────────────

export function IssueOpenModal(
  props: BaseProps & {
    onConfirm: (body: { issueType: GroupBuyIssueType; content: string }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [issueType, setIssueType] = useState<GroupBuyIssueType | "">("")
  const [content, setContent] = useState("")
  const isValid = issueType !== "" && content.trim() !== ""

  return (
    <GbModal
      title="이슈 스레드를 열까요?"
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
              issueType && onConfirm({ issueType, content: content.trim() })
            }
          >
            이슈 스레드 열기
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="공구명">{detail.groupBuy.title}</MSumRow>
        <MSumRow label="인플루언서">{detail.counterparty.name}</MSumRow>
      </MSum>

      <MLabel required first>
        이슈 유형
      </MLabel>
      <MSelect
        value={issueType}
        onChange={event =>
          setIssueType(event.target.value as GroupBuyIssueType | "")
        }
      >
        <option value="">선택하세요</option>
        {ISSUE_TYPE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>

      <MLabel required>내용</MLabel>
      <MTextarea
        placeholder="어떤 문제인지 구체적으로 적어주세요"
        maxLength={2000}
        value={content}
        onChange={event => setContent(event.target.value)}
      />

      <MWarn>
        <B className="text-sz-n-900">연결·소통 스레드에 이슈가 등록됩니다.</B>{" "}
        인플루언서·운영자가 함께 참여하며 위에 적은 내용이 첫 글로 등록됩니다.{" "}
        <B className="text-sz-n-900">
          주문 배송·환불 문제는 이 경로가 아닙니다
        </B>{" "}
        — 판매 관리에서 직접 처리하세요.
      </MWarn>
    </GbModal>
  )
}

// ── C6 · C7 계약 이행 확인 ───────────────────────────

export function FulfillmentCheckModal(
  props: BaseProps & {
    onConfirm: (body: { result: FulfillmentResult; reason?: string }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [result, setResult] = useState<FulfillmentResult | null>(null)
  const [reason, setReason] = useState("")
  const isUnfulfilled = result === "UNFULFILLED"
  const isValid =
    result === "FULFILLED" || (isUnfulfilled && reason.trim() !== "")

  return (
    <GbModal
      title="인플루언서가 계약을 이행했나요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant={isUnfulfilled ? "danger" : "primary"}
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              result &&
              onConfirm(
                isUnfulfilled ? { result, reason: reason.trim() } : { result }
              )
            }
          >
            {isUnfulfilled ? "미이행 제출 · 스레드 열기" : "확인 완료"}
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="인플루언서">{detail.counterparty.name}</MSumRow>
        <MSumRow label="인플루언서 의무">{contentDutyText(detail)}</MSumRow>
      </MSum>

      <div className="rounded-[6px] border border-sz-n-200 px-[13px] py-[11px]">
        <div className="text-[12px] font-medium text-sz-n-900">
          인플루언서가 계약을 이행했나요?
        </div>
        <div className="mt-[2px] text-[11px] leading-[1.6] text-sz-n-500">
          쇼룸 공구 게시물 · 인스타그램 콘텐츠 등 계약서에 적힌 인플루언서 의무
          전체를 기준으로 판단해 주세요.
        </div>
        <div className="mt-[9px] flex gap-[7px]">
          {(["FULFILLED", "UNFULFILLED"] as const).map(value => {
            const isOn = result === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setResult(value)}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center rounded-[6px] border text-[11px] font-medium",
                  !isOn && "border-sz-n-300 bg-white text-sz-n-600",
                  isOn &&
                    value === "FULFILLED" &&
                    "border-sz-accent-500 bg-sz-accent-50 text-sz-accent-600",
                  isOn &&
                    value === "UNFULFILLED" &&
                    "border-sz-danger-text bg-sz-danger-bg text-sz-danger-text"
                )}
              >
                {value === "FULFILLED" ? "이행" : "미이행"}
              </button>
            )
          })}
        </div>
      </div>

      {isUnfulfilled ? (
        <>
          <MLabel required>어떤 점이 이행되지 않았나요?</MLabel>
          <MTextarea
            maxLength={2000}
            value={reason}
            onChange={event => setReason(event.target.value)}
          />
          <MWarn danger>
            <div>
              <B className="text-sz-n-900">
                «미이행»으로 제출하면 연결·소통에 스레드가 열립니다.
              </B>
              <br />· <B className="text-sz-n-900">나 · 인플루언서 · 운영자</B>
              가 참여하는 스레드에서 합의합니다
              <br />· 합의가 끝날 때까지{" "}
              <B className="text-sz-n-900">정산은 보류</B>
              되고 리워드 지급도 미뤄집니다
              <br />·{" "}
              <B className="text-sz-n-900">
                양측이 모두 중재 의견에 동의하면
              </B>{" "}
              이슈가 종결되고 보류가 해제됩니다 —{" "}
              <B className="text-sz-n-900">한쪽이라도 반대하면 보류가 계속</B>
              됩니다(제20조⑤)
              <br />· 운영자의{" "}
              <B className="text-sz-n-900">
                중재 의견에 금액 조정은 포함되지 않습니다
              </B>
              (제20조④)
              <br />· 위에 적은 내용이{" "}
              <B className="text-sz-n-900">스레드 첫 글로 등록</B>됩니다
            </div>
          </MWarn>
        </>
      ) : (
        <Notice tone="consent" className="mt-4">
          <B className="text-sz-n-900">이행</B>으로 확인하면 되돌릴 수 없으며,
          인플루언서 쪽 확인이 끝나는 대로{" "}
          <B className="text-sz-n-900">정산 절차가 시작</B>됩니다.
        </Notice>
      )}
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
