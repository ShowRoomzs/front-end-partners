import { getColumnKey } from "@/common/components/Table/config"
import type { Column, Columns } from "@/common/components/Table/types"
import useTableFixed from "@/common/hooks/useTableFixed"
import { cn } from "@/lib/utils"
import { useCallback, useRef } from "react"

interface TableBodyProps<T> {
  columns: Columns<T>
  data: Array<T>
  onRowClick?: (record: T) => void
  bodyClassName?: string
  /** 셀(`td`) 자체에 얹는 클래스 — 행 높이를 시안에 맞출 때 패딩을 덮어쓴다 */
  cellClassName?: string
  /** 행(`tr`)에 얹는 클래스 — hover 배경색처럼 화면마다 다른 값을 덮어쓴다 */
  rowClassName?: string
}

export default function TableBody<T>(props: TableBodyProps<T>) {
  const {
    columns,
    data,
    onRowClick,
    bodyClassName = "",
    cellClassName = "",
    rowClassName = "",
  } = props
  const { getColumnFixedStyle } = useTableFixed<T>(columns, false)
  const isRowClickClass = onRowClick ? "cursor-pointer" : ""
  const rowClickClassName = cn(
    "group hover:bg-sz-n-50",
    isRowClickClass,
    rowClassName
  )
  const cellRef = useRef<Record<string, HTMLTableCellElement>>({})
  const handleRowClick = useCallback(
    (record: T) => {
      onRowClick?.(record)
    },
    [onRowClick]
  )

  const handleCellClick = (
    e: React.MouseEvent<HTMLTableCellElement>,
    col: Column<T>,
    rowIndex: number
  ) => {
    if (col.delegateClick) {
      e.stopPropagation()
      const cell = cellRef.current[`${col.key.toString()}-${rowIndex}`]
      const child = cell?.children[0].children[0] as HTMLDivElement
      child?.click()
    }
    if (col.preventRowClick) {
      e.stopPropagation()
    }
  }
  return (
    <tbody className="bg-white">
      {data.map((row, index) => (
        <tr
          key={index}
          className={rowClickClassName}
          onClick={() => handleRowClick(row)}
        >
          {columns.map((col: Column<T>) => {
            const width = col.width
            const alignClass =
              col.align === "center"
                ? "justify-center"
                : col.align === "right"
                  ? "justify-end"
                  : "justify-start"

            const key = getColumnKey(col, false)
            const tableBodyClassName = cn(
              `flex text-[12px] text-sz-n-900`,
              alignClass,
              bodyClassName
            )
            return (
              <td
                key={key}
                id={key}
                ref={el => {
                  if (el) {
                    cellRef.current[`${col.key.toString()}-${index}`] = el
                  }
                }}
                onClick={e => handleCellClick(e, col, index)}
                className={cn(
                  "border-b border-sz-n-200 px-4 py-[8px]",
                  col.fixed && "bg-white group-hover:bg-sz-n-50",
                  cellClassName
                )}
                style={{
                  width: width ? `${width}px` : undefined,
                  minWidth: width ? `${width}px` : undefined,
                  maxWidth: width ? `${width}px` : undefined,
                  ...getColumnFixedStyle(col),
                }}
              >
                <div className={tableBodyClassName}>
                  {col?.render
                    ? col.render(row[col.key as keyof T], row, index)
                    : row[col.key as keyof T]
                      ? (row[col.key as keyof T] as string)
                      : "-"}
                </div>
              </td>
            )
          })}
        </tr>
      ))}
    </tbody>
  )
}
