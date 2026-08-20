import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import type { Columns } from "@/common/components/Table/types"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { ProductInquiryListItem } from "@/features/productInquiry/types"
import { getInquiryStatusVariant } from "@/features/productInquiry/utils/statusBadge"

/**
 * 시안 컬럼 7종 — 상태가 **맨 뒷열**이고 관리 열은 없다(행 전체 클릭으로 상세 진입).
 *
 * 어드민 목록과 달리 브랜드 열이 없고 공개여부 열이 있다. 자기 마켓 문의만 보므로
 * 브랜드는 늘 같은 값이고, 대신 비밀글 여부가 답변 문구를 고르는 데 영향을 준다.
 *
 * 등록일·답변일은 **날짜 + 시:분**까지 적는다. 답변 지연을 분 단위로 관리하는
 * 화면이라 날짜만으로는 같은 날 들어온 건들의 선후가 안 보인다.
 */
export const PRODUCT_INQUIRY_COLUMNS: Columns<ProductInquiryListItem> = [
  {
    key: "typeName",
    label: "문의 유형",
    width: 100,
    // 유형은 상태값이 아니라 분류다 — 중립·점 없음으로 상태 배지와 구분한다
    render: value => (
      <StatusBadge variant="neutral" hideDot>
        {value as string}
      </StatusBadge>
    ),
  },
  {
    key: "content",
    label: "질문",
    width: 300,
    render: value => (
      <span className="block truncate text-[13px] font-medium text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "productName",
    label: "상품",
    width: 200,
    render: value => (
      <span className="block truncate text-[12px] text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "visibilityName",
    label: "공개여부",
    width: 90,
    align: "center",
    // 비밀글일 때만 배지를 씌운다 — 공개가 기본값이라 전 행에 배지를 두면 소음이 된다
    render: (value, record) =>
      record.secret ? (
        <StatusBadge variant="neutral" hideDot>
          {value as string}
        </StatusBadge>
      ) : (
        <span className="text-[12px] text-sz-n-500">{value as string}</span>
      ),
  },
  {
    key: "createdAt",
    label: "등록일",
    width: 130,
    align: "center",
    render: value => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string)}
      </span>
    ),
  },
  {
    key: "answeredAt",
    label: "답변일",
    width: 130,
    align: "center",
    // 미답변이면 `—` (formatDateTimeShort가 null을 그렇게 처리한다)
    render: value => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string | null)}
      </span>
    ),
  },
  {
    key: "statusLabel",
    label: "상태",
    width: 110,
    align: "center",
    render: (value, record) => (
      <StatusBadge
        variant={getInquiryStatusVariant(record.status, record.exposureStatus)}
      >
        {value as string}
      </StatusBadge>
    ),
  },
]
