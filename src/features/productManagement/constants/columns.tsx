import type { Columns } from "@/common/components/Table/types"
import { formatDateOnly } from "@/common/utils/formatDate"
import {
  DisplayStatusBadge,
  GroupBuyStatusBadge,
  SoldOutBadge,
} from "@/features/productManagement/components/StatusBadge/StatusBadge"
import type { ProductItem } from "@/features/productManagement/services/productService"

/** 등록/수정일 1열 통합 — 최신 날짜 + "(등록)"/"(수정)" 표기(§11-1) */
function renderTimestamp(record: ProductItem) {
  const isModified =
    !!record.modifiedAt && record.modifiedAt !== record.createdAt
  const date = isModified ? record.modifiedAt : record.createdAt

  return (
    <span className="whitespace-nowrap text-[12px] text-sz-n-500">
      {formatDateOnly(date)} {isModified ? "(수정)" : "(등록)"}
    </span>
  )
}

export const PRODUCT_LIST_COLUMNS: Columns<ProductItem> = [
  {
    key: "thumbnailUrl",
    label: "",
    width: 56,
    render: value => {
      const url = value as string | null
      return (
        <div className="h-9 w-9 overflow-hidden rounded-[6px] bg-sz-n-200">
          {url && (
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )
    },
  },
  {
    key: "name",
    label: "상품명",
    width: 160,
    render: value => (
      <span
        className="block max-w-[150px] truncate text-[13px] font-medium text-sz-n-900"
        title={value as string}
      >
        {value as string}
      </span>
    ),
  },
  {
    key: "sellerProductCode",
    label: "브랜드상품코드",
    width: 110,
    render: value => (value as string | null) || "—",
  },
  {
    key: "regularPrice",
    label: "정가",
    width: 90,
    render: value => `${(value as number).toLocaleString()}원`,
  },
  {
    key: "stock",
    label: "재고",
    align: "center",
    width: 80,
    // 재고 0이면 숫자 없이 품절 배지만 — 별도 필터 카테고리가 아니라 재고 열의 부가 표시다
    render: value => {
      const stock = value as number | null | undefined
      // == 로 null·undefined를 함께 걸러야 한다 — 조합이 없는 상품은 서버가 값을 안 준다
      if (stock == null) {
        return "—"
      }
      return stock === 0 ? <SoldOutBadge /> : stock.toLocaleString()
    },
  },
  {
    key: "displayStatus",
    label: "진열 상태",
    align: "center",
    width: 100,
    render: (_value, record) => (
      <DisplayStatusBadge status={record.displayStatus} />
    ),
  },
  {
    key: "groupBuyStatus",
    label: "공구 상태",
    align: "center",
    width: 90,
    render: (_value, record) => (
      <GroupBuyStatusBadge status={record.groupBuyStatus} />
    ),
  },
  {
    key: "createdAt",
    label: "등록/수정일",
    align: "center",
    width: 150,
    render: (_value, record) => renderTimestamp(record),
  },
]
