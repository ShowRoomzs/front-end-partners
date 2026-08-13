import { BASIC_INFO_QUERY_KEYS } from "@/features/storeManagement/constants/queryKeys"
import { basicInfoService } from "@/features/storeManagement/services/basicInfoService"
import { useQuery } from "@tanstack/react-query"

export function useGetManagerInfo() {
  return useQuery({
    queryKey: [BASIC_INFO_QUERY_KEYS.MANAGER],
    queryFn: basicInfoService.getManagerInfo,
  })
}
