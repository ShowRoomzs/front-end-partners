/**
 * 목적격 조사(을/를)를 붙인다 — 마지막 글자의 받침 유무로 갈린다.
 *
 * 변경 요청 모달처럼 **항목 이름이 서버에서 내려오는** 화면에서 필요하다.
 * "사업장 주소를 입력해 주세요." / "브랜드명을 입력해 주세요."를 문구별로 하드코딩할 수
 * 없어서(항목 목록의 SoT가 서버 enum이다) 조사만 계산해 붙인다.
 *
 * 한글이 아닌 글자로 끝나면(영문·숫자·기호) 받침을 판정할 수 없으므로 "를"로 둔다 —
 * 현재 항목 라벨은 전부 한글이라 실제로 타지 않는 경로다.
 */
export function withObjectParticle(word: string): string {
  const lastChar = word.trim().slice(-1)
  const code = lastChar.charCodeAt(0)

  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3
  if (!isHangulSyllable) {
    return `${word}를`
  }

  const hasFinalConsonant = (code - 0xac00) % 28 !== 0
  return `${word}${hasFinalConsonant ? "을" : "를"}`
}
