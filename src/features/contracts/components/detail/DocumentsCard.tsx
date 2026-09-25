import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { contractService } from "@/features/contracts/services/contractService"
import type {
  ContractDocument,
  ContractDocumentType,
} from "@/features/contracts/types"
import { formatFileSize } from "@/features/contracts/utils/format"
import { useQuery } from "@tanstack/react-query"
import { CONTRACT_QUERY_KEYS } from "@/features/contracts/constants/queryKeys"

interface DocumentsCardProps {
  contractId: number
  contractNumber: string | null
  documents: Array<ContractDocument>
}

const CONCLUDED_DOCS: Array<{
  type: ContractDocumentType
  name: string
  describe: (contractNumber: string | null) => string
}> = [
  {
    type: "SIGNED_PDF",
    name: "서명 완료 계약서",
    describe: contractNumber =>
      `${contractNumber ?? "계약번호 미부여"} · 양측 서명 완료`,
  },
  {
    type: "AUDIT_TRAIL",
    name: "감사추적인증서",
    describe: () => "서명자 신원·시각·IP 기록",
  },
]

/**
 * 「체결 문서」 카드(B5·B5a·B5b) — 서명 완료 계약서 · 감사추적인증서.
 * 어드민이 모두싸인에서 내려받아 업로드한 파일이라 자동 수신이 없고, 아직 없으면
 * 플랫폼 오류가 아니라 수동 절차의 대기 구간이다.
 */
export default function DocumentsCard(props: DocumentsCardProps) {
  const { contractId, contractNumber, documents } = props
  const hasAny = documents.some(
    doc => doc.type === "SIGNED_PDF" || doc.type === "AUDIT_TRAIL"
  )

  return (
    <DetailCard
      title="체결 문서"
      note="어드민이 모두싸인에서 내려받아 업로드 · 다운로드 전용"
    >
      {CONCLUDED_DOCS.map(spec => (
        <DocumentRow
          key={spec.type}
          contractId={contractId}
          type={spec.type}
          name={spec.name}
          description={spec.describe(contractNumber)}
          document={documents.find(doc => doc.type === spec.type)}
        />
      ))}
      <Notice tone="neutral" className="mt-3">
        두 문서는{" "}
        <b className="font-semibold">어드민이 모두싸인에서 내려받아 업로드</b>한
        파일입니다(자동 수신 없음).{" "}
        <b className="font-semibold">
          분쟁 시 계약 내용과 서명 사실을 증명하는 원본
        </b>
        이므로 브랜드가 별도로 보관해 주세요.{" "}
        {hasAny
          ? "파일이 보이지 않으면 어드민에 업로드를 요청하세요."
          : "아직 업로드 전이면 어드민에 업로드를 요청하세요."}
      </Notice>
    </DetailCard>
  )
}

function DocumentRow(props: {
  contractId: number
  type: ContractDocumentType
  name: string
  description: string
  document: ContractDocument | undefined
}) {
  const { contractId, type, name, description, document } = props

  // 업로드 일시·용량은 문서 조회에만 있다 — 파일이 등록된 경우에만 부른다
  const { data: meta } = useQuery({
    queryKey: [CONTRACT_QUERY_KEYS.DETAIL, contractId, "document", type],
    queryFn: () => contractService.getDocument(contractId, type),
    enabled: document !== undefined,
    retry: false,
    staleTime: 60_000,
  })

  return (
    <div className="flex items-center gap-3 border-t border-sz-n-100 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-sz-n-200 bg-sz-n-100 text-[9px] font-bold text-sz-n-600">
        PDF
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-sz-n-900">{name}</div>
        <div className="mt-[2px] text-[11px] tabular-nums text-sz-n-500">
          {description}
          {meta
            ? ` · ${formatDateTimeShort(meta.uploadedAt)} 업로드 · ${formatFileSize(meta.sizeBytes)}`
            : document
              ? ""
              : " · 업로드 전"}
        </div>
      </div>
      <Btn
        variant="secondary"
        disabled={!document}
        onClick={() =>
          document &&
          window.open(meta?.downloadUrl ?? document.downloadUrl, "_blank")
        }
      >
        다운로드
      </Btn>
    </div>
  )
}
