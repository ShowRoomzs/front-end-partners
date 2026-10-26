import { Button } from "@/components/ui/button"
import {
  ModalLabel,
  ModalNotice,
  ModalShell,
} from "@/features/storeManagement/components/ChangeRequestModal/ModalShell"
import {
  STORE_BUTTON_CLASS,
  STORE_INPUT_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import type {
  WithdrawalReasonOption,
  WithdrawalRequestBody,
} from "@/features/storeManagement/services/withdrawalService"
import { cn } from "@/lib/utils"
import { useState } from "react"

/** 서버 `@Size(max = 1000)` */
const MESSAGE_MAX = 1000

/** 시안 라벨 뒤 「(선택)」 — 11px 보통 굵기 n-500 */
function Optional() {
  return (
    <span className="ml-1 text-[11px] font-normal text-sz-n-500">(선택)</span>
  )
}

/**
 * M5 — 브랜드 탈퇴 신청 확인(ui-partner-06 4-H).
 *
 * 사유는 선택 입력이라 미선택으로도 신청할 수 있다. 확인 문구 타이핑은 두지 않는다 — 차단 조건
 * 4개 통과가 이미 관문이다. 위험색은 확인 버튼과 처리 결과 고지에만 쓴다.
 * 사유 선택지는 서버(`withdrawal.reasonOptions`)가 단일 소스다 — 「선택하지 않음」이면 reason을 보내지 않는다.
 */
export function WithdrawalModal(props: {
  isOpen: boolean
  isSubmitting: boolean
  reasonOptions: Array<WithdrawalReasonOption>
  /** 승인 때 함께 삭제되는 작성 중 계약 — 0이면 안내를 두지 않는다 */
  draftContractCount: number
  onClose: () => void
  onSubmit: (body: WithdrawalRequestBody) => void
}) {
  const {
    isOpen,
    isSubmitting,
    reasonOptions,
    draftContractCount,
    onClose,
    onSubmit,
  } = props
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")

  const handleClose = () => {
    if (isSubmitting) return
    setReason("")
    setMessage("")
    onClose()
  }

  const handleSubmit = () => {
    const trimmed = message.trim()
    onSubmit({
      ...(reason && { reason }),
      ...(trimmed && { message: trimmed }),
    })
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title="브랜드 탈퇴를 신청할까요?"
      width={460}
      onClose={handleClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={STORE_BUTTON_CLASS}
            onClick={handleClose}
          >
            닫기
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className={STORE_BUTTON_CLASS}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            탈퇴 신청
          </Button>
        </>
      }
    >
      {draftContractCount > 0 && (
        <ModalNotice>
          <b className="text-sz-n-900">
            작성 중인 계약 {draftContractCount.toLocaleString("ko-KR")}건은 함께
            삭제됩니다.
          </b>{" "}
          아직 인플루언서에게 보내지 않은 초안입니다.
        </ModalNotice>
      )}
      <ModalNotice>
        <b className="text-sz-n-900">신청 후 운영자 확인을 거쳐 처리됩니다.</b>{" "}
        처리 전까지는 계정을 그대로 사용할 수 있지만{" "}
        <b className="text-sz-n-900">
          비밀번호·로그인 이메일은 변경할 수 없습니다.
        </b>
      </ModalNotice>

      <div className="mb-4">
        <ModalLabel>
          탈퇴 사유
          <Optional />
        </ModalLabel>
        <select
          value={reason}
          onChange={event => setReason(event.target.value)}
          className={cn(
            "w-full rounded-[6px] border border-sz-n-300 bg-white text-[13px] text-sz-n-900 focus:border-sz-accent-500 focus:outline-none",
            STORE_INPUT_CLASS
          )}
        >
          <option value="">선택하지 않음</option>
          {reasonOptions.map(option => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <ModalLabel>
          남기실 말씀
          <Optional />
        </ModalLabel>
        <textarea
          value={message}
          maxLength={MESSAGE_MAX}
          onChange={event => setMessage(event.target.value)}
          placeholder="개선에 참고하겠습니다"
          className="min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pt-[7px] pb-1.5 text-[13px] leading-[1.6] text-sz-n-900 placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2 rounded-[6px] border border-[#E9C9C9] bg-sz-danger-bg p-3.5 text-[11px] leading-[1.65] text-sz-n-700">
        <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sz-danger-text text-[10px] font-bold text-white">
          !
        </span>
        <span>
          <b className="text-sz-n-900">탈퇴가 처리되면</b>
          <br />· <b className="text-sz-n-900">로그인이 차단</b>되고
          파트너센터에 접속할 수 없습니다
          <br />· 상품과 공구 게시물이{" "}
          <b className="text-sz-n-900">비공개로 내려갑니다</b>
          <br />· 거래 기록은{" "}
          <b className="text-sz-n-900">법정 보존 기간 동안 플랫폼에 남습니다</b>
          (소비자 분쟁·세무 대응 근거)
          <br />· <b className="text-sz-n-900">같은 사업자등록번호로 재가입</b>
          할 수 있으나 이전 데이터는 승계되지 않습니다
        </span>
      </div>
    </ModalShell>
  )
}
