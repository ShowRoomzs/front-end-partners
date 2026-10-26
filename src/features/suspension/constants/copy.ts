/*
  계정 이용 정지 문구 — 시안 ui-partner-15-suspension rev.3 · ui-partner-16-home rev.3 H4.
  기-01 · 기-02 · 기-03이 모두 【잠정】이라 변호사 확인 뒤 바뀔 수 있다 — 문구는 여기 한 곳에서만 고친다.
*/

/** 기-01 【잠정】 명칭 */
export const SUSPENSION_NAME = "계정 이용 정지"

export const SUSPENSION_COPY = {
  bannerTitle: "계정 이용이 정지되었습니다",
  bannerDescription:
    "진행 중인 주문과 공구는 계속 처리해 주세요. 새 상품 · 계약 · 공구 등록은 정지 해제 후 가능합니다.",
  /** 기-02 【잠정】 — 통지 후 영업일 수는 결정 노트 값 그대로(서버는 기한 날짜만 내린다) */
  appealDeadlineRule: "통지 후 3영업일 이상",
  /** 기-03 【잠정】 정지 중 탈퇴 허용 — 조건은 기본정보 관리 4-G2와 같다 */
  withdrawalAllowedPrefix: "정지 중에도 ",
  withdrawalAllowedStrong: "탈퇴 신청",
  withdrawalAllowedSuffix: "은 할 수 있습니다(조건은 같습니다)",
  /** 지급 정지 사유(정산 정보 불일치 · 사업자 정보 허위 기재)일 때만 */
  payoutHeld:
    "정산은 확정까지 진행되며, 정지가 풀리면 다음 영업일에 지급됩니다.",
  payoutHeldLink: "정산 정보 수정하기",
  detailLabel: "상세 사유",
  expand: "자세히",
  collapse: "접기",
  appealButton: "운영팀에 소명하기",
  /** 탑바 브랜드명 옆 칩 */
  chip: "정지",
  /** 진입 버튼은 숨기지 않고 비활성 + 이 툴팁 */
  blockedTooltip: "계정 이용 정지 중에는 이용할 수 없습니다",
  /** 기간 없는 정지(종료일 null) — 시안에 없는 경우라 새로 썼다 */
  untilReleased: "해제 시까지",
} as const

/** URL 직접 진입 빈 상태 — `계정 이용 정지 중에는 {기능}을 이용할 수 없습니다` */
export const SUSPENDED_EMPTY_TITLE = (featureWithParticle: string) =>
  `계정 이용 정지 중에는 ${featureWithParticle} 이용할 수 없습니다`
