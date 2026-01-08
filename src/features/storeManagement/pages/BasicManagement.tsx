import Section from "@/common/components/Section/Section"

export default function BasicManagement() {
  return (
    <form
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.preventDefault()
        }
      }}
    >
      <Section>asdf</Section>
    </form>
  )
}
