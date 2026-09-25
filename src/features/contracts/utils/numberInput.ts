/** 콤마·문자를 걷어낸 정수. 비어 있으면 null */
export function parseIntegerInput(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, "")
  return digits === "" ? null : Number(digits)
}

/** 정수를 천 단위 콤마 문자열로 — 입력 칸에 그대로 보인다 */
export function formatIntegerInput(value: number | null): string {
  return value === null ? "" : value.toLocaleString("ko-KR")
}

/**
 * 리워드율 입력 — 숫자와 점 하나, 소수 첫째 자리까지만 남기고 상한으로 자른다(H3).
 * 문자열을 돌려주는 이유는 "15." 같은 입력 중간 상태를 유지하기 위해서다.
 */
export function sanitizeRateInput(raw: string, max: number): string {
  let text = raw.replace(/[^0-9.]/g, "")
  const firstDot = text.indexOf(".")
  if (firstDot !== -1) {
    text =
      text.slice(0, firstDot + 1) +
      text
        .slice(firstDot + 1)
        .replace(/\./g, "")
        .slice(0, 1)
  }
  if (text === "" || text === ".") {
    return text
  }
  const numeric = Number(text)
  if (Number.isNaN(numeric)) {
    return ""
  }
  return numeric > max ? String(max) : text
}

export function parseRateInput(text: string): number | null {
  if (text === "" || text === ".") {
    return null
  }
  const numeric = Number(text)
  return Number.isNaN(numeric) ? null : numeric
}
