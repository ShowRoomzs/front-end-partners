import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { cn } from "@/lib/utils"

interface SignatureBoxesProps {
  brandName: string
  creatorName: string
  brandSignedAt: string | null
  creatorSignedAt: string | null
  /** 「N 기준」 — 체결완료 이후에는 내리지 않는다 */
  asOf: string | null
  /** 만료 화면 — 상대 칸에 열람 기록 유무를 적는다 */
  counterpartyViewed?: boolean
  isExpired?: boolean
  /** 내 칸의 [서명 안내 다시 받기] — 서버 permissions.canRequestResend */
  showResend: boolean
  isResending: boolean
  onResend: () => void
}

/**
 * 시안 `.signs` — 서명 카드 2장. 내 칸(브랜드)이 왼쪽이고 액센트로 강조된다.
 * 서명 버튼은 없다(rev.7) — 링크를 우리가 갖지 못하므로 [서명 안내 다시 받기]만 둔다.
 * 값은 어드민이 모두싸인에서 확인한 시점 기준이라 그 시각을 아래에 밝힌다.
 */
export default function SignatureBoxes(props: SignatureBoxesProps) {
  const {
    brandName,
    creatorName,
    brandSignedAt,
    creatorSignedAt,
    asOf,
    counterpartyViewed = false,
    isExpired = false,
    showResend,
    isResending,
    onResend,
  } = props

  return (
    <>
      <div className="mt-4 flex gap-3">
        <SignBox mine who="브랜드(나)" name={brandName}>
          {brandSignedAt ? (
            <Done at={brandSignedAt} />
          ) : (
            <>
              <div className="text-[11px] text-sz-n-500">
                {isExpired ? (
                  "미서명"
                ) : (
                  <>
                    서명 대기 ·{" "}
                    <b className="font-semibold text-sz-n-700">
                      메일·문자로 받은 전자서명 링크
                    </b>
                    에서 서명합니다
                  </>
                )}
              </div>
              {showResend && (
                <>
                  <Btn
                    variant="secondary"
                    className="mt-[9px] w-full"
                    isLoading={isResending}
                    onClick={onResend}
                  >
                    서명 안내 다시 받기
                  </Btn>
                  <div className="mt-1.5 text-[11px] leading-[1.6] text-sz-n-500">
                    누르면{" "}
                    <b className="font-semibold text-sz-n-700">
                      운영팀 소통 스레드
                    </b>
                    에 재발송 요청이 자동 등록되고, 운영자가 확인한 뒤
                    모두싸인에서 다시 보냅니다.
                  </div>
                </>
              )}
            </>
          )}
        </SignBox>
        <SignBox who="인플루언서" name={creatorName}>
          {creatorSignedAt ? (
            <Done at={creatorSignedAt} />
          ) : (
            <div className="text-[11px] text-sz-n-500">
              {isExpired
                ? counterpartyViewed
                  ? "미서명 · 계약서 열람함"
                  : "미서명 · 계약서 열람 기록 없음"
                : "서명 대기 · 메일·문자로 받은 전자서명 링크에서 서명합니다"}
            </div>
          )}
        </SignBox>
      </div>
      {asOf && (
        <div className="mt-2.5 border-t border-sz-n-100 pt-[9px] text-[11px] leading-[1.6] text-sz-n-500">
          서명 현황은{" "}
          <b className="font-semibold text-sz-n-700">
            어드민이 모두싸인에서 확인한 시점
          </b>{" "}
          기준입니다 ·{" "}
          <span className="tabular-nums">{formatDateTimeShort(asOf)} 기준</span>
        </div>
      )}
    </>
  )
}

function SignBox(props: {
  mine?: boolean
  who: string
  name: string
  children: React.ReactNode
}) {
  const { mine = false, who, name, children } = props
  return (
    <div
      className={cn(
        "flex-1 rounded-[6px] border p-[14px]",
        mine
          ? "border-sz-accent-100 bg-sz-accent-50"
          : "border-sz-n-200 bg-sz-n-50"
      )}
    >
      <div className="text-[11px] text-sz-n-500">{who}</div>
      <div className="mb-2.5 mt-1 text-[12px] font-semibold text-sz-n-900">
        {name}
      </div>
      {children}
    </div>
  )
}

function Done(props: { at: string }) {
  return (
    <div className="text-[11px] font-medium text-sz-success-text">
      ✓ 서명 완료{" "}
      <span className="font-normal tabular-nums text-sz-n-500">
        — {formatDateTimeShort(props.at)}
      </span>
    </div>
  )
}
