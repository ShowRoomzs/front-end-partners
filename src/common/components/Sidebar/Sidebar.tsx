import logo from "@/common/assets/logo.svg"
import type { MenuConfig, MenuItem } from "@/common/types/menu"
import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HEADER_HEIGHT } from "../MainLayout/config"
import { SIDEBAR_WIDTH } from "./config"

interface SidebarProps {
  menus: Array<MenuConfig>
  isOpen: boolean
}

const OPEN_GROUPS_STORAGE_KEY = "partner-sidebar-open-groups"

function readOpenGroups(): Array<string> {
  try {
    const stored = sessionStorage.getItem(OPEN_GROUPS_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Array<string>) : []
  } catch {
    return []
  }
}

/**
 * 파트너센터 셸 사이드바 (SHOWROOMZ 웹 디자인시스템 §사이드바 GNB).
 *
 * 배경 --n-100 · 우측 --n-200 보더 · 현재 화면인 항목만 --accent-500으로 채운다.
 * 예전에는 네이비(#1c223f) 계열의 자체 테마를 썼는데, 디자인시스템에 없는 색이라
 * 어드민·스튜디오와 톤이 전혀 맞지 않았다. 하드코딩 헥스를 다시 들이지 말 것.
 */
export default function Sidebar(props: SidebarProps) {
  const { menus, isOpen: isSidebarOpen } = props
  const location = useLocation()
  const navigate = useNavigate()

  const [openGroupIds, setOpenGroupIds] =
    useState<Array<string>>(readOpenGroups)

  useEffect(() => {
    sessionStorage.setItem(
      OPEN_GROUPS_STORAGE_KEY,
      JSON.stringify(openGroupIds)
    )
  }, [openGroupIds])

  const matchesPrefix = useCallback(
    (path?: string) =>
      Boolean(path) &&
      (location.pathname === path || location.pathname.startsWith(`${path}/`)),
    [location.pathname]
  )

  /**
   * 활성 판정 — `matchPaths`가 있으면 그 목록으로, 없으면 `path` 하나로 본다.
   * "상품 관리"처럼 목록으로 이동하지만 등록·수정 화면까지 대표하는 메뉴가 있어서
   * 이동 목적지(`path`)와 활성 범위(`matchPaths`)를 분리해 둔다.
   */
  const isItemActive = useCallback(
    (item: MenuItem) => (item.matchPaths ?? [item.path]).some(matchesPrefix),
    [matchesPrefix]
  )

  const isChildActive = useCallback(
    (item: MenuItem) => item.children?.some(isItemActive) ?? false,
    [isItemActive]
  )

  const groups = menus.flatMap(menu => menu.groups)

  // 현재 경로가 속한 그룹은 자동으로 펼친다
  useEffect(() => {
    const activeGroup = groups.find(group => isChildActive(group))
    if (!activeGroup) {
      return
    }
    setOpenGroupIds(prev =>
      prev.includes(activeGroup.id) ? prev : [...prev, activeGroup.id]
    )
  }, [groups, isChildActive])

  const toggleGroup = (groupId: string) => {
    setOpenGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-sz-n-200 bg-sz-n-100 transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      {/* 시안 `.side-brand` — 탑바와 같은 높이(56px)라야 구분선이 한 줄로 이어진다 */}
      <div
        className="flex shrink-0 items-center gap-2 border-b border-sz-n-200 px-4"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <img
          src={logo}
          alt="SHOWROOMZ"
          className="h-3.5 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <span className="ml-0.5 border-l border-sz-n-300 pl-2 text-[11px] font-medium text-sz-n-500">
          파트너센터
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {groups.map((group, index) => {
          const hasChildren = Boolean(group.children?.length)
          const isOpen = openGroupIds.includes(group.id)
          const isActive = hasChildren
            ? isChildActive(group)
            : isItemActive(group)

          /*
            디자인시스템 `.gnb-item.active` — 현재 화면인 항목을 액센트로 채운다.
            하위 메뉴를 가진 그룹은 제외한다. 그룹은 화면이 아니라 묶음이고,
            실제 현재 화면인 하위 항목이 따로 채워지므로 둘 다 칠하면 흐려진다.
          */
          const isFilled = !hasChildren && isActive

          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() =>
                  group.path ? navigate(group.path) : toggleGroup(group.id)
                }
                className={`mb-0.5 flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[12px] ${
                  isFilled
                    ? "bg-sz-accent-500 font-medium text-white"
                    : `hover:bg-sz-n-200 ${
                        isOpen || isActive
                          ? "font-medium text-sz-n-900"
                          : "text-sz-n-600"
                      }`
                }`}
              >
                <span
                  className={`w-[15px] shrink-0 text-center text-[11px] ${
                    isFilled ? "text-white/70" : "text-sz-n-400"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex-1">{group.label}</span>
                {hasChildren && (
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center transition-transform ${
                      isOpen ? "rotate-180 text-sz-n-700" : "text-sz-n-500"
                    }`}
                  >
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      className="h-[11px] w-[11px]"
                    >
                      <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>

              {hasChildren && isOpen && (
                <div>
                  {group.children!.map(child => {
                    const isCurrent = isItemActive(child)

                    return (
                      <Link
                        key={child.id}
                        to={child.path ?? "#"}
                        className={`mb-px flex items-center justify-between rounded-[6px] py-[5px] pl-[33px] pr-2.5 text-[11px] ${
                          isCurrent
                            ? "bg-sz-accent-500 font-medium text-white"
                            : "text-sz-n-500 hover:bg-sz-n-200"
                        }`}
                      >
                        <span>{child.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
