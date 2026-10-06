import NotReady from "@/common/components/NotReady/NotReady"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import { Button } from "@/components/ui/button"
import { WithdrawalModal } from "@/features/storeManagement/components/AccountModals/WithdrawalModal"
import {
  StoreButtonRow,
  StoreFormCard,
  StoreHint,
  STORE_BUTTON_CLASS,
} from "@/features/storeManagement/components/StoreFormLayout/StoreFormLayout"
import {
  WITHDRAWAL_REASONS,
  type WithdrawalCondition,
  type WithdrawalConditionKey,
  type WithdrawalRequest,
  type WithdrawalRequestBody,
} from "@/features/storeManagement/services/withdrawalService"
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

/** 조건별로 가야 할 화면이 다르다(4-G) */
const CONDITION_META: Record<
  WithdrawalConditionKey,
  { label: string; linkLabel: string; to: string }
> = {
  GROUP_BUY: {
    label: "진행 중·준비 중 공구",
    linkLabel: "공구 관리",
    to: "/group-buy",
  },
  CONTRACT: {
    label: "체결·서명대기 계약",
    linkLabel: "계약 관리",
    to: "/contract",
  },
  ORDER: {
    label: "미종결 주문(배송·반품·교환)",
    linkLabel: "판매 관리",
    to: "/sales/orders",
  },
  SETTLEMENT: {
    label: "미정산 잔액",
    linkLabel: "정산 관리",
    to: "/settlement/history",
  },
}

const OPERATOR_THREAD_PATH = "/connections?operator=1"

function CardHeader(props: { children: ReactNode; pending?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-5 py-4 text-[16px] font-semibold text-sz-n-900",
        props.pending
          ? "border-[#E9C9C9] bg-sz-danger-bg"
          : "border-sz-n-200 bg-white"
      )}
    >
      {props.children}
    </div>
  )
}

function HeaderNote({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-normal text-sz-n-500">{children}</span>
  )
}

/**
 * 계정 탭 하단 「브랜드 탈퇴」 카드(ui-partner-06 4-F · 4-G · 4-I).
 *
 * 탈퇴는 **신청**이고 실행은 운영자다 — 차단 조건 4개를 모두 충족해야 [탈퇴 신청]이 열린다.
 * 미충족은 에러 문구 없이 버튼 비활성 + 조건별 잔여 건수·이동 링크로만 보여준다(전역 규칙).
 * 위험색은 버튼에만 쓴다(상태 표시는 중립) — 검토 중 카드 헤더만 시안대로 위험 배경.
 */
export default function WithdrawalCard(props: {
  conditions: Array<WithdrawalCondition> | undefined
  pendingRequest: WithdrawalRequest | null | undefined
  isLoading: boolean
  isSubmitting: boolean
  isCanceling: boolean
  onRequest: (body: WithdrawalRequestBody) => Promise<boolean>
  onCancel: () => void
}) {
  const {
    conditions,
    pendingRequest,
    isLoading,
    isSubmitting,
    isCanceling,
    onRequest,
    onCancel,
  } = props
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!DEV_MOCK_ENABLED) {
    return (
      <div className="mt-4">
        <StoreFormCard>
          <CardHeader>브랜드 탈퇴</CardHeader>
          <NotReady
            title="탈퇴 신청 화면은 준비 중입니다"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={STORE_BUTTON_CLASS}
                onClick={() => navigate(OPERATOR_THREAD_PATH)}
              >
                운영자 문의
              </Button>
            }
          >
            탈퇴는 신청 후 운영자가 처리합니다. 지금은 운영자 문의로 접수해
            주세요.
          </NotReady>
        </StoreFormCard>
      </div>
    )
  }

  if (isLoading || !conditions) {
    return (
      <div className="mt-4">
        <StoreFormCard>
          <CardHeader>브랜드 탈퇴</CardHeader>
          <div className="p-5 text-[12px] text-sz-n-500">불러오는 중…</div>
        </StoreFormCard>
      </div>
    )
  }

  // 4-I — 신청 후에는 공이 운영자에게 넘어간다
  if (pendingRequest) {
    const reasonLabel =
      WITHDRAWAL_REASONS.find(option => option.value === pendingRequest.reason)
        ?.label ?? "선택하지 않음"

    return (
      <div className="mt-4 overflow-hidden rounded-[8px] border border-[#E9C9C9] bg-white">
        <CardHeader pending>
          브랜드 탈퇴
          <span className="ml-auto">
            <StatusBadge variant="neutral">운영자 검토 중</StatusBadge>
          </span>
        </CardHeader>
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-7">
            <Meta label="신청일시">
              <span className="tabular-nums">
                {formatDateTimeShort(pendingRequest.requestedAt)}
              </span>
            </Meta>
            <Meta label="신청 사유">{reasonLabel}</Meta>
            <Meta label="신청자">{pendingRequest.requesterEmail}</Meta>
          </div>
          <div className="mt-4 border-t border-sz-n-100 pt-4 text-[12px] leading-[1.7] text-sz-n-700">
            운영자 확인 후 처리되며 결과는{" "}
            <b className="font-semibold text-sz-n-900">이메일로 안내</b>됩니다.
            처리 전까지{" "}
            <b className="font-semibold text-sz-n-900">계정은 그대로 사용</b>할
            수 있지만 아래는 제한됩니다.
            <br />·{" "}
            <b className="font-semibold text-sz-n-900">
              새 공구를 시작할 수 없습니다
            </b>{" "}
            — 계약 체결과 공구 생성이 차단됩니다(이미 진행 중인 공구는 그대로
            끝까지 운영합니다)
            <br />·{" "}
            <b className="font-semibold text-sz-n-900">
              비밀번호·로그인 이메일 변경 불가
            </b>{" "}
            — 신원이 바뀌면 검토를 다시 시작해야 합니다
            <br />·{" "}
            <b className="font-semibold text-sz-n-900">탈퇴 재신청 불가</b> —
            접수된 신청이 처리될 때까지 새로 신청할 수 없습니다
          </div>
          <div className="mt-4 flex justify-end border-t border-sz-n-100 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={STORE_BUTTON_CLASS}
              isLoading={isCanceling}
              onClick={onCancel}
            >
              탈퇴 신청 취소
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const metCount = conditions.filter(condition => condition.met).length
  const allMet = metCount === conditions.length
  const settlementBlocked = conditions.some(
    condition => condition.key === "SETTLEMENT" && !condition.met
  )

  return (
    <div className="mt-4">
      <StoreFormCard>
        <CardHeader>
          브랜드 탈퇴
          <HeaderNote>
            {allMet ? "신청 조건 충족" : "신청 조건 미충족"}
          </HeaderNote>
        </CardHeader>

        <div className="px-5 pt-4">
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-sz-n-900">
              신청 조건
            </span>
            <span className="text-[11px] text-sz-n-500">
              {allMet
                ? `${conditions.length}개 모두 충족했습니다`
                : "남은 항목을 먼저 정리해 주세요"}
            </span>
            <span className="ml-auto text-[11px] text-sz-n-500 tabular-nums">
              {metCount} / {conditions.length}
            </span>
          </div>
          {conditions.map(condition => (
            <ConditionRow key={condition.key} condition={condition} />
          ))}
        </div>

        {settlementBlocked && (
          <StoreHint className="mx-5 mt-4">
            <b className="font-semibold text-sz-n-700">미정산 잔액</b>은 정산
            이체가 끝나면 자동으로 0원이 됩니다 — 브랜드가 처리할 수 없고
            기다려야 합니다.
          </StoreHint>
        )}

        <StoreButtonRow>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className={STORE_BUTTON_CLASS}
            disabled={!allMet}
            onClick={() => setIsModalOpen(true)}
          >
            탈퇴 신청
          </Button>
        </StoreButtonRow>
      </StoreFormCard>

      <WithdrawalModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async body => {
          if (await onRequest(body)) setIsModalOpen(false)
        }}
      />
    </div>
  )
}

function ConditionRow({ condition }: { condition: WithdrawalCondition }) {
  const meta = CONDITION_META[condition.key]
  const remaining =
    condition.key === "SETTLEMENT"
      ? `${condition.remainingAmount.toLocaleString("ko-KR")}원`
      : `${condition.remainingCount.toLocaleString("ko-KR")}건`

  return (
    <div className="flex items-center gap-2.5 border-t border-sz-n-100 py-[11px]">
      <span
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          condition.met
            ? "bg-sz-success-bg text-sz-success-text"
            : "bg-sz-danger-bg text-sz-danger-text"
        )}
        aria-label={condition.met ? "충족" : "미충족"}
      >
        {condition.met ? "✓" : "!"}
      </span>
      <span className="flex-1 text-[12px] text-sz-n-900">{meta.label}</span>
      <span
        className={cn(
          "text-[12px] tabular-nums",
          condition.met ? "text-sz-n-500" : "text-sz-danger-text"
        )}
      >
        {condition.met ? "" : remaining}
      </span>
      <span className="w-16 shrink-0 text-right">
        {!condition.met && (
          <Link
            to={meta.to}
            className="text-[11px] whitespace-nowrap text-sz-accent-600 hover:underline"
          >
            {meta.linkLabel} ↗
          </Link>
        )}
      </span>
    </div>
  )
}

function Meta(props: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-[3px] text-[11px] text-sz-n-500">{props.label}</div>
      <div className="text-[12px] text-sz-n-900">{props.children}</div>
    </div>
  )
}
