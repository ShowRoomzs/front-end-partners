import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageResponse } from "@/common/types/page"
import type { ConnectionStatus } from "@/features/connections/services/connectionService"

/** 발신자 구분 — 백엔드 ParticipantType과 1:1 */
export type ParticipantType = "SELLER" | "CREATOR" | "ADMIN"

/** 첨부 종류 — 압축 파일은 서버가 DOCUMENT로 분류해 내려준다 */
export type AttachmentType = "IMAGE" | "VIDEO" | "DOCUMENT"

/**
 * 첨부 업로드 상태.
 *
 * 메시지 조회 응답에는 사실상 `UPLOADED`만 온다 — 전송된 메시지에 붙은 첨부는
 * 이미 검증을 통과한 것들이다. `REJECTED`는 서버가 HeadObject 검증에서
 * 위조를 잡아낸 경우이고, `PENDING`은 전송 전 단계라 화면엔 거의 안 나온다.
 */
export type AttachmentStatus = "PENDING" | "UPLOADED" | "REJECTED"

export interface AttachmentSummary {
  attachmentId: number
  status: AttachmentStatus
  attachmentType: AttachmentType
  fileUrl: string | null
  originalName: string
  extension: string
  sizeBytes: number
  /** 영상 재생시간 — 표시용 참고값이라 없을 수 있다(브라우저가 못 읽는 코덱 등) */
  durationSeconds: number | null
  sortOrder: number | null
}

export interface ThreadListItem {
  threadId: number
  counterpartName: string
  counterpartImageUrl: string | null
  /** 운영자 고정 채널 — 서버가 이미 최상단으로 정렬해 내려준다(§13-3) */
  operatorChannel: boolean
  /** [계약 작성] 버튼 게이트(§13-5) */
  connectionStatus: ConnectionStatus
  lastMessagePreview: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface ThreadSummaryResponse {
  unreadCount: number
}

export interface MessageItem {
  messageId: number
  senderType: ParticipantType
  mine: boolean
  /** 첨부만 보낸 메시지는 null이다(§13-11) */
  content: string | null
  attachments: Array<AttachmentSummary>
  createdAt: string
}

export interface MessageListResponse {
  /** 최신순 */
  content: Array<MessageItem>
  nextCursor: number | null
  hasNext: boolean
}

export interface SendMessageRequest {
  /** 멱등키 — 재전송 시 **같은 값**을 다시 보내야 중복 저장되지 않는다(§13-10) */
  clientMessageId: string
  content?: string
  /** 배열 순서가 곧 표시 순서 */
  attachmentIds?: Array<number>
}

export interface PresignRequest {
  fileName: string
  contentType: string
  sizeBytes: number
}

export interface PresignResponse {
  attachmentId: number
  uploadUrl: string
  /** PUT 요청의 Content-Type이 이 값과 다르면 S3가 서명 불일치로 거부한다 */
  requiredContentType: string
  expiresInSeconds: number
}

export const threadService = {
  getThreads: async (params: BaseParams & { keyword?: string }) => {
    const { data } = await apiInstance.get<PageResponse<ThreadListItem>>(
      "/seller/connections/threads",
      { params }
    )
    return data
  },

  getSummary: async () => {
    const { data } = await apiInstance.get<ThreadSummaryResponse>(
      "/seller/connections/summary"
    )
    return data
  },

  getMessages: async (
    threadId: number,
    params: { cursor?: number; size?: number }
  ) => {
    const { data } = await apiInstance.get<MessageListResponse>(
      `/seller/threads/${threadId}/messages`,
      { params }
    )
    return data
  },

  sendMessage: async (threadId: number, request: SendMessageRequest) => {
    const { data } = await apiInstance.post<MessageItem>(
      `/seller/threads/${threadId}/messages`,
      request
    )
    return data
  },

  markRead: async (threadId: number) => {
    await apiInstance.post(`/seller/threads/${threadId}/read`)
  },

  createPresignedUpload: async (threadId: number, request: PresignRequest) => {
    const { data } = await apiInstance.post<PresignResponse>(
      `/seller/threads/${threadId}/attachments/presign`,
      request
    )
    return data
  },

  completeUpload: async (
    attachmentId: number,
    request: { durationSeconds?: number }
  ) => {
    const { data } = await apiInstance.patch<AttachmentSummary>(
      `/seller/attachments/${attachmentId}/complete`,
      request
    )
    return data
  },
}
