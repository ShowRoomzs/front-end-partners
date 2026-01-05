type FileSizeUnit = "KB" | "MB" | "GB" | "TB"

interface FileSizeResult {
  value: number
  unit: FileSizeUnit
}

export function formatFileSizeFromKB(
  kb: number,
  fractionDigits: number = 2
): FileSizeResult {
  if (!Number.isFinite(kb) || kb < 0) {
    throw new Error("Invalid KB value")
  }

  if (kb === 0) {
    return { value: 0, unit: "KB" }
  }

  const units: FileSizeUnit[] = ["KB", "MB", "GB", "TB"]
  const base = 1024

  const exponent = Math.min(
    Math.floor(Math.log(kb) / Math.log(base)),
    units.length - 1
  )

  const value = Number((kb / Math.pow(base, exponent)).toFixed(fractionDigits))

  return {
    value,
    unit: units[exponent],
  }
}
