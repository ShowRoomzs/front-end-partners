import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageResponse } from "@/common/types/page"

/**
 * 연결 상태 — 백엔드 ConnectionStatus와 1:1.
 *
 * 검색·코드확인 응답에서 `null`이면 "요청 가능"이다. 재요청이 허용되는
 * REJECTED·DISCONNECTED 이력은 서버가 알아서 null로 내려주므로,
 * 프론트에서 "이 상태면 재요청 가능한가"를 다시 따질 필요가 없다.
 */
export type ConnectionStatus =
  | "REQUESTED"
  | "CONNECTED"
  | "REJECTED"
  | "DISCONNECTED"

/** 쇼룸명 검색 결과 한 건 (시안 B1·B4의 `.res-item`) */
export interface ConnectionCreatorSearchItem {
  creatorId: number
  showroomName: string
  followerCount: number | null
  profileImageUrl: string | null
  /** null이면 [요청] 버튼, 아니면 상태 배지를 그린다(§13-6 중복 요청 차단) */
  connectionStatus: ConnectionStatus | null
}

/** 연결코드 확인 결과 (시안 B5·B6) */
export interface ConnectionCodeCheckResponse {
  found: boolean
  creatorId: number | null
  showroomName: string | null
  followerCount: number | null
  profileImageUrl: string | null
  connectionStatus: ConnectionStatus | null
}

/** `creatorId`와 `connectionCode` 중 **정확히 하나만** 채워 보낸다(둘 다면 400) */
export interface ConnectRequest {
  creatorId?: number
  connectionCode?: string
}

export interface ConnectResponse {
  connectionId: number
  status: ConnectionStatus
}

export const connectionService = {
  searchCreators: async (params: BaseParams & { keyword: string }) => {
    const { data } = await apiInstance.get<
      PageResponse<ConnectionCreatorSearchItem>
    >("/seller/connections/creators", { params })
    return data
  },

  checkConnectionCode: async (code: string) => {
    const { data } = await apiInstance.get<ConnectionCodeCheckResponse>(
      "/seller/connections/code",
      { params: { code } }
    )
    return data
  },

  requestConnection: async (request: ConnectRequest) => {
    const { data } = await apiInstance.post<ConnectResponse>(
      "/seller/connections",
      request
    )
    return data
  },
}
