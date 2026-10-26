import { confirm } from "@/common/components/ConfirmModal/confirm"
import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal"
import { Button } from "@/components/ui/button"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import {
  AcceptModal,
  CounterModal,
  RejectModal,
} from "@/features/connections/components/IssueThread/AdjustmentModals"
import IssuePin from "@/features/connections/components/IssueThread/IssuePin"
import {
  headStatus,
  isClosedStatus,
} from "@/features/connections/components/IssueThread/issueView"
import type { AdjustmentResponse } from "@/features/connections/components/IssueThread/SystemCard"
import MessageInput from "@/features/connections/components/MessageInput/MessageInput"
import MessageList from "@/features/connections/components/MessageList/MessageList"
import VideoPlayerModal from "@/features/connections/components/VideoPlayerModal/VideoPlayerModal"
import {
  CONNECTED_THREAD_STATUS_TEXT,
  ISSUE_CLOSED_INPUT_TEXT,
  ISSUE_CLOSED_NOTICE_TEXT,
  ISSUE_NOTICE_TEXT,
  OPERATOR_CHANNEL_STATUS_TEXT,
  OPERATOR_NOTICE_TEXT,
} from "@/features/connections/constants/params"
import { useGetThreadMessages } from "@/features/connections/hooks/useGetThreadMessages"
import { useMarkThreadRead } from "@/features/connections/hooks/useMarkThreadRead"
import { useOutgoingMessages } from "@/features/connections/hooks/useOutgoingMessages"
import {
  useAdjustmentActions,
  useGetThreadAdjustment,
} from "@/features/connections/hooks/useThreadAdjustment"
import type {
  AttachmentSummary,
  ThreadListItem,
} from "@/features/connections/services/threadService"
import { downloadAttachment } from "@/features/connections/utils/download"
import Btn from "@/features/contracts/components/shared/Btn"
import { CONTRACT_LIST_PATH } from "@/features/contracts/constants/params"
import { useCreateContract } from "@/features/contracts/hooks/useContractMutations"
import { GROUP_BUY_LIST_PATH } from "@/features/groupBuy/constants/params"
import { SETTLEMENT_LIST_PATH } from "@/features/settlement/constants/params"
import { isAxiosError } from "axios"
import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

interface ThreadPanelProps {
  thread: ThreadListItem
}

/** 열린 응답 모달 — 어느 제안에 답하는지 함께 든다 */
interface ResponseState {
  response: AdjustmentResponse
  proposalId: number
}

interface LightboxState {
  images: Array<AttachmentSummary>
  index: number
  senderLabel: string
}

/**
 * 우측 소통 스레드 (시안 `.cs-thread`).
 *
 * 정산 조정 이슈 스레드(kind = SETTLEMENT_ADJUSTMENT · 시안 ui-partner-14)는 같은 틀에 세 가지가 더해진다 —
 * 머리 아래 고정 카드(공구 · 보류 금액 · 요청 금액 · 합의 기한), 절차 카드의 응답 버튼(동의 · 다른 금액 제안 ·
 * 반대), 종결 뒤 입력 잠금. 버튼 권한 · 차례는 전부 서버 값이다.
 */
export default function ThreadPanel(props: ThreadPanelProps) {
  const { thread } = props
  const navigate = useNavigate()

  const { messages, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetThreadMessages(thread.threadId)
  const { outgoing, send, retry, cancel } = useOutgoingMessages(thread.threadId)
  useMarkThreadRead(thread.threadId, thread.unreadCount)
  const { mutateAsync: createContract, isPending: isCreatingContract } =
    useCreateContract()

  const isIssue = thread.kind === "SETTLEMENT_ADJUSTMENT"
  const { data: issueView, error: issueError } = useGetThreadAdjustment(
    thread.threadId,
    isIssue
  )
  const { counter, accept, reject, withdraw } = useAdjustmentActions(
    thread.threadId
  )
  const [responding, setResponding] = useState<ResponseState | null>(null)
  const isResponding =
    counter.isPending ||
    accept.isPending ||
    reject.isPending ||
    withdraw.isPending

  /**
   * [요청 철회](시안 T1 · 기-14) — 시안에는 확인 단계가 없지만, 철회하면 원래 금액으로 바로 확정되고
   * 같은 사안을 다시 요청할 수 없어 되돌릴 수 없는 결정이라 한 번 확인받는다.
   */
  const handleWithdraw = async () => {
    if (!issueView || withdraw.isPending) return
    const ok = await confirm({
      title: "정산 조정 요청을 철회할까요?",
      content:
        "철회하면 원래 금액으로 바로 확정되고 이슈가 종결됩니다. 같은 사안으로 다시 요청할 수 없습니다.",
      confirmText: "요청 철회",
    })
    if (!ok) return
    withdraw.mutate(issueView, {
      onSuccess: () =>
        toast.success("요청을 철회했습니다. 원래 금액으로 확정됐습니다."),
    })
  }

  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [playingVideo, setPlayingVideo] = useState<AttachmentSummary | null>(
    null
  )

  const currentImage = lightbox?.images[lightbox.index]

  const openGroupBuy = (groupBuyId: number) =>
    navigate(`${GROUP_BUY_LIST_PATH}/${groupBuyId}`)
  const openSettlement = (settlementId: number) =>
    navigate(`${SETTLEMENT_LIST_PATH}/${settlementId}`)

  /**
   * [계약 작성] — 스레드 경유 진입은 상대가 **자동 지정 · 변경 불가**다(§25-6-1).
   * 스레드 행의 creatorId·connectionId를 초안 생성 요청에 그대로 보낸다.
   */
  const handleCreateContract = async () => {
    if (isCreatingContract || thread.creatorId === null) {
      return
    }
    try {
      const created = await createContract({
        creatorId: thread.creatorId,
        connectionId: thread.connectionId,
      })
      navigate(`${CONTRACT_LIST_PATH}/${created.contractId}`)
    } catch {
      // 인터셉터가 서버 문구를 토스트로 띄운다
    }
  }

  // 시안 T5 — 이슈가 없다(스레드 종류는 이슈인데 협의를 찾지 못함). 여기서 만들 수 없어 CTA가 없다
  if (
    isIssue &&
    isAxiosError(issueError) &&
    issueError.response?.status === 404
  ) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 bg-sz-n-50 p-10 text-center">
        <div className="text-[13px] font-semibold text-sz-n-600">
          진행 중인 이슈가 없습니다
        </div>
        <div className="max-w-[340px] text-[12px] leading-[1.7] text-sz-n-500">
          공구 종료 후 정산 확인 기간에 <b>정산 조정 요청</b>이 들어오면 정산이
          보류되고 이슈 스레드가 자동으로 열립니다. 그 밖의 이견은 상대와의 1:1
          스레드에서 이야기해 주세요.
        </div>
      </div>
    )
  }

  // 고정 카드를 아직 못 읽었으면 목록 줄의 요약으로 머리 · 잠금을 정한다
  const issueStatus = issueView?.status ?? thread.adjustment?.status ?? "OPEN"
  const issueTurnLabel =
    issueView?.turnLabel ?? thread.adjustment?.turnLabel ?? ""
  const isIssueClosed = isIssue && isClosedStatus(issueStatus)
  const canSend = issueView ? issueView.permissions.canSend : !isIssueClosed
  const groupBuyId = issueView?.groupBuy.groupBuyId ?? thread.groupBuyId

  const respondingProposal =
    responding && issueView
      ? (issueView.proposals.find(
          proposal => proposal.proposalId === responding.proposalId
        ) ?? issueView.latestProposal)
      : null
  const closeResponse = () => setResponding(null)

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-sz-n-50">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sz-n-200 bg-white px-5">
        <CounterpartAvatar
          name={thread.counterpartName}
          imageUrl={thread.counterpartImageUrl}
          isOperator={thread.operatorChannel}
          className="h-10 w-10"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-sz-n-900">
            {thread.counterpartName}
          </div>
          <div className="mt-0.5 text-[11px] text-sz-n-500">
            {isIssue
              ? headStatus(
                  issueStatus,
                  issueTurnLabel,
                  issueView?.closedAt ?? null
                )
              : thread.operatorChannel
                ? OPERATOR_CHANNEL_STATUS_TEXT
                : CONNECTED_THREAD_STATUS_TEXT}
          </div>
        </div>
        {/*
          [계약 작성]은 연결됨일 때만 활성이다(§13-5). 운영자 채널엔 계약 개념이
          없어 버튼 자체를 두지 않는다. 누르면 이 상대로 고정된 빈 초안이 만들어지고
          작성 화면으로 넘어간다.
        */}
        {isIssue && (
          <Btn
            variant="secondary"
            disabled={groupBuyId === null}
            onClick={() => groupBuyId !== null && openGroupBuy(groupBuyId)}
          >
            공구 상세
          </Btn>
        )}
        {!thread.operatorChannel && !isIssue && (
          <Button
            type="button"
            size="sm"
            disabled={thread.connectionStatus !== "CONNECTED"}
            isLoading={isCreatingContract}
            onClick={handleCreateContract}
          >
            계약 작성
          </Button>
        )}
      </div>

      {/*
        운영자 열람 고지는 스크롤과 무관하게 항상 보여야 한다(§13-4) —
        스크롤로 사라지면 "상시 고지" 요건을 만족하지 못한다.
      */}
      {!thread.operatorChannel && (
        <div className="shrink-0 bg-sz-n-100 px-4 py-2 text-center text-[11px] text-sz-n-500">
          {!isIssue
            ? OPERATOR_NOTICE_TEXT
            : isIssueClosed
              ? ISSUE_CLOSED_NOTICE_TEXT
              : ISSUE_NOTICE_TEXT}
        </div>
      )}

      {isIssue && issueView && (
        <IssuePin
          view={issueView}
          onOpenGroupBuy={() => openGroupBuy(issueView.groupBuy.groupBuyId)}
          onOpenSettlement={() =>
            openSettlement(issueView.settlement.settlementId)
          }
        />
      )}

      <MessageList
        messages={messages}
        outgoing={outgoing}
        counterpartName={thread.counterpartName}
        hasOlderMessages={Boolean(hasNextPage)}
        isFetchingOlder={isFetchingNextPage}
        onLoadOlder={() => void fetchNextPage()}
        onRetry={retry}
        onCancel={cancel}
        onClickImage={(images, index, senderLabel) =>
          setLightbox({ images, index, senderLabel })
        }
        onPlayVideo={setPlayingVideo}
        issueView={isIssue ? (issueView ?? null) : null}
        isResponding={isResponding}
        onRespond={(response, proposalId) =>
          response === "WITHDRAW"
            ? void handleWithdraw()
            : setResponding({ response, proposalId })
        }
      />

      <MessageInput
        onSend={send}
        lockedText={canSend ? undefined : ISSUE_CLOSED_INPUT_TEXT}
      />

      {issueView &&
        respondingProposal &&
        responding?.response === "COUNTER" && (
          <CounterModal
            view={issueView}
            proposal={respondingProposal}
            isPending={counter.isPending}
            onClose={closeResponse}
            onSubmit={(rewardAmount, reason) =>
              counter.mutate(
                {
                  adjustmentId: issueView.adjustmentId,
                  body: { rewardAmount, reason: reason || undefined },
                },
                {
                  onSuccess: () => toast.success("다른 금액을 제안했습니다."),
                  onSettled: closeResponse,
                }
              )
            }
          />
        )}
      {issueView && respondingProposal && responding?.response === "ACCEPT" && (
        <AcceptModal
          view={issueView}
          proposal={respondingProposal}
          isPending={accept.isPending}
          onClose={closeResponse}
          onSubmit={() =>
            accept.mutate(
              {
                adjustmentId: issueView.adjustmentId,
                proposalId: respondingProposal.proposalId,
              },
              {
                onSuccess: () =>
                  toast.success(
                    "동의했습니다. 정산 금액이 바뀌고 보류가 해제됐습니다."
                  ),
                onSettled: closeResponse,
              }
            )
          }
        />
      )}
      {issueView && respondingProposal && responding?.response === "REJECT" && (
        <RejectModal
          view={issueView}
          proposal={respondingProposal}
          isPending={reject.isPending}
          onClose={closeResponse}
          onSubmit={() =>
            reject.mutate(
              {
                adjustmentId: issueView.adjustmentId,
                proposalId: respondingProposal.proposalId,
              },
              {
                onSuccess: () => toast.success("반대를 등록했습니다."),
                onSettled: closeResponse,
              }
            )
          }
        />
      )}

      <PreviewModal
        isOpen={Boolean(currentImage)}
        onOpenChange={open => !open && setLightbox(null)}
        imageUrl={currentImage?.fileUrl ?? ""}
        currentIndex={lightbox?.index ?? 0}
        fileLength={lightbox?.images.length ?? 0}
        onIndexChange={index =>
          setLightbox(current => current && { ...current, index })
        }
        senderLabel={lightbox?.senderLabel}
        onDownload={() =>
          currentImage && downloadAttachment(currentImage.attachmentId)
        }
      />

      <VideoPlayerModal
        attachment={playingVideo}
        onClose={() => setPlayingVideo(null)}
      />
    </div>
  )
}
