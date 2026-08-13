import { CHANGE_REQUEST_QUERY_KEYS } from "@/features/storeManagement/constants/queryKeys"
import {
  changeRequestService,
  type ChangeRequestType,
} from "@/features/storeManagement/services/changeRequestService"
import { useQuery } from "@tanstack/react-query"

/**
 * M1(사업자 정보 변경 요청) 모달 전용 — 체크박스 6종과 각 항목의 현재값을 서버에서 받는다.
 * 모달이 열렸을 때만 호출한다(`enabled`) — 평소엔 필요 없는 조회다.
 */
export function useChangeRequestFields(
  type: ChangeRequestType,
  enabled: boolean
) {
  return useQuery({
    queryKey: [CHANGE_REQUEST_QUERY_KEYS.FIELDS, type],
    queryFn: () => changeRequestService.getFields(type),
    enabled,
  })
}
