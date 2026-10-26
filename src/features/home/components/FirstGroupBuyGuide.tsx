import Btn from "@/features/contracts/components/shared/Btn"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import { useCreateContract } from "@/features/contracts/hooks/useContractMutations"
import {
  GUIDE_CARDS,
  GUIDE_STEP_LABEL,
  GUIDE_STEP_ORDER,
  GUIDE_TIPS,
  type GuideAction,
} from "@/features/home/constants/guide"
import { HOME_LINKS } from "@/features/home/constants/links"
import { useHideGuide } from "@/features/home/hooks/useHomeQueries"
import type { GuideStepKey, HomeGuide } from "@/features/home/types"
import { SUSPENSION_COPY } from "@/features/suspension"
import { cn } from "@/lib/utils"
import { Fragment, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

const ACTION_PATH: Record<Exclude<GuideAction, "CONTRACT_CREATE">, string> = {
  PRODUCT_REGISTER: HOME_LINKS.productRegister,
  CONNECTIONS: HOME_LINKS.connections,
  GROUP_BUYS: HOME_LINKS.groupBuys,
  ORDERS: HOME_LINKS.orders,
  BASIC_INFO: "/store/basic",
}

/** 정지 중에 막히는 가이드 액션 — 새로 벌이는 일(상품 등록 · 계약 작성)만 */
const BLOCKED_WHEN_SUSPENDED: Array<GuideAction> = [
  "PRODUCT_REGISTER",
  "CONTRACT_CREATE",
]

/** `**굵게**` · `{creator}` 자리표시를 그린다 */
function rich(text: string, creator: string | null): ReactNode {
  const filled = text.replace("{creator}", `**${creator ?? "인플루언서"}**`)
  return filled.split("**").map((part, index) =>
    index % 2 === 1 ? (
      <b key={index} className="text-sz-n-900">
        {part}
      </b>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  )
}

/** 「… [근거 대기 · 검토 SLA]」의 대괄호 꼬리는 흐리게(시안) */
function nextItem(text: string): ReactNode {
  const at = text.indexOf(" [")
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}{" "}
      <span className="text-sz-n-500">{text.slice(at + 1)}</span>
    </>
  )
}

/**
 * 첫 공구 가이드(H3 · H3a) — 시안 `.gd`. 6단계는 서버가 자동 판정하고(사람이 체크하지 않는다),
 * 지금 할 단계 하나만 크게 보여 준다. H1 카드 위에 얹히고 첫 공구가 오픈되면 가이드만 사라진다.
 */
export default function FirstGroupBuyGuide(props: {
  guide: HomeGuide
  suspended: boolean
}) {
  const { guide, suspended } = props
  const navigate = useNavigate()
  const hideGuide = useHideGuide()
  const { mutateAsync: createContract, isPending: isCreating } =
    useCreateContract()

  const doneOf = (key: GuideStepKey) =>
    guide.steps.find(step => step.key === key)?.done ?? false
  const current = (guide.currentStep ?? "ORDERS") as GuideStepKey
  const currentIndex = Math.max(0, GUIDE_STEP_ORDER.indexOf(current))
  const card = GUIDE_CARDS[current] ?? GUIDE_CARDS.PRODUCT
  const blocked =
    suspended && BLOCKED_WHEN_SUSPENDED.includes(card.primary.action)

  const runPrimary = async () => {
    if (card.primary.action === "CONTRACT_CREATE") {
      if (isCreating) return
      const created = await createContract({})
      navigate(`${CONTRACT_LIST_PATH}/${created.contractId}`)
      return
    }
    navigate(ACTION_PATH[card.primary.action])
  }

  return (
    <section className="mb-6 overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center gap-3 border-b border-sz-n-100 px-5 py-4">
        <span className="text-[13px] font-semibold text-sz-n-900">
          첫 공구까지 6단계
        </span>
        <span className="text-[11px] text-sz-n-500">
          {guide.completed} / 6 완료
        </span>
        <span className="ml-auto h-1.5 w-40 overflow-hidden rounded-[3px] bg-sz-n-100">
          <i
            className="block h-full bg-sz-accent-500"
            style={{ width: `${Math.round((guide.completed / 6) * 100)}%` }}
          />
        </span>
        <button
          type="button"
          onClick={() => hideGuide.mutate()}
          disabled={hideGuide.isPending}
          className="cursor-pointer text-[11px] text-sz-n-500 hover:text-sz-n-700"
        >
          가이드 숨기기
        </button>
      </div>

      <div className="grid grid-cols-6 px-5 pt-[18px] pb-4">
        {GUIDE_STEP_ORDER.map((key, index) => {
          const done = doneOf(key)
          const now = index === currentIndex && !done
          return (
            <div
              key={key}
              className="relative flex flex-col items-center gap-1.5 text-center"
            >
              {index > 0 && (
                <span
                  className={cn(
                    "absolute top-[11px] right-[calc(50%+14px)] left-[calc(-50%+14px)] h-0.5",
                    done || now ? "bg-sz-accent-500" : "bg-sz-n-200"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-[1] flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold",
                  done
                    ? "border-sz-accent-500 bg-sz-accent-500 text-white"
                    : now
                      ? "border-sz-accent-500 bg-white text-sz-accent-500 shadow-[0_0_0_4px_var(--color-sz-accent-50)]"
                      : "border-sz-n-300 bg-white text-sz-n-500"
                )}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "text-[12px]",
                  done
                    ? "text-sz-n-700"
                    : now
                      ? "font-semibold text-sz-n-900"
                      : "text-sz-n-500"
                )}
              >
                {GUIDE_STEP_LABEL[key]}
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] border-t border-sz-n-100">
        <div className="p-5">
          <div className="text-[11px] font-semibold text-sz-accent-500">
            지금 할 일 · {currentIndex + 1}단계
          </div>
          <div className="mt-1 text-[16px] font-bold text-sz-n-900">
            {card.title}
          </div>
          <div className="mt-1.5 text-[12px] leading-[1.7] text-sz-n-700">
            {rich(card.description, guide.connectedCreatorName)}
          </div>
          <div className="mt-3.5 rounded-[6px] bg-sz-n-50 px-3.5 py-3">
            <div className="mb-1.5 text-[11px] font-semibold text-sz-n-600">
              이후 진행
            </div>
            <ol className="m-0 list-decimal pl-[18px] text-[12px] leading-[1.8] text-sz-n-700">
              {card.next.map(text => (
                <li key={text}>{nextItem(text)}</li>
              ))}
            </ol>
          </div>
          <div className="mt-4 flex gap-2">
            <Btn
              variant="primary"
              onClick={runPrimary}
              isLoading={isCreating}
              disabled={blocked}
              title={blocked ? SUSPENSION_COPY.blockedTooltip : undefined}
            >
              {card.primary.label}
            </Btn>
            {/* 연결할 안내 화면이 아직 없다 — 자리는 지키고 비활성 */}
            {card.secondaryLabel && (
              <Btn variant="ghost" disabled title="준비 중인 기능입니다.">
                {card.secondaryLabel}
              </Btn>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3.5 border-l border-sz-n-100 p-5">
          <div className="text-[11px] font-semibold text-sz-n-600">
            {GUIDE_TIPS.heading}
          </div>
          <div className="text-[12px] leading-[1.6] text-sz-n-700">
            <b className="text-sz-n-900">{GUIDE_TIPS.shippingTitle}</b> ·{" "}
            {GUIDE_TIPS.shippingText}{" "}
            <Link
              to={HOME_LINKS.shippingPolicy}
              className="text-[11px] text-sz-accent-500"
            >
              {GUIDE_TIPS.shippingLink}
            </Link>
          </div>
          <div className="text-[12px] leading-[1.6] text-sz-n-700">
            <b className="text-sz-n-900">{GUIDE_TIPS.settlementTitle}</b> ·{" "}
            {GUIDE_TIPS.settlementText}
          </div>
          <div className="text-[12px] leading-[1.6] text-sz-n-700">
            <b className="text-sz-n-900">{GUIDE_TIPS.claimTitle}</b> ·{" "}
            {GUIDE_TIPS.claimText}
          </div>
          <div className="mt-auto border-t border-sz-n-100 pt-3">
            <div className="text-[12px] leading-[1.6] text-sz-n-700">
              {GUIDE_TIPS.askText}
            </div>
            <Btn
              className="mt-2"
              onClick={() => navigate(HOME_LINKS.operatorChannel)}
            >
              {GUIDE_TIPS.askButton}
            </Btn>
          </div>
        </div>
      </div>
    </section>
  )
}
