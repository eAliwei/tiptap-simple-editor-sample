import { forwardRef, useCallback, useState } from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { CheckIcon } from "@/components/tiptap-icons/check-icon"

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

import "./font-size-dropdown-menu.scss"

const DEFAULT_FONT_SIZE_OPTIONS = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
  "24",
  "26",
  "28",
  "36",
  "28",
  "72",
]

const normalizeFontSize = (value: string) => value.trim().replace(/px$/i, "")

export interface FontSizeDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  options?: string[]
  defaultLabel?: string
  emptyTitle?: string
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
      options = DEFAULT_FONT_SIZE_OPTIONS,
      defaultLabel = "Default",
      emptyTitle = "サイズ",
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
    const currentFontSizeValue = normalizeFontSize(currentFontSize)
    const currentFontSizeLabel = currentFontSizeValue || emptyTitle
    const canToggle = !!editor?.isEditable

    const applyFontSize = useCallback(
      (fontSize?: string) => {
        if (!editor) return

        const chain = editor.chain().focus()
        if (fontSize) {
          const normalizedFontSize = normalizeFontSize(fontSize)
          chain.setFontSize(`${normalizedFontSize}px`).run()
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
            aria-label="Font size"
            aria-pressed={!!currentFontSizeValue}
            tooltip="Font size"
            {...buttonProps}
            ref={ref}
          >
            {children ? (
              children
            ) : (
              <>
                <span className="tiptap-button-text">
                  {currentFontSizeLabel}
                </span>
                <ChevronDownIcon className="tiptap-button-dropdown-small" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="tiptap-font-size-menu-content">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="tiptap-font-size-menu-item"
              data-active={!currentFontSizeValue}
              onSelect={() => applyFontSize(undefined)}
            >
              <span>{defaultLabel}</span>
              <CheckIcon className="tiptap-font-size-menu-item-check" />
            </DropdownMenuItem>
            {options.map((option, index) => {
              const optionValue = normalizeFontSize(option)
              const optionLabel = optionValue
              const isActive = optionValue === currentFontSizeValue

              return (
                <DropdownMenuItem
                  key={`${option}-${index}`}
                  className="tiptap-font-size-menu-item"
                  data-active={isActive}
                  onSelect={() => applyFontSize(optionValue)}
                >
                  <span>{optionLabel}</span>
                  <CheckIcon className="tiptap-font-size-menu-item-check" />
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

FontSizeDropdownMenu.displayName = "FontSizeDropdownMenu"

export default FontSizeDropdownMenu
