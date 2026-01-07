import type { Column } from "@/common/components/Table/types"

// fixed 컬럼들의 위치를 계산하는 함수
export const calculateFixedPositions = <T>(
  columns: Column<T>[],
  isHeader: boolean = false
) => {
  const leftFixed: { [key: string]: string } = {}
  const rightFixed: { [key: string]: string } = {}

  let leftOffset = 0
  let rightOffset = 0

  // left fixed 컬럼들의 위치 계산
  columns.forEach(column => {
    if (column.fixed === "left") {
      leftFixed[column.key.toString()] = `${leftOffset}px`
      const targetNode = document.getElementById(
        `${column.key.toString()}-${column.label}${isHeader ? "-header" : "-body"}`
      )

      const width = targetNode?.getBoundingClientRect().width as number

      leftOffset += width
    }
  })

  // right fixed 컬럼들의 위치 계산 (역순으로)
  const rightFixedColumns = columns
    .filter(col => col.fixed === "right")
    .reverse()
  rightFixedColumns.forEach(column => {
    rightFixed[column.key.toString()] = `${rightOffset}px`
    const targetNode = document.getElementById(
      `${column.key.toString()}${isHeader ? "-header" : "-body"}`
    )
    const width = targetNode?.getBoundingClientRect().width as number
    rightOffset += width
  })

  return { leftFixed, rightFixed }
}

// fixed 컬럼에 대한 스타일을 반환하는 함수
export const getFixedStyle = <T>(
  column: Column<T>,
  leftFixed: { [key: string]: string },
  rightFixed: { [key: string]: string },
  isHeader = false,
  isCurrentFixed = false
) => {
  const baseStyle: React.CSSProperties = {}
  if (!column.fixed) {
    return
  }
  baseStyle.position = "sticky"
  baseStyle.zIndex = isHeader ? 10 : 5
  if (column.fixed === "left") {
    baseStyle.left = leftFixed[column.key.toString()]
    if (isCurrentFixed) {
      baseStyle.transition = "box-shadow 0.2s ease-in-out"
      baseStyle.boxShadow = "4px 0 10px rgba(0, 0, 0, 0.06)"
    }
  }
  if (column.fixed === "right") {
    baseStyle.right = rightFixed[column.key.toString()]
    if (isCurrentFixed) {
      baseStyle.transition = "box-shadow 0.2s ease-in-out"
      baseStyle.boxShadow = "-4px 0 10px rgba(0, 0, 0, 0.06)"
    }
  }

  return baseStyle
}

export const getAbsoluteWidths = <T>(columns: Column<T>[]) => {
  const absolutePositions: { [key: string]: string } = columns.reduce(
    (acc, col) => {
      const targetNode = document.getElementById(`${col.key.toString()}-body`)
      const width = targetNode?.getBoundingClientRect().width as number
      acc[col.key.toString()] = `${width}px`
      return acc
    },
    {} as { [key: string]: string }
  )

  return absolutePositions
}
