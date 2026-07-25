import { authInputClass } from "@/common/components/Auth/authStyles"

type AddressFieldProps = {
  id?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  hasError?: boolean
  placeholder?: string
  disabled?: boolean
  /**
   * 주소 검색 팝업 연동 자리(현재는 수동 텍스트 입력).
   * 제공되면 "검색" 버튼을 렌더링 → 추후 다음/카카오 우편번호 팝업으로 이 콜백만 교체.
   */
  onSearchClick?: () => void
}

// 사업장 주소 입력. 현재는 수동 텍스트 입력(사용자 결정). 팝업-agnostic 인터페이스 유지.
export function AddressField({
  id,
  value,
  onChange,
  onBlur,
  hasError,
  placeholder,
  disabled,
  onSearchClick,
}: AddressFieldProps) {
  return (
    <div className="flex w-full gap-2">
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={authInputClass(hasError, "flex-1")}
      />
      {onSearchClick && (
        <button
          type="button"
          onClick={onSearchClick}
          disabled={disabled}
          className="h-10 whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-4 text-[12px] font-medium text-sz-n-700 hover:enabled:bg-sz-n-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          🔍 검색
        </button>
      )}
    </div>
  )
}
