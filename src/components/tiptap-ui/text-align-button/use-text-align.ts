import { useCallback, useEffect, useState } from "react"
import type { ChainedCommands } from "@tiptap/react"
import { type Editor } from "@tiptap/react"
import { Fragment } from "@tiptap/pm/model"
import { TextSelection } from "@tiptap/pm/state"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Lib ---
import {
  isExtensionAvailable,
  isNodeTypeSelected,
} from "@/lib/tiptap-utils"

// --- Icons ---
import { AlignCenterIcon } from "@/components/tiptap-icons/align-center-icon"
import { AlignJustifyIcon } from "@/components/tiptap-icons/align-justify-icon"
import { AlignLeftIcon } from "@/components/tiptap-icons/align-left-icon"
import { AlignRightIcon } from "@/components/tiptap-icons/align-right-icon"

export type TextAlign = "left" | "center" | "right" | "justify"

/**
 * Configuration for the text align functionality
 */
export interface UseTextAlignConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * The text alignment to apply.
   */
  align: TextAlign
  /**
   * Whether the button should hide when alignment is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful alignment change.
   */
  onAligned?: () => void
}

export const TEXT_ALIGN_SHORTCUT_KEYS: Record<TextAlign, string> = {
  left: "mod+shift+l",
  center: "mod+shift+e",
  right: "mod+shift+r",
  justify: "mod+shift+j",
}

export const textAlignIcons = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
  justify: AlignJustifyIcon,
}

export const textAlignLabels: Record<TextAlign, string> = {
  left: "Align left",
  center: "Align center",
  right: "Align right",
  justify: "Align justify",
}

function isHardBreakNodeName(nodeName: string): boolean {
  return nodeName === "hardBreak"
}

function getLineOffsetsByOffset(
  parent: Editor["state"]["selection"]["$from"]["parent"],
  offset: number
): { fromOffset: number; toOffset: number } {
  let lineStart = 0
  let lineEnd = parent.content.size

  let currentOffset = 0
  for (let index = 0; index < parent.childCount; index += 1) {
    const child = parent.child(index)
    const nextOffset = currentOffset + child.nodeSize

    if (isHardBreakNodeName(child.type.name)) {
      if (nextOffset <= offset) {
        lineStart = nextOffset
      } else if (currentOffset >= offset) {
        lineEnd = currentOffset
        break
      }
    }

    currentOffset = nextOffset
  }

  return { fromOffset: lineStart, toOffset: lineEnd }
}

function hasHardBreakInRange(
  parent: Editor["state"]["selection"]["$from"]["parent"],
  fromOffset: number,
  toOffset: number
): boolean {
  if (fromOffset >= toOffset) return false

  let currentOffset = 0
  for (let index = 0; index < parent.childCount; index += 1) {
    const child = parent.child(index)
    const nextOffset = currentOffset + child.nodeSize

    if (
      isHardBreakNodeName(child.type.name) &&
      currentOffset >= fromOffset &&
      nextOffset <= toOffset
    ) {
      return true
    }

    if (currentOffset > toOffset) {
      break
    }

    currentOffset = nextOffset
  }

  return false
}

function removeLeadingHardBreak(fragment: Fragment): Fragment {
  const firstNode = fragment.firstChild

  if (!firstNode || !isHardBreakNodeName(firstNode.type.name)) {
    return fragment
  }

  return fragment.cut(firstNode.nodeSize, fragment.size)
}

function removeTrailingHardBreak(fragment: Fragment): Fragment {
  const lastNode = fragment.lastChild

  if (!lastNode || !isHardBreakNodeName(lastNode.type.name)) {
    return fragment
  }

  return fragment.cut(0, fragment.size - lastNode.nodeSize)
}

function trySetTextAlignForSelectedLine(editor: Editor, align: TextAlign): boolean {
  const { selection } = editor.state
  const { $from, $to, empty } = selection

  if (!$from.sameParent($to)) return false

  const parent = $from.parent
  if (!parent.isTextblock) return false
  if (parent.type.name !== "paragraph" && parent.type.name !== "heading") {
    return false
  }

  let fromOffset = $from.parentOffset
  let toOffset = $to.parentOffset

  if (empty) {
    const lineOffsets = getLineOffsetsByOffset(parent, $from.parentOffset)
    fromOffset = lineOffsets.fromOffset
    toOffset = lineOffsets.toOffset

    if (fromOffset === toOffset) return false
  } else {
    if (fromOffset === toOffset) return false

    const selectionFrom = Math.min(fromOffset, toOffset)
    const selectionTo = Math.max(fromOffset, toOffset)

    if (hasHardBreakInRange(parent, selectionFrom, selectionTo)) {
      return false
    }

    const lineOffsets = getLineOffsetsByOffset(parent, selectionFrom)
    fromOffset = lineOffsets.fromOffset
    toOffset = lineOffsets.toOffset
  }

  const parentAttrs = parent.attrs ?? {}
  let before = parent.content.cut(0, fromOffset)
  let selected = parent.content.cut(fromOffset, toOffset)
  let after = parent.content.cut(toOffset, parent.content.size)

  before = removeTrailingHardBreak(before)
  selected = removeLeadingHardBreak(removeTrailingHardBreak(selected))
  after = removeLeadingHardBreak(after)

  if (selected.size === 0) return false

  const replacementNodes = []

  if (before.size > 0) {
    replacementNodes.push(parent.type.create(parentAttrs, before))
  }

  const alignedNode = parent.type.create({ ...parentAttrs, textAlign: align }, selected)
  replacementNodes.push(alignedNode)

  if (after.size > 0) {
    replacementNodes.push(parent.type.create(parentAttrs, after))
  }

  const parentStart = $from.before()
  const tr = editor.state.tr.replaceWith(
    parentStart,
    parentStart + parent.nodeSize,
    replacementNodes
  )

  const beforeNodeSize = before.size > 0
    ? parent.type.create(parentAttrs, before).nodeSize
    : 0
  const alignedNodeStart = parentStart + beforeNodeSize
  const alignedNodeEnd = alignedNodeStart + alignedNode.nodeSize - 1

  tr.setSelection(TextSelection.create(tr.doc, alignedNodeEnd))

  editor.view.dispatch(tr.scrollIntoView())
  editor.view.focus()
  return true
}

/**
 * Checks if text alignment can be performed in the current editor state
 */
export function canSetTextAlign(
  editor: Editor | null,
  align: TextAlign
): boolean {
  if (!editor || !editor.isEditable) return false
  if (
    !isExtensionAvailable(editor, "textAlign") ||
    isNodeTypeSelected(editor, ["image", "horizontalRule"])
  )
    return false

  return editor.can().setTextAlign(align)
}

export function hasSetTextAlign(
  commands: ChainedCommands
): commands is ChainedCommands & {
  setTextAlign: (align: TextAlign) => ChainedCommands
} {
  return "setTextAlign" in commands
}

/**
 * Checks if the text alignment is currently active
 */
export function isTextAlignActive(
  editor: Editor | null,
  align: TextAlign
): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.isActive({ textAlign: align })
}

/**
 * Sets text alignment in the editor
 */
export function setTextAlign(editor: Editor | null, align: TextAlign): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canSetTextAlign(editor, align)) return false

  if (trySetTextAlignForSelectedLine(editor, align)) {
    return true
  }

  const chain = editor.chain().focus()
  if (hasSetTextAlign(chain)) {
    return chain.setTextAlign(align).run()
  }

  return false
}

/**
 * Determines if the text align button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
  align: TextAlign
}): boolean {
  const { editor, hideWhenUnavailable, align } = props

  if (!editor) return false

  if (!hideWhenUnavailable) {
    return true
  }

  if (!editor.isEditable) return false

  if (!isExtensionAvailable(editor, "textAlign")) return false

  if (!editor.isActive("code")) {
    return canSetTextAlign(editor, align)
  }

  return true
}

/**
 * Custom hook that provides text align functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleAlignButton() {
 *   const { isVisible, handleTextAlign } = useTextAlign({ align: "center" })
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleTextAlign}>Align Center</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedAlignButton() {
 *   const { isVisible, handleTextAlign, label, isActive } = useTextAlign({
 *     editor: myEditor,
 *     align: "right",
 *     hideWhenUnavailable: true,
 *     onAligned: () => console.log('Text aligned!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleTextAlign}
 *       aria-pressed={isActive}
 *       aria-label={label}
 *     >
 *       Align Right
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useTextAlign(config: UseTextAlignConfig) {
  const {
    editor: providedEditor,
    align,
    hideWhenUnavailable = false,
    onAligned,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canAlign = canSetTextAlign(editor, align)
  const isActive = isTextAlignActive(editor, align)

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, align, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable, align])

  const handleTextAlign = useCallback(() => {
    if (!editor) return false

    const success = setTextAlign(editor, align)
    if (success) {
      onAligned?.()
    }
    return success
  }, [editor, align, onAligned])

  return {
    isVisible,
    isActive,
    handleTextAlign,
    canAlign,
    label: textAlignLabels[align],
    shortcutKeys: TEXT_ALIGN_SHORTCUT_KEYS[align],
    Icon: textAlignIcons[align],
  }
}
