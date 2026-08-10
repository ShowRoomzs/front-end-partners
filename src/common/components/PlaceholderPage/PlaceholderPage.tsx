interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage(props: PlaceholderPageProps) {
  const { title } = props

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-3xl font-light text-sz-n-900 mb-2">{title}</h1>
        <p className="text-sm text-sz-n-500">Page content to be implemented</p>
      </div>
    </div>
  )
}
