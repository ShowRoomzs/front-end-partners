import Editor from "../Editor/Editor"
import { type FileType } from "@/common/services/fileService"

interface FormEditorProps {
  value?: string
  onChange?: (html: string) => void
  imageUploadType: FileType
  placeholder?: string
}

export default function FormEditor(props: FormEditorProps) {
  return <Editor {...props} />
}
