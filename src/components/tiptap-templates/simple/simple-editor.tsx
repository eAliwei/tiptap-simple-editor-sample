
import { useEffect, type ChangeEvent } from "react"
import {
  EditorContent,
  EditorContext,
  useEditor,
  type Content,
} from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { FontSize } from "@/components/tiptap-extension/font-size-extension"

// --- UI Primitives ---
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { FontSizeDropdownMenu } from "@/components/tiptap-ui/font-size"

// --- Hooks ---

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import { Node } from "@tiptap/core"

interface SimpleEditorProps {
  onChange?: (html: string) => void
  content?: Content
}

export function SimpleEditor({ onChange, content }: SimpleEditorProps) {
  const CustomDiv = Node.create({
    name: "customDiv",
    group: "block",
    content: "inline*",
    parseHTML() {
      return [{ tag: "div" }]
    },
    renderHTML({ HTMLAttributes }) {
      return ["div", HTMLAttributes, 0]
    },
  })


  const editor = useEditor({
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML())
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
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),

      HorizontalRule,
      CustomDiv,
      TextAlign.configure({
        types: ["heading", "paragraph", "customDiv"],
        alignments: ["left", "center", "right"],
      }),
      TextStyle,
      FontSize.configure({
        types: ['textStyle'],  // 可选，配置哪些类型的节点可以使用
      }),
      Color.configure({ types: ["textStyle"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
    ],
    content,
  })

  const currentColor = editor?.getAttributes("textStyle").color ?? "#000000"

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!editor) return

    editor.chain().focus().setColor(event.target.value).run()
  }

  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
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
            <input
              aria-label="文字颜色"
              className="simple-editor-text-color"
              onChange={handleColorChange}
              type="color"
              value={currentColor}
            />
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
        />
      </EditorContext.Provider>
    </div>
  )
}
