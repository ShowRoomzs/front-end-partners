import RecordNav from "@/common/components/RecordNav/RecordNav"
import Btn from "@/features/contracts/components/shared/Btn"
import SanctionNotice from "@/features/contracts/components/shared/SanctionNotice"
import { OPEN_COUNTERPARTY_HELD_NOTICE } from "@/features/groupBuy/constants/suspension"
import { useAccountSuspension } from "@/features/suspension"
import {
  AfterEndTasksCard,
  ClosureReasonCard,
} from "@/features/groupBuy/components/detail/ClosedSections"
import {
  GroupBuyInfoCard,
  GroupBuyItemsCard,
  GroupBuyPostCard,
  GroupBuySalesCard,
} from "@/features/groupBuy/components/detail/GroupBuyCards"
import {
  ClosedProgressCard,
  ReadinessCard,
  SellingProgressCard,
  SituationCard,
} from "@/features/groupBuy/components/detail/ProgressSection"
import {
  HistoryCard,
  StatusRailCard,
} from "@/features/groupBuy/components/detail/StatusRail"
import {
  AppealModal,
  EarlyCloseRequestModal,
  ExtensionRequestModal,
  SuspensionRequestModal,
  TerminationRequestModal,
} from "@/features/groupBuy/components/modals/GroupBuyModals"
import {
  GROUP_BUY_LIST_PATH,
  TERMINATION_TEXT,
} from "@/features/groupBuy/constants/params"
import {
  useConfirmStock,
  useRequestEarlyClose,
  useRequestExtension,
  useRequestSuspension,
  useRequestTermination,
  useSubmitAppeal,
} from "@/features/groupBuy/hooks/useGroupBuyMutations"
import {
  useGetContractTermination,
  useGetGroupBuyDetail,
} from "@/features/groupBuy/hooks/useGroupBuyQueries"
import { headerMeta, sellingSituation } from "@/features/groupBuy/utils/view"
import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle"
import { useMarketStore } from "@/common/stores/useMarketStore"
import { isApiNotReady } from "@/common/utils/devMock"
import { useCallback, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom"

type ModalKind =
  | "extension"
  | "earlyClose"
  | "suspension"
  | "termination"
  | "appeal"
  | null

/**
 * `/group-buy/:groupBuyId` — 상세 B1~B7a가 모두 이 한 화면이다.
 * 서버가 상태·요청·통지·권한을 판정해 내려주고, 화면은 그 값으로 카드 구성을 고른다.
 */
export default function GroupBuyDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { groupBuyId: idParam } = useRouteParams<{ groupBuyId: string }>()
  const groupBuyId = Number(idParam)
  const { market } = useMarketStore()

  usePageSubtitle("공구 상세")

  // 목록 조건을 넘기면 서버가 그 범위로 이전/다음 공구를 계산한다
  const navParams = useMemo(() => {
    const query = new URLSearchParams(location.search)
    return {
      tab: query.get("tab") ?? undefined,
      keyword: query.get("keyword") || undefined,
      sort: query.get("sort") ?? undefined,
    }
  }, [location.search])

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetGroupBuyDetail(groupBuyId, navParams)
  const [modal, setModal] = useState<ModalKind>(null)
  // 해지 요청 처리 대기 표시 — 오픈 전 공구에서만 원 계약의 요청을 읽는다
  const beforeOpen =
    detail?.groupBuy.status === "PREPARING" ||
    detail?.groupBuy.status === "READY"
  const { data: termination } = useGetContractTermination(
    detail?.contract.contractId,
    beforeOpen
  )

  const { isSuspended } = useAccountSuspension()
  const { mutate: confirmStock, isPending: isConfirming } = useConfirmStock()
  const { mutate: requestExtension, isPending: isExtending } =
    useRequestExtension()
  const { mutate: requestEarlyClose, isPending: isEarlyClosing } =
    useRequestEarlyClose()
  const { mutate: requestSuspension, isPending: isSuspending } =
    useRequestSuspension()
  const { mutate: requestTermination, isPending: isTerminating } =
    useRequestTermination()
  const { mutate: submitAppeal, isPending: isAppealing } = useSubmitAppeal()

  const closeModal = useCallback(() => setModal(null), [])

  const goToList = useCallback(() => {
    navigate({ pathname: GROUP_BUY_LIST_PATH, search: location.search })
  }, [navigate, location.search])

  const goToRecord = useCallback(
    (id: number) => {
      navigate({
        pathname: `${GROUP_BUY_LIST_PATH}/${id}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  const openThreadById = useCallback(
    (threadId: number) => navigate(`/connections?threadId=${threadId}`),
    [navigate]
  )

  if (isLoading) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        불러오는 중…
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center">
        <div className="text-[13px] font-semibold text-sz-n-700">
          공구를 찾을 수 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          삭제되었거나 이 브랜드의 공구가 아닙니다.
        </div>
        <Btn variant="secondary" onClick={() => navigate(GROUP_BUY_LIST_PATH)}>
          목록
        </Btn>
      </div>
    )
  }

  const status = detail.groupBuy.status
  const isPreparing = status === "PREPARING" || status === "READY"
  const isSelling =
    status === "IN_PROGRESS" || status === "SUSPENSION_SCHEDULED"
  const situation =
    isSelling || status === "READY" ? sellingSituation(detail) : null
  const brandName = market?.marketName ?? "브랜드"
  const prevId = detail.navigation?.prevGroupBuyId ?? null
  const nextId = detail.navigation?.nextGroupBuyId ?? null

  const openPairThread = () => {
    if (detail.counterparty.pairThreadId !== null) {
      openThreadById(detail.counterparty.pairThreadId)
    } else {
      navigate(
        `/connections?counterpart=${encodeURIComponent(detail.counterparty.name)}`
      )
    }
  }
  const goSales = () => navigate("/sales/orders")
  // 정산이 생겼으면 그 정산 상세로(서버 `afterEnd.settlementId`), 아니면 정산 목록으로
  const goSettlement = () =>
    navigate(
      detail.afterEnd?.settlementId
        ? `/settlement/history/${detail.afterEnd.settlementId}`
        : "/settlement/history"
    )

  const showSituationCard =
    situation !== null &&
    situation.kind !== "none" &&
    situation.kind !== "notice"

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.groupBuy.title}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {headerMeta(detail)}
          </p>
        </div>
        <RecordNav
          onList={goToList}
          onPrev={prevId !== null ? () => goToRecord(prevId) : undefined}
          onNext={nextId !== null ? () => goToRecord(nextId) : undefined}
        />
      </div>

      {/* 시안 15 R2 — 상대 정지로 오픈이 멈춘 공구. 내 정지는 셸 배너가 같은 말을 해 따로 두지 않는다 */}
      {detail.sanctionHold?.kind === "COUNTERPARTY" && (
        <SanctionNotice
          tone="neutral"
          title={OPEN_COUNTERPARTY_HELD_NOTICE.title}
        >
          {OPEN_COUNTERPARTY_HELD_NOTICE.body}
        </SanctionNotice>
      )}

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          {isPreparing && !(status === "READY" && detail.activeRequest) && (
            <ReadinessCard
              detail={detail}
              isConfirming={isConfirming}
              onConfirmStock={() =>
                confirmStock(detail.groupBuy.groupBuyId, {
                  onSuccess: () =>
                    toast.success("최소 준비 물량 확보를 기록했습니다."),
                })
              }
            />
          )}
          {(isSelling || (status === "READY" && detail.activeRequest)) &&
            situation && (
              <SellingProgressCard detail={detail} situation={situation} />
            )}
          {!isPreparing && !isSelling && <ClosedProgressCard detail={detail} />}

          {showSituationCard && situation && (
            <SituationCard
              detail={detail}
              situation={situation}
              brandName={brandName}
            />
          )}

          {status === "SUSPENDED" && <ClosureReasonCard detail={detail} />}

          {/* rev.5 — 이행 확인 카드는 폐기됐다(서버 afterEnd.fulfillment 항상 null) */}
          {status === "ENDED" && (
            <AfterEndTasksCard
              detail={detail}
              onGoSales={goSales}
              onOpenThread={openThreadById}
            />
          )}

          {(isSelling || status === "SETTLED" || status === "SUSPENDED") && (
            <GroupBuySalesCard detail={detail} />
          )}

          <GroupBuyInfoCard
            detail={detail}
            onOpenThread={openPairThread}
            onOpenContract={() =>
              navigate(`/contract/${detail.contract.contractId}`)
            }
          />
          {/* 시안 B7·B7a — 중단된 공구는 상품 항목 카드를 두지 않는다(접수분은 판매 관리 소관) */}
          {status !== "SUSPENDED" && <GroupBuyItemsCard detail={detail} />}
          <GroupBuyPostCard detail={detail} />
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <StatusRailCard
            detail={detail}
            situation={situation}
            termination={termination ?? null}
            suspended={isSuspended}
            actions={{
              onOpenThread: openPairThread,
              onGoSales: goSales,
              onGoSettlement: goSettlement,
              onExtension: () => setModal("extension"),
              onEarlyClose: () => setModal("earlyClose"),
              onSuspension: () => setModal("suspension"),
              onTermination: () => setModal("termination"),
              onAppeal: () => setModal("appeal"),
            }}
          />
          <HistoryCard detail={detail} />
        </div>
      </div>

      {modal === "extension" && !isSuspended && (
        <ExtensionRequestModal
          detail={detail}
          isPending={isExtending}
          onClose={closeModal}
          onConfirm={body =>
            requestExtension(
              { groupBuyId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success(
                    "연장 요청을 보냈습니다. 인플루언서가 수락하면 반영됩니다."
                  )
                },
              }
            )
          }
        />
      )}
      {modal === "earlyClose" && (
        <EarlyCloseRequestModal
          detail={detail}
          isPending={isEarlyClosing}
          onClose={closeModal}
          onConfirm={body =>
            requestEarlyClose(
              { groupBuyId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success(
                    "조기 마감을 요청했습니다. 운영자가 검토합니다."
                  )
                },
              }
            )
          }
        />
      )}
      {modal === "suspension" && (
        <SuspensionRequestModal
          detail={detail}
          isPending={isSuspending}
          onClose={closeModal}
          onConfirm={body =>
            requestSuspension(
              { groupBuyId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success(
                    "중단을 요청했습니다. 검토 중에도 공구는 계속 진행됩니다."
                  )
                },
              }
            )
          }
        />
      )}
      {modal === "termination" && (
        <TerminationRequestModal
          detail={detail}
          isPending={isTerminating}
          onClose={closeModal}
          onConfirm={body =>
            requestTermination(
              { contractId: detail.contract.contractId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success(TERMINATION_TEXT.toast)
                },
                onError: error => {
                  // 아직 배포되지 않은 서버(404)는 공용 토스트 없이 ApiNotReadyError로 온다
                  if (isApiNotReady(error)) {
                    toast.error("아직 준비 중인 기능입니다.")
                  }
                },
              }
            )
          }
        />
      )}
      {modal === "appeal" && (
        <AppealModal
          detail={detail}
          isPending={isAppealing}
          onClose={closeModal}
          onConfirm={({ content, files }) =>
            submitAppeal(
              { groupBuyId, content, files },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success("소명 자료를 제출했습니다.")
                },
                onError: error => {
                  // 파일 PUT 실패는 우리 API 에러가 아니라 공용 토스트가 뜨지 않는다
                  if (!(error as { isAxiosError?: boolean }).isAxiosError) {
                    toast.error(error.message)
                  }
                },
              }
            )
          }
        />
      )}
    </>
  )
}
