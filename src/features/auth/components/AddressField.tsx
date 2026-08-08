import { authInputClass } from "@/common/components/Auth/authStyles"

type AddressFieldProps = {
  id?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  hasError?: boolean
  placeholder?: string
  disabled?: boolean
  /** 제공되면 "검색" 버튼을 렌더링하고, 클릭 시 다음(카카오) 우편번호 팝업을 연다. */
  onSearchClick?: () => void
  /**
   * 직접 타이핑을 막고 검색 결과로만 채운다. 사업장 주소(회원가입)·반품 수취주소(온보딩)
   * 둘 다 직접 입력을 허용하지 않기로 해 현재 두 호출부 모두 true로 쓴다.
   * prop 자체는 남겨 둔다 — 나중에 자유 입력이 필요한 화면이 생길 수 있다.
   */
  readOnly?: boolean
}

// 우편번호 검색 팝업으로만 채우는 주소 입력. 팝업-agnostic 인터페이스(onSearchClick)로
// AddressField 자체는 다음(카카오) 우편번호 서비스를 직접 알지 못한다.
export function AddressField({
  id,
  value,
  onChange,
  onBlur,
  hasError,
  placeholder,
  disabled,
  onSearchClick,
  readOnly,
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
        readOnly={readOnly}
        className={authInputClass(
          hasError,
          readOnly ? "flex-1 cursor-pointer" : "flex-1"
        )}
        onClick={readOnly ? onSearchClick : undefined}
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
