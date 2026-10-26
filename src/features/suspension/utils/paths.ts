import type { MemberAccountSanction } from "@/features/suspension/types"

/**
 * [운영팀에 소명하기] 목적지 — 소명은 1:1 문의가 아니라 운영팀 채널의 정지 카드 아래 답글이다(15 rule 10.10 정정).
 * 서버가 채널 스레드 id를 주면 그 스레드로, 없으면 운영팀 채널로 연다.
 */
export function appealPath(sanction?: MemberAccountSanction | null): string {
  const threadId = sanction?.operatorChannelThreadId
  return threadId
    ? `/connections?threadId=${threadId}`
    : "/connections?operator=1"
}

/** 지급 정지 사유일 때 [정산 정보 수정하기] — 기본정보 관리 › 정산 계좌 탭 */
export const SETTLEMENT_ACCOUNT_PATH = "/store/basic?tab=settlement"
