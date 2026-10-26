import NotReady from "@/common/components/NotReady/NotReady"
import { isApiNotReady } from "@/common/utils/devMock"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  ContractsCard,
  SettlementCard,
  UpcomingCard,
} from "@/features/home/components/BottomCards"
import FirstGroupBuyGuide from "@/features/home/components/FirstGroupBuyGuide"
import GroupBuyCalendar from "@/features/home/components/GroupBuyCalendar"
import { HomeSection } from "@/features/home/components/HomeCard"
import LiveGroupBuyCard from "@/features/home/components/LiveGroupBuyCard"
import PendingTasksSection from "@/features/home/components/PendingTasksSection"
import {
  useGetHome,
  useGetHomeLive,
} from "@/features/home/hooks/useHomeQueries"
import { useAccountSuspension } from "@/features/suspension"
import type { ReactNode } from "react"

/**
 * 파트너센터 홈 — 시안 ui-partner-16-home rev.3(H1 · H2 · H3 · H3a · H4).
 * 「오늘 처리할 일이 몇 건이고 어디로 가면 되나」에만 답한다 — 분석은 성과 관리, 금액 분해는 정산 관리 몫.
 * 읽는 순서: (가이드) → 처리 대기 → 진행 중 공구 실시간 → 공구 일정 달력 → 계약 진행 · 오픈 예정 · 정산.
 */
export default function HomePage() {
  const { data: home, error, isLoading, refetch } = useGetHome()
  const { data: live } = useGetHomeLive(home?.live)
  const suspension = useAccountSuspension()
  // 계정 상태 API와 홈 응답의 account는 같은 블록이다 — 어느 쪽이 먼저 오든 정지 표시를 맞춘다
  const suspended =
    suspension.isSuspended || home?.account?.status === "SUSPENDED"
  const guideVisible = home?.guide.visible ?? false

  const header = (
    <div className="mb-4">
      <h1 className="text-[20px] font-semibold text-sz-n-900">홈</h1>
      <p className="mt-0.5 text-[12px] text-sz-n-600">
        {guideVisible
          ? "SHOWROOMZ 파트너센터에 오신 것을 환영합니다."
          : "오늘 처리할 일을 확인합니다."}
      </p>
    </div>
  )

  if (isLoading) return header

  if (!home) {
    return (
      <>
        {header}
        <Panel>
          {isApiNotReady(error) ? (
            <NotReady title="준비 중인 기능입니다.">
              파트너센터 대시보드는 아직 준비 중입니다.
            </NotReady>
          ) : (
            <NotReady
              title="홈을 불러오지 못했습니다."
              action={<Btn onClick={() => refetch()}>다시 시도</Btn>}
            />
          )}
        </Panel>
      </>
    )
  }

  return (
    <div>
      {/* 정지 배너는 셸(MainLayout)이 모든 페이지에 붙인다 */}
      {header}

      {guideVisible && (
        <FirstGroupBuyGuide guide={home.guide} suspended={suspended} />
      )}

      <PendingTasksSection tasks={home.pendingTasks} fresh={guideVisible} />

      <HomeSection>
        <LiveGroupBuyCard live={live ?? home.live} />
      </HomeSection>

      <HomeSection>
        <GroupBuyCalendar />
      </HomeSection>

      <HomeSection className="grid grid-cols-3 items-stretch gap-4">
        <ContractsCard
          count={home.contractsInProgress.count}
          items={home.contractsInProgress.items}
          connectedCreatorCount={home.guide.connectedCreatorCount}
          suspended={suspended}
        />
        <UpcomingCard
          count={home.upcomingGroupBuys.count}
          items={home.upcomingGroupBuys.items}
        />
        <SettlementCard settlement={home.settlement} />
      </HomeSection>
    </div>
  )
}

function Panel(props: { children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white">
      {props.children}
    </div>
  )
}
