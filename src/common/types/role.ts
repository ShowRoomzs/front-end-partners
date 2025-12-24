export const ROLE = {
  INDIVIDUAL: 'INDIVIDUAL',
  BRAND: 'BRAND',
  CREATOR: 'CREATOR',
} as const

export type Role = (typeof ROLE)[keyof typeof ROLE]

export type MenuType = 'SELLER' | 'CREATOR'

export const getMenuTypeByRole = (role: Role): MenuType => {
  return role === ROLE.CREATOR ? 'CREATOR' : 'SELLER'
}
