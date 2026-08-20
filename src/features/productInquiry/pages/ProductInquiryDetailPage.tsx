import DetailCard, {
  FieldRow,
  MetaRow,
} from "@/common/components/DetailCard/DetailCard"
import HistoryList, {
  type HistoryItem,
} from "@/common/components/HistoryList/HistoryList"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import ThreadMessage from "@/common/components/ThreadMessage/ThreadMessage"
import { useMarketStore } from "@/common/stores/useMarketStore"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import AnswerForm from "@/features/productInquiry/components/AnswerForm/AnswerForm"
import DeleteRequestModal from "@/features/productInquiry/components/DeleteRequestModal/DeleteRequestModal"
import { INQUIRY_INITIAL_PARAMS } from "@/features/productInquiry/constants/params"
import { useGetProductInquiryDetail } from "@/features/productInquiry/hooks/useGetProductInquiryDetail"
import {
  useModifyAnswer,
  useRegisterAnswer,
  useRequestInquiryDelete,
} from "@/features/productInquiry/hooks/useProductInquiryActions"
import { INQUIRY_LIST_PATH } from "@/features/productInquiry/pages/ProductInquiryListPage"
import type {
  InquiryDeleteReason,
  InquirySort,
  InquiryStatusFilter,
  InquiryVisibility,
  ProductInquiryDetailParams,
  ProductInquiryTypeCode,
} from "@/features/productInquiry/types"
import { getInquiryStatusVariant } from "@/features/productInquiry/utils/statusBadge"
import { useCallback, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
  useSearchParams,
} from "react-router-dom"

/**
 * 이력 점 색 — 라벨은 서버가 내려주므로 여기서는 톤만 정한다.
 *
 * 삭제 집행만 위험색이다. 소비자 노출이 실제로 막힌 사건이라 이력에서도 즉시 눈에
 * 띄어야 한다. 서버가 새 이벤트 코드를 늘려도 화면이 죽지 않게 기본값을 둔다.
 */
const HISTORY_TONE: Record<string, HistoryItem["tone"]> = {
  REGISTERED: "accent",
  ANSWERED: "success",
  ANSWER_MODIFIED: "muted",
  DELETE_REQUESTED: "warn",
  DELETE_REJECTED: "accent",
  DELETE_EXECUTED: "danger",
}

/**
 * A2 — 상품 문의 상세(파트너센터).
 *
 * 브랜드가 할 수 있는 일은 **답변 등록·수정**과 **삭제 요청** 셋뿐이다. 삭제 집행도,
 * 요청 취소도 여기에 없다. 어떤 버튼을 보일지는 전부 서버 플래그가 정한다 —
 * 상태 조합으로 다시 계산하면 서버 규칙이 바뀔 때 화면만 낡은 판단을 하게 된다.
 *
 * 이 화면에는 에러 문구가 하나도 없다(§23-4·§23-5). 입력 상한은 `maxlength`로 막고
 * 필수 미입력은 버튼 비활성으로만 알린다.
 */
export default function ProductInquiryDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { inquiryId: inquiryIdParam } = useRouteParams<{ inquiryId: string }>()
  const [searchParams] = useSearchParams()
  const { market } = useMarketStore()
  const inquiryId = Number(inquiryIdParam)

  // 목록에서 들고 온 조건 — 서버가 이 범위로 이전/다음을 계산한다
  const detailParams = useMemo<ProductInquiryDetailParams>(
    () => ({
      status: (searchParams.get("status") ??
        INQUIRY_INITIAL_PARAMS.status) as InquiryStatusFilter,
      types: searchParams.getAll("types") as Array<ProductInquiryTypeCode>,
      visibilities: searchParams.getAll(
        "visibilities"
      ) as Array<InquiryVisibility>,
      keyword: searchParams.get("keyword") ?? "",
      sort: (searchParams.get("sort") ??
        INQUIRY_INITIAL_PARAMS.sort) as InquirySort,
    }),
    [searchParams]
  )

  const { data: detail, isLoading } = useGetProductInquiryDetail(
    inquiryId,
    detailParams
  )
  const { mutateAsync: registerAnswer, isPending: isRegistering } =
    useRegisterAnswer()
  const { mutateAsync: modifyAnswer, isPending: isModifying } =
    useModifyAnswer()
  const { mutateAsync: requestDelete, isPending: isRequesting } =
    useRequestInquiryDelete()

  const [isEditingAnswer, setIsEditingAnswer] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const goToList = useCallback(() => {
    navigate({ pathname: INQUIRY_LIST_PATH, search: location.search })
  }, [navigate, location.search])

  const handleRegister = useCallback(
    async (answerContent: string) => {
      if (isRegistering) {
        return
      }
      try {
        await registerAnswer({ inquiryId, answerContent })
        toast.success("답변을 등록했습니다. 소비자 화면에 바로 노출됩니다.")
      } catch {
        toast.error("답변 등록에 실패했습니다.")
      }
    },
    [inquiryId, isRegistering, registerAnswer]
  )

  const handleModify = useCallback(
    async (answerContent: string) => {
      if (isModifying) {
        return
      }
      try {
        await modifyAnswer({ inquiryId, answerContent })
        setIsEditingAnswer(false)
        toast.success("답변을 수정했습니다.")
      } catch {
        // 입력을 날리지 않도록 폼은 열어 둔다 — 재시도가 가능해야 한다
        toast.error("답변 수정에 실패했습니다.")
      }
    },
    [inquiryId, isModifying, modifyAnswer]
  )

  const handleRequestDelete = useCallback(
    async (reason: InquiryDeleteReason, requestDetail: string) => {
      if (isRequesting) {
        return
      }
      try {
        await requestDelete({
          inquiryId,
          data: { reason, detail: requestDetail || undefined },
        })
        setIsDeleteOpen(false)
        toast.success("삭제를 요청했습니다. 운영자 검토 결과를 기다려 주세요.")
      } catch {
        toast.error("삭제 요청에 실패했습니다.")
      }
    },
    [inquiryId, isRequesting, requestDelete]
  )

  if (isLoading || !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "문의를 찾을 수 없습니다."}
      </div>
    )
  }

  const { deleteRequest } = detail
  const isDeleted = detail.exposureStatus === "DELETED"
  const variant = getInquiryStatusVariant(detail.status, detail.exposureStatus)

  const historyItems: Array<HistoryItem> = detail.history.map(item => ({
    label: item.label,
    tone: HISTORY_TONE[item.event] ?? "muted",
    processedAt: item.occurredAt,
    processorName: item.actorLabel,
  }))

  /*
    답변 시각은 등록과 수정을 **병기**한다(§23-4). 수정 시각으로 갈아치우면 소비자
    화면에 처음 답이 붙은 시점이 사라져 응답 속도 근거가 없어진다.
  */
  const answerMeta = [
    detail.answeredAt && `등록 ${formatDateTimeShort(detail.answeredAt)}`,
    detail.answerModifiedAt &&
      `수정 ${formatDateTimeShort(detail.answerModifiedAt)}`,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">문의 상세</h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            {detail.typeName} · {detail.inquiryNumber}
          </p>
        </div>

        <RecordNav
          onList={goToList}
          onPrev={
            detail.prevInquiryId
              ? () =>
                  navigate({
                    pathname: `${INQUIRY_LIST_PATH}/${detail.prevInquiryId}`,
                    search: location.search,
                  })
              : undefined
          }
          onNext={
            detail.nextInquiryId
              ? () =>
                  navigate({
                    pathname: `${INQUIRY_LIST_PATH}/${detail.nextInquiryId}`,
                    search: location.search,
                  })
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="문의 정보" note={detail.inquiryNumber}>
            <FieldRow label="문의 유형">
              <StatusBadge variant="neutral" hideDot>
                {detail.typeName}
              </StatusBadge>
            </FieldRow>
            <FieldRow label="상품">
              {detail.productName}{" "}
              <button
                type="button"
                onClick={() => navigate(`/product/edit/${detail.productId}`)}
                className="text-[12px] text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
              >
                상품 보기
              </button>
            </FieldRow>
            {/*
              작성자는 마스킹된 닉네임뿐이다. 실명·연락처도, 회원 상세 링크도 없다 —
              브랜드에게 소비자 신원을 열어 줄 근거가 없다(§23-3).
            */}
            <FieldRow label="작성자">{detail.writerName}</FieldRow>
            <FieldRow label="공개 여부">
              {/* 비밀글은 상태가 아니라 분류라 점 없는 배지를 쓴다 */}
              {detail.secret ? (
                <StatusBadge variant="neutral" hideDot>
                  {detail.visibilityName}
                </StatusBadge>
              ) : (
                detail.visibilityName
              )}
            </FieldRow>
            <FieldRow label="등록일시">
              <span className="tabular-nums">
                {formatDateTimeShort(detail.createdAt)}
              </span>
            </FieldRow>
          </DetailCard>

          <DetailCard title="문의 내용" note="소비자 입력">
            <div className="pt-2">
              <ThreadMessage
                authorName={detail.writerName}
                roleLabel="소비자"
                sentAt={detail.createdAt}
                content={detail.content}
                imageUrls={detail.imageUrls}
              />
            </div>
          </DetailCard>

          <DetailCard title="답변" note={detail.answerElapsedText ?? undefined}>
            {detail.answerContent && !isEditingAnswer && (
              <div className="pt-2">
                <ThreadMessage
                  // 답변 작성자명을 서버가 내려주지 않는다 — 마켓 하나에 답변도
                  // 하나뿐이라 지금 로그인한 마켓 이름이 곧 작성자다
                  authorName={market?.marketName ?? "브랜드"}
                  roleLabel="브랜드"
                  meta={answerMeta}
                  sentAt={detail.answeredAt ?? detail.createdAt}
                  content={detail.answerContent}
                  emphasized
                />
                {detail.canModifyAnswer && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingAnswer(true)}
                      className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
                    >
                      답변 수정
                    </button>
                  </div>
                )}
              </div>
            )}

            {detail.answerContent && isEditingAnswer && (
              <AnswerForm
                initialValue={detail.answerContent}
                submitLabel="수정 저장"
                isSubmitting={isModifying}
                onCancel={() => setIsEditingAnswer(false)}
                onSubmit={handleModify}
              />
            )}

            {!detail.answerContent && detail.canRegisterAnswer && (
              <AnswerForm
                submitLabel="답변 등록"
                isSubmitting={isRegistering}
                onSubmit={handleRegister}
              />
            )}

            {/*
              답변도 없고 쓸 수도 없는 상태(삭제 요청 검토 중·삭제됨). 카드를 감추지
              않는 건 의도된 것이다 — 답하지 못한 채로 끝났다는 사실 자체가 기록이다.
            */}
            {!detail.answerContent && !detail.canRegisterAnswer && (
              <p className="py-3 text-[12px] text-sz-n-500">
                지금은 답변을 등록할 수 없습니다. 삭제 요청이 검토 중이거나 이미
                삭제된 문의입니다.
              </p>
            )}
          </DetailCard>

          {/*
            삭제 요청 카드는 요청이 있는 건에만 그린다. 반려·집행된 뒤에도 지우지
            않는다 — 무엇을 근거로 요청했고 운영자가 어떻게 판단했는지가 한 화면에서
            대조돼야 한다.
          */}
          {deleteRequest && (
            <DetailCard
              title="삭제 요청"
              note={
                deleteRequest.underReview
                  ? "운영자 검토 중"
                  : deleteRequest.rejected
                    ? "반려됨"
                    : undefined
              }
            >
              <FieldRow label="요청 사유">{deleteRequest.reasonName}</FieldRow>
              {deleteRequest.detail && (
                <FieldRow label="상세 설명">{deleteRequest.detail}</FieldRow>
              )}
              <FieldRow label="요청일시">
                <span className="tabular-nums">
                  {formatDateTimeShort(deleteRequest.requestedAt)}
                </span>
              </FieldRow>
              {deleteRequest.reviewedAt && (
                <FieldRow label="검토일시">
                  <span className="tabular-nums">
                    {formatDateTimeShort(deleteRequest.reviewedAt)}
                  </span>
                </FieldRow>
              )}
              {/*
                운영자의 삭제 사유는 내부 기록이라 이 응답에 오지 않는다(§23-5).
                브랜드가 받는 건 반려 사유뿐이다.
              */}
              {deleteRequest.rejected && deleteRequest.rejectReason && (
                <FieldRow label="반려 사유">
                  {deleteRequest.rejectReason}
                </FieldRow>
              )}
              {deleteRequest.deletedAt && (
                <FieldRow label="삭제일시">
                  <span className="tabular-nums">
                    {formatDateTimeShort(deleteRequest.deletedAt)}
                  </span>
                </FieldRow>
              )}
            </DetailCard>
          )}
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="처리">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">현재 상태</span>
              <StatusBadge variant={variant}>{detail.statusLabel}</StatusBadge>
            </div>

            {/* 레이아웃은 고정이고 표시 항목만 상태별로 달라진다 */}
            <div className="pt-2">
              <MetaRow
                label="등록일시"
                value={
                  <span className="tabular-nums">
                    {formatDateTimeShort(detail.createdAt)}
                  </span>
                }
              />
              {detail.answeredAt && (
                <MetaRow
                  label="답변일시"
                  value={
                    <span className="tabular-nums">
                      {formatDateTimeShort(detail.answeredAt)}
                    </span>
                  }
                />
              )}
              {detail.answerModifiedAt && (
                <MetaRow
                  label="답변 수정"
                  value={
                    <span className="tabular-nums">
                      {formatDateTimeShort(detail.answerModifiedAt)}
                    </span>
                  }
                />
              )}
              {/* 서버가 계산한 문구를 그대로 쓴다 — 프론트에서 다시 재지 않는다 */}
              {detail.answerElapsedText && (
                <MetaRow label="답변 소요" value={detail.answerElapsedText} />
              )}
              {deleteRequest && (
                <MetaRow
                  label="삭제 요청"
                  value={
                    <span className="tabular-nums">
                      {formatDateTimeShort(deleteRequest.requestedAt)}
                    </span>
                  }
                />
              )}
            </div>

            {isDeleted ? (
              <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
                운영자가 삭제를 집행해 소비자 화면에서 내려갔습니다. 되돌리는
                경로는 제공하지 않습니다.
              </p>
            ) : (
              <>
                {detail.canRequestDelete && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setIsDeleteOpen(true)}
                      className="inline-flex h-9 w-full items-center justify-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
                    >
                      {deleteRequest?.rejected ? "삭제 다시 요청" : "삭제 요청"}
                    </button>
                  </div>
                )}
                <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
                  {deleteRequest?.underReview
                    ? "삭제 요청을 검토하는 중입니다. 요청을 취소할 수는 없고, 결과가 나오면 이 화면에 표시됩니다."
                    : "문의 삭제는 운영자가 집행합니다. 브랜드는 사유를 붙여 요청까지 할 수 있습니다."}
                </p>
              </>
            )}
          </DetailCard>

          <DetailCard title="처리 이력" flushBody>
            <HistoryList items={historyItems} />
          </DetailCard>
        </div>
      </div>

      <DeleteRequestModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        isSubmitting={isRequesting}
        isRerequest={!!deleteRequest?.rejected}
        onSubmit={handleRequestDelete}
      />
    </>
  )
}
