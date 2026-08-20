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
import Notice from "@/features/productInquiry/components/Notice/Notice"
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
 * 이력 점 색 — 라벨은 서버가 내려주므로 여기서는 톤만 정한다(시안 `.hdot`).
 *
 * 소비자가 남긴 사건은 무채색, 브랜드 답변은 성공색, 삭제 요청은 정보색, 운영자의
 * 반려는 경고, 삭제 집행만 위험색이다. 서버가 새 이벤트 코드를 늘려도 화면이 죽지
 * 않게 기본값을 둔다.
 */
const HISTORY_TONE: Record<string, HistoryItem["tone"]> = {
  REGISTERED: "muted",
  ANSWERED: "success",
  ANSWER_MODIFIED: "success",
  DELETE_REQUESTED: "accent",
  DELETE_REJECTED: "warn",
  DELETE_EXECUTED: "danger",
}

/**
 * B1~B8 — 상품 문의 상세(파트너센터).
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
  const isUnderReview = !!deleteRequest?.underReview
  const isRejected = !!deleteRequest?.rejected
  const variant = getInquiryStatusVariant(detail.status, detail.exposureStatus)
  const brandName = market?.marketName ?? "브랜드"

  /*
    이력 한 줄에 사유까지 붙여 읽는다 — "문의 삭제 요청 · 타 브랜드 비교·비방"처럼
    무엇을 했는지와 왜 했는지가 떨어져 있으면 이력을 두 번 읽어야 한다.
  */
  const historyItems: Array<HistoryItem> = detail.history.map(item => ({
    label: item.detail ? `${item.label} · ${item.detail}` : item.label,
    tone: HISTORY_TONE[item.event] ?? "muted",
    processedAt: item.occurredAt,
    processorName: item.actorLabel,
  }))

  /*
    답변 시각은 등록과 수정을 **병기**한다(§23-4). 수정 시각으로 갈아치우면 소비자
    화면에 처음 답이 붙은 시점이 사라져 응답 속도 근거가 없어진다.
  */
  const answeredAtText = formatDateTimeShort(detail.answeredAt)
  const answerMeta = detail.answerModifiedAt
    ? `${answeredAtText} 등록 · ${formatDateTimeShort(detail.answerModifiedAt)} 수정됨`
    : answeredAtText

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h1 className="text-[20px] font-semibold text-sz-n-900">
          상품 문의 상세
        </h1>

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
                className="text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
              >
                상품 상세 보기
              </button>
            </FieldRow>
            {/*
              작성자는 마스킹된 닉네임뿐이다. 실명·연락처도, 회원 상세 링크도 없다 —
              브랜드에게 소비자 신원을 열어 줄 근거가 없다(§23-3). 왜 마스킹인지를
              한 줄로 붙여 "값이 잘려 온 것"으로 오해하지 않게 한다.
            */}
            <FieldRow label="작성자">
              {detail.writerName}
              <div className="mt-0.5 text-[11px] text-sz-n-500">
                소비자 닉네임 마스킹 · 브랜드는 실명·연락처를 볼 수 없습니다
              </div>
            </FieldRow>
            <FieldRow label="공개 여부">
              {/* 공개여부는 상태가 아니라 분류라 점 없는 배지를 쓴다 */}
              <StatusBadge variant="neutral" hideDot>
                {detail.visibilityName}
              </StatusBadge>
              {/*
                브랜드가 바꿀 수 없는 값(권한 ③)이라는 것과, 삭제로 노출이 끊긴 것은
                서로 다른 사실이다. 배지 값을 덮지 않고 옆에 덧붙인다.
              */}
              {isDeleted ? (
                <span className="ml-1.5 text-[11px] text-sz-n-500">
                  삭제되어 비노출
                </span>
              ) : (
                detail.secret && (
                  <span className="ml-1.5 text-[11px] text-sz-n-500">
                    작성자 지정 · 변경 불가
                  </span>
                )
              )}
            </FieldRow>
            <FieldRow label="등록일시">
              <span className="tabular-nums">
                {formatDateTimeShort(detail.createdAt)}
              </span>
            </FieldRow>
          </DetailCard>

          {/*
            반려 결과는 문의 정보 **바로 아래**에 온다(B7). 브랜드가 이 화면에 들어온
            이유가 그 결과이므로 원문보다 먼저 읽혀야 한다. 검토 중·삭제된 건의
            삭제 요청 카드는 반대로 맨 아래에 둔다 — 그때는 경위가 참고 자료다.
          */}
          {isRejected && deleteRequest && (
            <DetailCard
              title="삭제 요청 결과"
              note={
                deleteRequest.reviewedAt
                  ? `운영자 · ${formatDateTimeShort(deleteRequest.reviewedAt)} 처리`
                  : "운영자 처리"
              }
            >
              <Notice tone="warn" className="mb-3">
                <b className="font-semibold">삭제 요청이 반려되었습니다.</b>{" "}
                문의는 그대로 게시되며 상태는{" "}
                <b className="font-semibold">
                  요청 직전 상태({detail.statusLabel})
                </b>
                로 돌아갑니다.
              </Notice>
              <FieldRow label="내 요청 사유">
                {deleteRequest.reasonName}
                <div className="mt-0.5 text-[11px] text-sz-n-500">
                  {formatDateTimeShort(deleteRequest.requestedAt)} 요청
                </div>
              </FieldRow>
              {deleteRequest.rejectReason && (
                <FieldRow label="운영자 반려 사유">
                  {deleteRequest.rejectReason}
                </FieldRow>
              )}
            </DetailCard>
          )}

          <DetailCard
            title="문의 내용"
            note={
              isDeleted
                ? "삭제 전 원문 보관"
                : "소비자 입력 · 250자 이내 · 사진 최대 3장"
            }
          >
            {/*
              삭제된 건에서 가장 먼저 읽혀야 하는 정보다. 답변까지 함께 내려간다는
              점을 모르면 "답변은 남아 있겠지"라고 오해한 채 화면을 닫는다.
            */}
            {isDeleted && (
              <Notice tone="danger" className="mb-3">
                <b className="font-semibold">운영자가 삭제한 문의입니다.</b>{" "}
                질문과 <b className="font-semibold">브랜드 답변이 함께</b>{" "}
                소비자 화면에서 내려갑니다 — 질문 없는 답변은 성립하지 않기
                때문입니다. 원문·답변 모두 분쟁 대비로 보관되며 이 화면에서만
                조회할 수 있습니다.
              </Notice>
            )}

            <ThreadMessage
              authorName={detail.writerName}
              roleLabel="소비자"
              sentAt={detail.createdAt}
              content={detail.content}
              imageUrls={detail.imageUrls}
            />
          </DetailCard>

          <DetailCard
            title="브랜드 답변"
            note={
              detail.answerContent
                ? brandName
                : detail.canRegisterAnswer
                  ? `${brandName} · 답변 작성`
                  : undefined
            }
          >
            {detail.answerContent && !isEditingAnswer && (
              <>
                <ThreadMessage
                  // 답변 작성자명을 서버가 내려주지 않는다 — 마켓 하나에 답변도
                  // 하나뿐이라 지금 로그인한 마켓 이름이 곧 작성자다
                  authorName={brandName}
                  roleLabel="브랜드"
                  meta={answerMeta}
                  sentAt={detail.answeredAt ?? detail.createdAt}
                  content={detail.answerContent}
                  emphasized
                />
                {detail.canModifyAnswer && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingAnswer(true)}
                      className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
                    >
                      답변 수정
                    </button>
                  </div>
                )}
              </>
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
                /*
                  비밀글에는 공개 전환 예고를 띄우지 않는다(B5) — 답변해도 공개로
                  바뀌지 않으므로 그 문구가 거짓이 된다.
                */
                writerName={detail.secret ? undefined : detail.writerName}
                onCancel={() => undefined}
                onSubmit={handleRegister}
              />
            )}

            {/*
              답변도 없고 쓸 수도 없는 상태(삭제 요청 검토 중·삭제됨). 카드를 감추지
              않는 건 의도된 것이다 — 답하지 못한 채로 끝났다는 사실 자체가 기록이다.
            */}
            {!detail.answerContent && !detail.canRegisterAnswer && (
              <p className="text-[12px] text-sz-n-500">
                답변 없이 종료된 문의입니다. 삭제 요청이 검토 중이거나 이미
                삭제된 문의에는 답변을 등록할 수 없습니다.
              </p>
            )}
          </DetailCard>

          {/*
            검토 중·삭제된 건의 삭제 요청 경위. 집행된 뒤에도 지우지 않는다 —
            무엇을 근거로 요청했고 운영자가 어떻게 판단했는지가 한 화면에서 대조돼야
            분쟁 시 소명이 된다.
          */}
          {deleteRequest && !isRejected && (
            <DetailCard
              title="삭제 요청"
              note={`${brandName} · ${formatDateTimeShort(deleteRequest.requestedAt)} 요청`}
            >
              <FieldRow label="요청 사유">{deleteRequest.reasonName}</FieldRow>
              {deleteRequest.detail && (
                <FieldRow label="상세 설명">{deleteRequest.detail}</FieldRow>
              )}
              {isUnderReview && (
                <Notice tone="info" className="mt-3">
                  <b className="font-semibold">운영자 검토 중입니다.</b> 검토
                  결과에 따라 문의가 삭제되거나, 요청이 반려되고 문의는 그대로
                  게시됩니다(반려 시{" "}
                  <b className="font-semibold">요청 직전 상태로 복귀</b>).
                  결과는 알림으로 전달됩니다.
                </Notice>
              )}
            </DetailCard>
          )}
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="처리">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
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
              {/*
                삭제된 건에서는 답변일시 대신 삭제일시·처리자를 본다. 답변 여부는
                본문 카드에서 이미 보이고, 여기서 필요한 건 "언제 누가 내렸는가"다.
              */}
              {isDeleted ? (
                <>
                  <MetaRow
                    label="삭제일시"
                    value={
                      <span className="tabular-nums">
                        {formatDateTimeShort(deleteRequest?.deletedAt ?? null)}
                      </span>
                    }
                  />
                  {/* 삭제 집행 주체는 언제나 운영자다(브랜드는 요청까지만 한다) */}
                  <MetaRow label="처리자" value="운영자" />
                </>
              ) : (
                <>
                  {/* 미답변이어도 행을 지우지 않는다 — 값이 `—`인 것 자체가 정보다 */}
                  <MetaRow
                    label="답변일시"
                    value={
                      <span className="tabular-nums">{answeredAtText}</span>
                    }
                  />
                  {/* 서버가 계산한 문구를 그대로 쓴다 — 프론트에서 다시 재지 않는다 */}
                  {detail.answerElapsedText && (
                    <MetaRow
                      label="답변 소요"
                      value={detail.answerElapsedText}
                    />
                  )}
                  {isUnderReview && deleteRequest && (
                    <MetaRow
                      label="삭제 요청일"
                      value={
                        <span className="tabular-nums">
                          {formatDateTimeShort(deleteRequest.requestedAt)}
                        </span>
                      }
                    />
                  )}
                  {isRejected && (
                    <MetaRow
                      label="삭제 요청 결과"
                      value={<span className="text-sz-warning-text">반려</span>}
                    />
                  )}
                </>
              )}
            </div>

            {/*
              검토 중에는 버튼이 없다 — 운영자 판단이 나올 때까지 브랜드가 할 수 있는
              조작이 없고, 요청 취소도 불가하다(§23-5).
            */}
            {detail.canRequestDelete && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  className="inline-flex h-8 w-full items-center justify-center rounded-[6px] border border-[#E9C9C9] bg-white px-3.5 text-[12px] font-medium text-sz-danger-text hover:bg-sz-danger-bg"
                >
                  {isRejected ? "문의 삭제 재요청" : "문의 삭제 요청"}
                </button>
              </div>
            )}

            <p className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
              {isDeleted ? (
                "삭제 사유는 운영자 내부 기록으로 관리되며 브랜드·작성자에게 공개되지 않습니다. 되돌리려면 운영자에게 문의하세요."
              ) : isUnderReview ? (
                <>
                  삭제 요청은{" "}
                  <b className="font-semibold">취소할 수 없습니다.</b> 운영자
                  판단이 나올 때까지 이 화면에서 할 수 있는 조작은 없습니다.
                </>
              ) : isRejected ? (
                "반려된 요청은 사유를 보완해 다시 제출할 수 있습니다."
              ) : detail.answerContent ? (
                "답변을 등록한 뒤에도 부적절한 문의라면 삭제를 요청할 수 있습니다."
              ) : (
                <>
                  비방·개인정보·광고 등 부적절한 문의는{" "}
                  <b className="font-semibold">운영자에게 삭제를 요청</b>할 수
                  있습니다. 삭제 집행 여부는 운영자가 판단합니다.
                </>
              )}
            </p>
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
        onSubmit={handleRequestDelete}
      />
    </>
  )
}
