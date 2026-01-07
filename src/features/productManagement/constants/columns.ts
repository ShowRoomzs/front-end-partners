import type { Columns } from "@/common/components/Table/types"

export const PRODUCT_LIST_COLUMNS: Columns<unknown> = [
  {
    key: "id",
    label: "ID",
    width: 100,
    align: "center",
  },
  {
    key: "name",
    label: "NAME",
    width: 100,
    align: "center",
    fixed: "left",
  },
  {
    key: "price",
    label: "PRICE",
    width: 100,
    align: "center",
  },
  {
    key: "stock",
    label: "ID",
    width: 100,
    align: "center",
    fixed: "left",
  },
  {
    key: "display",
    label: "DISPLAY",
    width: 100,
    align: "center",
  },
]
