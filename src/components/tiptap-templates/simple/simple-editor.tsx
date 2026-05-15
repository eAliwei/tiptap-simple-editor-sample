
import { useEffect } from "react"
import {
  EditorContent,
  EditorContext,
  useEditor,
  type Content,
} from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { TextAlign } from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Paragraph } from "@tiptap/extension-paragraph"
import { FontSize } from "@/components/tiptap-extension/font-size-extension"
// --- UI Primitives ---
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { FontSizeDropdownMenu } from "@/components/tiptap-ui/font-size"
import { TextColorPopover } from "@/components/tiptap-ui/text-color-popover"

// --- Hooks ---

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

const OrderedTextStyle = TextStyle.extend({
  // Keep textStyle (<span>) inside semantic marks like <strong>.
  priority: 90,
})

function rgbToHex(value: string) {
  const channels = value
    .split(",")
    .slice(0, 3)
    .map((part) => Number(part.trim()))

  if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
    return value
  }

  return `#${channels
    .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0"))
    .join("")}`
}

function normalizeHtmlColorToHex(html: string) {
  return html.replace(/color:\s*rgba?\(([^)]+)\)/gi, (_, rgbValue: string) => {
    return `color: ${rgbToHex(rgbValue)}`
  })
}

interface SimpleEditorProps {
  onChange?: (html: string) => void
  content?: Content
  background?: string
}

export function SimpleEditor({ onChange, content, background = "#ffffff" }: SimpleEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(normalizeHtmlColorToHex(editor.getHTML()))
      }
    },
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        paragraph: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      Paragraph.extend({
        parseHTML() {
          return [{ tag: "div" }, { tag: "p" }]
        },
        renderHTML({ HTMLAttributes }) {
          return ["div", HTMLAttributes, 0]
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      OrderedTextStyle,
      FontSize.configure({
        types: ["textStyle"],
      }),
      Color.configure({ types: ["textStyle"] }),
    ],
    content,
  })

  useEffect(() => {
    if (
      editor &&
      content &&
      content !== normalizeHtmlColorToHex(editor.getHTML())
    ) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar>
          <FontSizeDropdownMenu editor={editor} />
          <ToolbarSeparator />
          <ToolbarGroup>
            <MarkButton type="bold" />
            <MarkButton type="italic" />
            <MarkButton type="underline" />
            <TextColorPopover editor={editor} />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <TextAlignButton align="left" />
            <TextAlignButton align="center" />
            <TextAlignButton align="right" />
          </ToolbarGroup>

          <Spacer />
        </Toolbar>
        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
          style={{ backgroundColor: background }}
        />
      </EditorContext.Provider>
    </div>
  )
}
