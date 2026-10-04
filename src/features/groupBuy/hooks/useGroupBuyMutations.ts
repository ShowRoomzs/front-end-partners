import { GROUP_BUY_QUERY_KEYS } from "@/features/groupBuy/constants/params"
import {
  groupBuyService,
  putAppealFile,
} from "@/features/groupBuy/services/groupBuyService"
import type {
  EarlyCloseRequestBody,
  ExtensionRequestBody,
  FulfillmentCheckBody,
  GroupBuyDetailResponse,
  IssueOpenBody,
  SuspensionRequestBody,
} from "@/features/groupBuy/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/**
 * 공구 쓰기 — 낙관적 업데이트를 쓰지 않는다. 실행 API가 갱신된 상세를 돌려주므로
 * 그 값으로 상세 캐시를 바꾸고, 목록·요약(탭 카운트·GNB 배지)은 다시 읽는다.
 *
 * 실행 응답의 `navigation`은 목록 맥락이 없어 항상 비어 있다 — 캐시에 있던 이웃 ID를 지키지
 * 않으면 처리 직후 [‹ 이전] [다음 ›]가 사라진다. 상세 키에 목록 조건이 섞여 있어 접두사로 고른다.
 */
function useApplyDetail() {
  const queryClient = useQueryClient()

  return (detail: GroupBuyDetailResponse) => {
    queryClient.setQueriesData<GroupBuyDetailResponse>(
      { queryKey: [GROUP_BUY_QUERY_KEYS.DETAIL, detail.groupBuy.groupBuyId] },
      previous =>
        previous ? { ...detail, navigation: previous.navigation } : detail
    )
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.SUMMARY] })
  }
}

function useInvalidateGroupBuy() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.DETAIL] })
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.SUMMARY] })
  }
}

export function useConfirmStock() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (groupBuyId: number) =>
      groupBuyService.confirmStock(groupBuyId),
    onSuccess: apply,
  })
}

export function useRequestExtension() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (variables: {
      groupBuyId: number
      body: ExtensionRequestBody
    }) =>
      groupBuyService.requestExtension(variables.groupBuyId, variables.body),
    onSuccess: apply,
  })
}

export function useRequestEarlyClose() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (variables: {
      groupBuyId: number
      body: EarlyCloseRequestBody
    }) =>
      groupBuyService.requestEarlyClose(variables.groupBuyId, variables.body),
    onSuccess: apply,
  })
}

export function useRequestSuspension() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (variables: {
      groupBuyId: number
      body: SuspensionRequestBody
    }) =>
      groupBuyService.requestSuspension(variables.groupBuyId, variables.body),
    onSuccess: apply,
  })
}

/**
 * 소명 제출 — 첨부가 있으면 파일마다 업로드 URL 발급 → S3 PUT을 끝낸 뒤 그 id를 싣는다.
 * 한 파일이라도 실패하면 제출하지 않는다(제출 후 수정할 수 없어 누락된 채 굳으면 안 된다).
 */
export function useSubmitAppeal() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: async (variables: {
      groupBuyId: number
      content: string
      files: Array<File>
    }) => {
      const attachmentIds: Array<number> = []
      for (const file of variables.files) {
        const presign = await groupBuyService.presignAppealAttachment(
          variables.groupBuyId,
          {
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          }
        )
        await putAppealFile(presign.uploadUrl, presign.contentType, file)
        attachmentIds.push(presign.attachmentId)
      }
      return groupBuyService.submitAppeal(variables.groupBuyId, {
        content: variables.content,
        attachmentIds,
      })
    },
    onSuccess: apply,
  })
}

/** 이슈 스레드 개설 — 응답이 상세가 아니라 스레드 id라 상세를 다시 읽는다 */
export function useOpenIssue() {
  const invalidate = useInvalidateGroupBuy()

  return useMutation({
    mutationFn: (variables: { groupBuyId: number; body: IssueOpenBody }) =>
      groupBuyService.openIssue(variables.groupBuyId, variables.body),
    onSuccess: invalidate,
  })
}

export function useCheckFulfillment() {
  const apply = useApplyDetail()

  return useMutation({
    mutationFn: (variables: {
      groupBuyId: number
      body: FulfillmentCheckBody
    }) =>
      groupBuyService.checkFulfillment(variables.groupBuyId, variables.body),
    onSuccess: apply,
  })
}
