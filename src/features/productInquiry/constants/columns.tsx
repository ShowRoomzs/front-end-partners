import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import type { Columns } from "@/common/components/Table/types"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { ProductInquiryListItem } from "@/features/productInquiry/types"
import { getInquiryStatusVariant } from "@/features/productInquiry/utils/statusBadge"

/**
 * 시안 컬럼 7종 — 폭도 시안 그대로다(112 / 나머지 / 128 / 120 / 162 / 150 / 150).
 * 상태가 **맨 뒷열**이고 관리 열은 없다(행 전체 클릭으로 상세 진입).
 *
 * 어드민 목록과 달리 브랜드 열이 없고 공개여부 열이 있다. 자기 마켓 문의만 보므로
 * 브랜드는 늘 같은 값이고, 대신 비밀글 여부가 답변 문구를 고르는 데 영향을 준다.
 *
 * 등록일·답변일은 **날짜 + 시:분**까지 적는다. SLA가 확정되지 않아 잔여 시간 표기를
 * 두지 않는 대신, 실제 소요를 직접 읽게 하는 것이 시안의 선택이다.
 */
export const PRODUCT_INQUIRY_COLUMNS: Columns<ProductInquiryListItem> = [
  {
    key: "typeName",
    label: "문의 유형",
    width: 112,
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
    width: 330,
    // 시안 `tbody tr:hover .t-q{color:accent-600}` — 행 위에서 눌러야 할 곳을 가리킨다
    render: value => (
      <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
        {value as string}
      </span>
    ),
  },
  {
    key: "productName",
    label: "상품",
    width: 128,
    render: value => (
      <span className="block truncate text-sz-n-700">{value as string}</span>
    ),
  },
  {
    key: "visibilityName",
    label: "공개여부",
    width: 120,
    align: "center",
    // 공개·비밀글 모두 배지다 — 공개여부는 분류 축이라 한쪽만 배지를 씌우면 축이 깨진다
    render: value => (
      <StatusBadge variant="neutral" hideDot>
        {value as string}
      </StatusBadge>
    ),
  },
  {
    key: "createdAt",
    label: "등록일",
    width: 162,
    align: "center",
    render: value => (
      <span className="whitespace-nowrap tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string)}
      </span>
    ),
  },
  {
    key: "answeredAt",
    label: "답변일",
    width: 150,
    align: "center",
    // 미답변이면 `—` (formatDateTimeShort가 null을 그렇게 처리한다)
    render: value => (
      <span className="whitespace-nowrap tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string | null)}
      </span>
    ),
  },
  {
    key: "statusLabel",
    label: "상태",
    width: 150,
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
