import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  required?: boolean
}

export default function Section(props: SectionProps) {
  const { title, children, required = false } = props

  return (
    <section className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="px-6 py-2 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h2>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </section>
  )
}
