import Btn from "@/features/contracts/components/shared/Btn"
import { SUSPENSION_COPY } from "@/features/suspension/constants/copy"
import { useAccountSuspension } from "@/features/suspension/hooks/useAccountSuspension"
import type { MemberAccountSanction } from "@/features/suspension/types"
import {
  formatSuspendedAt,
  formatSuspendedOn,
  formatWallDate,
} from "@/features/suspension/utils/format"
import {
  SETTLEMENT_ACCOUNT_PATH,
  appealPath,
} from "@/features/suspension/utils/paths"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

interface SuspensionBannerProps {
  /**
   * 정지 상세를 이미 가진 화면(예: 홈 응답의 `account.sanction`)이 넘긴다.
   * 생략하면 `useAccountSuspension()`으로 직접 읽는다 — 셸 · 각 화면 어디에 둬도 같은 배너가 된다.
   */
  sanction?: MemberAccountSanction | null
  className?: string
}

/**
 * 계정 이용 정지 배너 — 시안 ui-partner-15 `.susp`(S1 · S5) · ui-partner-16 H4.
 * 탑바 아래 고정 · 닫기 없음 · 위험 톤. 정지가 아니면 아무것도 그리지 않는다.
 */
export default function SuspensionBanner(props: SuspensionBannerProps) {
  const fromQuery = useAccountSuspension()
  const sanction =
    props.sanction !== undefined ? props.sanction : fromQuery.sanction
  if (!sanction) return null
  return <BannerBody sanction={sanction} className={props.className} />
}

function BannerBody(props: {
  sanction: MemberAccountSanction
  className?: string
}) {
  const { sanction, className } = props
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const term = sanction.term ?? null
  const endsOn = formatWallDate(term?.endsOn)
  const autoRelease = formatWallDate(term?.autoReleaseAt)
  const appealDeadline = formatWallDate(term?.appealDeadlineAt)

  return (
    <div
      role="alert"
      className={cn(
        "mb-4 rounded-[8px] border border-[#F0C9C9] bg-sz-danger-bg px-4 py-3 text-left text-[12px] leading-[1.6] text-sz-danger-text",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-px h-[18px] w-[18px] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
        </svg>

        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            {SUSPENSION_COPY.bannerTitle} ·{" "}
            <span className="font-normal opacity-85">
              사유: {sanction.reasonLabel} · {formatSuspendedAt(sanction)}
            </span>
          </div>
          <div className="mt-0.5 text-sz-n-700">
            {SUSPENSION_COPY.bannerDescription}
          </div>
          <div className="mt-0.5 text-sz-n-700">
            정지 기간{" "}
            <b>
              {formatSuspendedOn(sanction)} ~{" "}
              {endsOn ?? SUSPENSION_COPY.untilReleased}
            </b>
            {term?.periodDays != null && `(${term.periodDays}일)`}
            {autoRelease && (
              <>
                {" "}
                · 자동 해제일 <b>{autoRelease}</b>
              </>
            )}{" "}
            · 이의 신청 기한 <b>{SUSPENSION_COPY.appealDeadlineRule}</b>
            {appealDeadline && `(${appealDeadline}까지)`} ·{" "}
            {SUSPENSION_COPY.withdrawalAllowedPrefix}
            <b>{SUSPENSION_COPY.withdrawalAllowedStrong}</b>
            {SUSPENSION_COPY.withdrawalAllowedSuffix}
          </div>

          {sanction.payoutHeld && (
            <div className="mt-1.5 flex items-center gap-2.5 text-sz-n-700">
              {SUSPENSION_COPY.payoutHeld}
              <Link
                to={SETTLEMENT_ACCOUNT_PATH}
                className="font-medium text-sz-danger-text"
              >
                {SUSPENSION_COPY.payoutHeldLink}
              </Link>
            </div>
          )}

          {expanded && sanction.reasonDetail && (
            <div className="mt-2 border-t border-[#F0C9C9] pt-2 text-sz-n-700">
              <b>{SUSPENSION_COPY.detailLabel}</b> · {sanction.reasonDetail}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* 운영자가 상세 사유를 입력한 경우에만 펼칠 거리가 있다 */}
          {sanction.reasonDetail && (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              className="cursor-pointer whitespace-nowrap text-[11px] text-sz-danger-text underline"
            >
              {expanded ? SUSPENSION_COPY.collapse : SUSPENSION_COPY.expand}
            </button>
          )}
          <Btn onClick={() => navigate(appealPath(sanction))}>
            {SUSPENSION_COPY.appealButton}
          </Btn>
        </div>
      </div>
    </div>
  )
}
