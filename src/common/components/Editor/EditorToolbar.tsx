import { type Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface EditorToolbarProps {
  editor: Editor
  isHtmlMode: boolean
  onToggleHtmlMode: () => void
  onImageUpload: () => void
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}

const ToolbarButton = (props: ToolbarButtonProps) => {
  const { onClick, isActive, disabled, children, title } = props

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? "bg-gray-200" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  )
}

export function EditorToolbar(props: EditorToolbarProps) {
  const { editor, isHtmlMode, onToggleHtmlMode, onImageUpload } = props
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [showColorPicker, setShowColorPicker] = useState(false)

  const addLink = () => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run()
      setShowLinkInput(false)
      return
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run()

    setShowLinkInput(false)
    setLinkUrl("")
  }

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
    setShowColorPicker(false)
  }

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
  ]

  return (
    <div className="border-b bg-gray-50 p-2 relative overflow-visible">
      <div className="flex flex-wrap gap-1 items-center relative overflow-visible">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Quote */}
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Link */}
        <div className="flex gap-1 border-r pr-2 relative">
          <ToolbarButton
            onClick={() => setShowLinkInput(!showLinkInput)}
            isActive={editor.isActive("link")}
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>

          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-xl p-2 z-50 flex gap-2">
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    addLink()
                  }
                }}
                className="border rounded px-2 py-1 text-sm w-64"
                autoFocus
              />
              <Button size="sm" onClick={addLink}>
                확인
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLinkInput(false)}
              >
                취소
              </Button>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton onClick={onImageUpload} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Color */}
        <div className="flex gap-1 border-r pr-2 relative">
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
          >
            <div className="w-4 h-4 border border-gray-300 rounded">
              <div
                className="w-full h-full rounded"
                style={{
                  backgroundColor:
                    editor.getAttributes("textStyle").color || "#000000",
                }}
              />
            </div>
          </ToolbarButton>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-xl p-3 z-50 min-w-[160px]">
              <div className="grid grid-cols-5 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColor(color)}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run()
                  setShowColorPicker(false)
                }}
                className="mt-2 w-full text-xs py-1 px-2 border rounded hover:bg-gray-100"
              >
                기본 색상으로
              </button>
            </div>
          )}
        </div>

        {/* HTML Mode Toggle */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={onToggleHtmlMode}
            isActive={isHtmlMode}
            title="HTML Mode"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>
    </div>
  )
}
