import type { MenuType } from "@/common/types/role"

export interface MenuItem {
  id: string
  label: string
  path?: string
  /**
   * 활성(파란색) 판정에만 쓰는 경로 접두사 목록.
   *
   * `path`는 "클릭하면 갈 곳"이라 한 개뿐이지만, 한 메뉴가 여러 경로를 대표하는
   * 경우가 있다 — 예를 들어 "상품 관리"는 목록(`/product/list`)으로 이동하되
   * 등록(`/product/register`)·수정(`/product/edit/:id`) 화면에서도 활성이어야 한다.
   * 생략하면 `path` 하나만 기준으로 판정한다.
   */
  matchPaths?: Array<string>
  children?: Array<MenuItem>
}

export interface MenuConfig {
  menuType: MenuType | "COMMON"
  groups: Array<MenuItem>
}
