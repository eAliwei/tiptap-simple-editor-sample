import { forwardRef, useCallback, useState } from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/tiptap-ui-primitive/dropdown-menu"

export interface FontSizeDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  options?: string[]
  defaultLabel?: string
  onOpenChange?: (isOpen: boolean) => void
  modal?: boolean
}

export const FontSizeDropdownMenu = forwardRef<
  HTMLButtonElement,
  FontSizeDropdownMenuProps
>(
  (
    {
      editor: providedEditor,
      options = ["12px", "14px", "16px", "18px", "20px", "24px"],
      defaultLabel = "サイズ",
      onOpenChange,
      children,
      modal = true,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const currentFontSize = editor?.getAttributes("textStyle").fontSize ?? ""
    const canToggle = !!editor?.isEditable

    const applyFontSize = useCallback(
      (fontSize?: string) => {
        if (!editor) return

        const chain = editor.chain().focus()
        if (fontSize) {
          chain.setFontSize(fontSize).run()
          return
        }

        chain.unsetFontSize().run()
      },
      [editor]
    )

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!editor || !canToggle) return
        setIsOpen(open)
        onOpenChange?.(open)
      },
      [canToggle, editor, onOpenChange]
    )

    if (!editor) {
      return null
    }

    return (
      <DropdownMenu modal={modal} open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            data-active-state={currentFontSize ? "on" : "off"}
            data-text-trim="on"
            role="button"
            tabIndex={-1}
            disabled={!canToggle}
            data-disabled={!canToggle}
            aria-label="サイズ"
            aria-pressed={!!currentFontSize}
            tooltip="サイズ"
            {...buttonProps}
            ref={ref}
          >
            {children ? (
              children
            ) : (
              <>
                <span className="tiptap-button-text">
                  {currentFontSize || defaultLabel}
                </span>
                <ChevronDownIcon className="tiptap-button-dropdown-small" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => applyFontSize(undefined)}>
              {defaultLabel}
            </DropdownMenuItem>
            {options.map((option) => (
              <DropdownMenuItem key={option} onSelect={() => applyFontSize(option)}>
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

FontSizeDropdownMenu.displayName = "FontSizeDropdownMenu"

export default FontSizeDropdownMenu
