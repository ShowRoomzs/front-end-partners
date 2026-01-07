import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Underline } from "@tiptap/extension-underline"
import { TextAlign } from "@tiptap/extension-text-align"
import { Link } from "@tiptap/extension-link"
import { Image } from "@tiptap/extension-image"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { useEffect, useState } from "react"
import { EditorToolbar } from "./EditorToolbar"
import { fileService, type FileType } from "@/common/services/fileService"
import "./editor.css"

interface EditorProps {
  value?: string
  onChange?: (html: string) => void
  imageUploadType: FileType
}

export default function Editor(props: EditorProps) {
  const { value = "", onChange, imageUploadType } = props
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto cursor-pointer",
        },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
      setHtmlValue(html)
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
      setHtmlValue(value)
    }
  }, [editor, value])

  const handleHtmlChange = (newHtml: string) => {
    setHtmlValue(newHtml)
    if (editor) {
      editor.commands.setContent(newHtml)
      onChange?.(newHtml)
    }
  }

  const handleImageUpload = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !editor) return

      try {
        const result = await fileService.upload(file, imageUploadType)
        editor.chain().focus().setImage({ src: result.imageUrl }).run()
      } catch (error) {
        console.error("이미지 업로드 실패:", error)
        alert("이미지 업로드에 실패했습니다.")
      }
    }
    input.click()
  }

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <EditorToolbar
        editor={editor}
        isHtmlMode={isHtmlMode}
        onToggleHtmlMode={() => setIsHtmlMode(!isHtmlMode)}
        onImageUpload={handleImageUpload}
      />

      {isHtmlMode ? (
        <textarea
          value={htmlValue}
          onChange={e => handleHtmlChange(e.target.value)}
          className="w-full min-h-[300px] p-4 font-mono text-sm focus:outline-none border-t"
          placeholder="HTML 코드를 입력하세요..."
        />
      ) : (
        <div className="border-t">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}
