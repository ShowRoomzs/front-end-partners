import { HomeSection } from "@/features/home/components/HomeCard"
import { HOME_LINKS } from "@/features/home/constants/links"
import type { HomePendingTasks } from "@/features/home/types"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

interface TaskItem {
  label: string
  count: number
  to: string
  /** 기한을 넘긴 건만 경고색(원칙 ①) — 「기한 경과 1」 · 「지연 1」 */
  late?: { label: string; count: number }
}

interface TaskGroup {
  title: string
  link: { label: string; to: string }
  items: Array<TaskItem>
}

function groupsOf(tasks: HomePendingTasks): Array<TaskGroup> {
  const { sales, claims, inquiry, contract, settlement } = tasks
  return [
    {
      title: "판매",
      link: { label: "판매 관리 ›", to: HOME_LINKS.orders },
      items: [
        {
          label: "준비 시작",
          count: sales.prepareStart,
          to: HOME_LINKS.prepareStart,
        },
        {
          label: "송장 등록",
          count: sales.invoiceRegister,
          to: HOME_LINKS.invoiceRegister,
          late: { label: "기한 경과", count: sales.shipOverdue },
        },
        {
          label: "취소 요청",
          count: sales.cancelRequests,
          to: HOME_LINKS.cancelRequests,
        },
        {
          label: "배송 이상",
          count: sales.deliveryIssue,
          to: HOME_LINKS.deliveryIssue,
        },
      ],
    },
    {
      title: "반품·교환",
      link: { label: "반품·교환 ›", to: HOME_LINKS.claims },
      items: [
        {
          label: "회수 대기",
          count: claims.collectWait,
          to: HOME_LINKS.collectWait,
        },
        {
          label: "입고·검수",
          count: claims.inspection,
          to: HOME_LINKS.inspection,
          late: { label: "지연", count: claims.inspectOverdue },
        },
        { label: "재발송", count: claims.reship, to: HOME_LINKS.reship },
      ],
    },
    {
      title: "문의",
      link: { label: "문의 관리 ›", to: HOME_LINKS.inquiries },
      items: [
        {
          label: "미답변 상품 문의",
          count: inquiry.unansweredProductInquiries,
          to: HOME_LINKS.unansweredInquiries,
        },
      ],
    },
    {
      title: "계약",
      link: { label: "계약 관리 ›", to: HOME_LINKS.contracts },
      items: [
        {
          label: "내 서명 필요",
          count: contract.mySignatureNeeded,
          to: HOME_LINKS.mySignatureNeeded,
        },
        {
          label: "검토 반려",
          count: contract.reviewRejected,
          to: HOME_LINKS.reviewRejected,
        },
      ],
    },
    {
      title: "정산",
      link: { label: "정산 관리 ›", to: HOME_LINKS.settlements },
      items: [
        {
          label: "조정 협의 · 내 응답",
          count: settlement.adjustmentMyTurn,
          to: HOME_LINKS.adjustmentMyTurn,
        },
      ],
    },
  ]
}

/**
 * 처리 대기 — 시안 `.q-grid` 메뉴별 5묶음. 숫자는 해당 화면의 탭으로 들어가는 입구이고,
 * 0건은 자리를 지킨 채 흐리게 둔다.
 *
 * @param fresh 가입 직후(H3 · H3a) — 0이어도 한 줄 안내로 줄이지 않고 카드를 빈 채로 둔다
 */
export default function PendingTasksSection(props: {
  tasks: HomePendingTasks
  fresh: boolean
}) {
  const { tasks, fresh } = props

  // H2 — 0이 15칸 늘어선 화면은 정보가 없다. 가입 직후는 자리를 익히도록 그대로 둔다
  if (tasks.total === 0 && !fresh) {
    return (
      <HomeSection title="처리 대기">
        <div className="rounded-[8px] border border-sz-n-200 bg-white p-[22px] text-center">
          <div className="text-[13px] font-semibold text-sz-n-900">
            오늘 처리할 일이 없습니다
          </div>
          <div className="mt-1 text-[12px] text-sz-n-500">
            새 주문·반품·문의가 들어오면 여기에 표시됩니다.
          </div>
        </div>
      </HomeSection>
    )
  }

  return (
    <HomeSection
      title="처리 대기"
      hint={
        fresh
          ? "첫 주문이 들어오면 여기서 처리할 일이 쌓입니다"
          : "누르면 해당 화면의 필터가 걸린 채로 이동합니다"
      }
    >
      <div className="grid grid-cols-5 gap-2.5">
        {groupsOf(tasks).map(group => (
          <div
            key={group.title}
            className="rounded-[8px] border border-sz-n-200 bg-white px-3.5 pt-3 pb-1.5"
          >
            <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-sz-n-600">
              {group.title}
              <Link
                to={group.link.to}
                className="font-medium text-sz-accent-500 hover:text-sz-accent-600"
              >
                {group.link.label}
              </Link>
            </div>
            {group.items.map(item => (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex items-center justify-between border-t border-sz-n-100 py-[7px] text-[12px] first-of-type:border-t-0",
                  item.count === 0
                    ? "text-sz-n-400"
                    : "text-sz-n-700 hover:text-sz-accent-600"
                )}
              >
                <span>
                  {item.label}
                  {item.late && item.late.count > 0 && (
                    <span className="ml-1.5 inline-flex h-[18px] items-center rounded-[6px] bg-sz-warning-bg px-1.5 text-[10px] font-semibold text-sz-warning-text">
                      {item.late.label} {item.late.count}
                    </span>
                  )}
                </span>
                <b
                  className={cn(
                    "text-[15px] tabular-nums",
                    item.count === 0
                      ? "font-medium text-sz-n-300"
                      : "font-bold text-sz-n-900"
                  )}
                >
                  {item.count}
                </b>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </HomeSection>
  )
}
