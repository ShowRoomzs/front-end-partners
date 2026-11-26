import { authInstance } from "@/common/lib/authInstance"

/** 약관 문서 유형 — 서버 `TermsType` */
export type TermsType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "MARKETING_CONSENT"
  | "OPERATION_POLICY"

/** 약관 문서 대상 — 서버 `TermsTarget` */
export type TermsTarget = "ALL" | "USER" | "BRAND" | "INFLUENCER"

/** 시행 중 문서 목록 행 — 서버 `TermsDocumentResponse`(본문은 상세에서 받는다) */
export interface TermsDocument {
  documentId: number
  name: string
  type: TermsType
  typeName: string
  target: TermsTarget
  targetName: string
  /** 화면 표기 버전(예: v3.1) */
  version: string
  /** 시행일 — LocalDate(KST 날짜) `YYYY-MM-DD` */
  effectiveDate: string
}

/** 시행 중 문서 원문 — 서버 `TermsDocumentDetailResponse` */
export interface TermsDocumentDetail extends TermsDocument {
  /** 평문 원문 */
  content: string
}

/**
 * 약관 · 정책 문서(`/v1/common/terms` · 인증 불요) — 시행 중(EFFECTIVE) 버전만 내려온다.
 * 어드민이 등록한 문서는 「시행 예정」으로 시작해 시행일 00:00에 시행 중이 되므로 그 전까지 목록은 비어 있다.
 */
export const termsService = {
  /** target을 주면 그 대상 + 전체(ALL) 문서를 함께 준다 · 정렬은 종류 → 문서 id */
  getTerms: async (target: TermsTarget) => {
    const { data } = await authInstance.get<TermsDocument[]>("/common/terms", {
      params: { target },
      suppressErrorToast: true,
    })
    return data
  },
  /** 시행 중이 아닌 문서는 404 */
  getTermsDetail: async (documentId: number) => {
    const { data } = await authInstance.get<TermsDocumentDetail>(
      `/common/terms/${documentId}`,
      { suppressErrorToast: true }
    )
    return data
  },
}

/**
 * 종류별로 보여 줄 문서 하나 — 대상 전용 문서가 전체(ALL) 문서보다 먼저다(소비자 앱과 같은 규칙).
 * 같은 순위면 서버 정렬(문서 id 순) 첫 번째.
 */
export function pickTermsByType(
  documents: TermsDocument[],
  target: TermsTarget
): Partial<Record<TermsType, TermsDocument>> {
  const picked: Partial<Record<TermsType, TermsDocument>> = {}
  for (const document of documents) {
    const current = picked[document.type]
    if (!current || (current.target !== target && document.target === target)) {
      picked[document.type] = document
    }
  }
  return picked
}

/** 시행일 `2026-11-27` → `2026.11.27`(날짜만 오는 값이라 시간대 변환을 하지 않는다) */
export function formatTermsDate(date: string) {
  return date.replaceAll("-", ".")
}
