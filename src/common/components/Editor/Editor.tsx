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
  /** 읽기 전용 — 본문 편집·툴바·HTML 모드 전부 막는다 */
  disabled?: boolean
}

export default function Editor(props: EditorProps) {
  const { value = "", onChange, imageUploadType, disabled = false } = props
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
          class: "text-sz-accent-500 underline cursor-pointer",
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
    editable: !disabled,
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

  /*
    잠금은 CSS(pointer-events)로 못 막는다 — 본문이 contenteditable이라
    마우스만 막히고 Tab으로 들어가면 그대로 타이핑된다.
    Tiptap의 editable을 직접 꺼야 실제로 입력이 차단된다.
  */
  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

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
    // 시안 `.editor-wrap` / `.editor-wrap.disabled` — 6px 라운드 + n-300 테두리
    <div
      className={`overflow-hidden rounded-[6px] border border-sz-n-300 ${
        disabled ? "bg-sz-n-50" : ""
      }`}
    >
      {/* 툴바는 잠금 시 클릭만 막으면 된다(포커스 대상이 아니라 버튼뿐) */}
      <div className={disabled ? "pointer-events-none opacity-60" : ""}>
        <EditorToolbar
          editor={editor}
          isHtmlMode={isHtmlMode}
          onToggleHtmlMode={() => setIsHtmlMode(!isHtmlMode)}
          onImageUpload={handleImageUpload}
        />
      </div>

      {isHtmlMode ? (
        <textarea
          value={htmlValue}
          onChange={e => handleHtmlChange(e.target.value)}
          disabled={disabled}
          className="w-full min-h-[300px] p-4 font-mono text-sm focus:outline-none border-t disabled:bg-sz-n-50 disabled:text-sz-n-500"
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
