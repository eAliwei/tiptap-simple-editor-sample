import { useCallback, useEffect, useRef, useState } from "react"
import { type Editor } from "@tiptap/react"

import { CheckIcon } from "@/components/tiptap-icons/check-icon"
import { ColorFillIcon } from "@/components/tiptap-icons/color-fill-icon"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover"
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card"
import { Input } from "@/components/tiptap-ui-primitive/input"

import "@/components/tiptap-ui/text-color-popover/text-color-popover.scss"

const DEFAULT_TEXT_COLORS = [
  "#ff1f2d",
  "#e6d8cd",
]

const DEFAULT_SWATCH_ROWS = [
  ["#2fb7a7", "#37c871", "#4596d8", "#9b59b6", "#5d6d7e", "#f1c40f"],
  ["#27ae96", "#27ae60", "#2e86de", "#8e44ad", "#34495e", "#f39c12"],
  ["#e67e22", "#e74c3c", "#d5d8dc", "#95a5a6", "#c4c4c4", "#ffffff"],
  ["#d35400", "#c0392b", "#aeb6bf", "#7f8c8d", "#969696", "#000000"],
]

const RGB_PATTERN = /^rgba?\(([^)]+)\)$/i

function rgbToHex(rgbColor: string): string | null {
  const matched = rgbColor.match(RGB_PATTERN)
  if (!matched) return null

  const channels = matched[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number(part.trim()))

  if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
    return null
  }

  return `#${channels
    .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0"))
    .join("")}`
}

function normalizeHex(color: string): string | null {
  const value = color.trim().toLowerCase()

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value
  }

  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [, r, g, b] = value
    return `#${r}${r}${g}${g}${b}${b}`
  }

  if (/^#[0-9a-f]{8}$/i.test(value)) {
    return value.slice(0, 7)
  }

  if (/^#[0-9a-f]{4}$/i.test(value)) {
    const [, r, g, b] = value
    return `#${r}${r}${g}${g}${b}${b}`
  }

  if (typeof window === "undefined") {
    return null
  }

  const probe = document.createElement("span")
  probe.style.color = ""
  probe.style.color = value

  if (!probe.style.color) {
    return null
  }

  document.body.append(probe)
  const computedColor = window.getComputedStyle(probe).color
  probe.remove()

  return rgbToHex(computedColor)
}

export interface TextColorPopoverProps {
  editor?: Editor | null
  colors?: string[]
  onColorChange?: (hexColor: string) => void
}

export function TextColorPopover({
  editor,
  colors = DEFAULT_TEXT_COLORS,
  onColorChange,
}: TextColorPopoverProps) {
  const [open, setOpen] = useState(false)

  const [currentColor, setCurrentColor] = useState("#000000")
  const [isDefaultColor, setIsDefaultColor] = useState(true)
  const [customColor, setCustomColor] = useState("000000")
  const [recentColors, setRecentColors] = useState<string[]>(colors)
  const nativePickerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editor) return

    const syncColor = () => {
      const activeColor = editor.getAttributes("textStyle").color
      const hexColor = normalizeHex(activeColor ?? "")
      setCurrentColor(hexColor ?? "#000000")
      setIsDefaultColor(!hexColor)
    }

    syncColor()
    editor.on("selectionUpdate", syncColor)
    editor.on("transaction", syncColor)

    return () => {
      editor.off("selectionUpdate", syncColor)
      editor.off("transaction", syncColor)
    }
  }, [editor])

  const applyColor = useCallback(
    (nextColor: string) => {
      if (!editor) return

      const hexColor = normalizeHex(nextColor)
      if (!hexColor) return

      editor.chain().focus().setColor(hexColor).run()
      setIsDefaultColor(false)
      onColorChange?.(hexColor)
      setCustomColor(hexColor.slice(1))
      setRecentColors((prev) => {
        const next = [hexColor, ...prev.filter((item) => item !== hexColor)]
        return next.slice(0, 10)
      })
    },
    [editor, onColorChange]
  )

  const handleApplyDefaultColor = useCallback(() => {
    if (!editor) return

    editor.chain().focus().unsetColor().run()
    setIsDefaultColor(true)
    setCurrentColor("#000000")
    setCustomColor("000000")
    onColorChange?.("#000000")
  }, [editor, onColorChange])

  const handleCustomColorInput = useCallback((value: string) => {
    const sanitized = value.replace(/#/g, "").replace(/[^0-9a-fA-F]/g, "")
    setCustomColor(sanitized.slice(0, 6))
  }, [])

  const applyCustomHex = useCallback(() => {
    if (customColor.length !== 6) return
    applyColor(`#${customColor}`)
  }, [applyColor, customColor])

  const handleCustomPickerChange = useCallback((value: string) => {
    const hexColor = normalizeHex(value)
    if (!hexColor) return
    setCustomColor(hexColor.slice(1))
  }, [])

  const canSetColor = Boolean(editor?.isEditable)
  const customPreviewColor = customColor.length === 6 ? `#${customColor}` : "#000000"

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) {
        setCustomColor(currentColor.slice(1))
      }
    },
    [currentColor]
  )

  const paletteRows = DEFAULT_SWATCH_ROWS

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={!canSetColor}
          data-disabled={!canSetColor}
          aria-label="文字色"
          tooltip="文字色"
        >
          <ColorFillIcon
            className="tiptap-button-icon"
            fill={currentColor}
            data-icon="#sym:ColorFillIcon"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="text-color-popover" aria-label="文字色セレクター">
        <Card>
          <CardBody>
            <button
              type="button"
              className="text-color-popover__default"
              onClick={handleApplyDefaultColor}
              data-active={isDefaultColor}
            >
              <ColorFillIcon
                className="text-color-popover__default-icon"
                fill="#000000"
                data-icon="#sym:ColorFillIcon"
              />
              <span>デフォルト</span>
            </button>

            <div className="text-color-popover__palette">
              {paletteRows.map((row, rowIndex) => (
                <div key={`palette-row-${rowIndex}`} className="text-color-popover__swatches">
                  {row.map((color) => {
                    const hexColor = normalizeHex(color)
                    if (!hexColor) return null

                    const isActive = currentColor === hexColor
                    const shouldShowCheck = isActive

                    return (
                      <button
                        key={hexColor}
                        type="button"
                        className="text-color-popover__swatch"
                        aria-label={`色を選択 ${hexColor}`}
                        title={hexColor}
                        onClick={() => applyColor(hexColor)}
                        data-active={isActive}
                        style={{ backgroundColor: hexColor }}
                      >
                        {shouldShowCheck && <CheckIcon className="text-color-popover__check" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="text-color-popover__recent">
              <div className="text-color-popover__recent-title">最近使用</div>
              <div className="text-color-popover__recent-list">
                {recentColors.slice(0, 10).map((color) => {
                  const hexColor = normalizeHex(color)
                  if (!hexColor) return null

                  const isActive = currentColor === hexColor
                  return (
                    <button
                      key={`recent-${hexColor}`}
                      type="button"
                      className="text-color-popover__swatch text-color-popover__recent-swatch"
                      aria-label={`最近使った色を選択 ${hexColor}`}
                      title={hexColor}
                      onClick={() => applyColor(hexColor)}
                      data-active={isActive}
                      style={{ backgroundColor: hexColor }}
                    >
                      {isActive && <CheckIcon className="text-color-popover__check" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="text-color-popover__advanced">
              <label className="text-color-popover__label" htmlFor="text-color-custom-input">
                カスタムカラー
              </label>
              <div className="text-color-popover__custom-row">
                <Input
                  id="text-color-custom-input"
                  value={customColor}
                  placeholder="例: 1f2937"
                  onChange={(event) => handleCustomColorInput(event.target.value)}
                />
                <label
                  htmlFor="text-color-native-picker"
                  className="text-color-popover__picker-trigger"
                  aria-label="カスタムカラーを選択"
                  title={customPreviewColor}
                  style={{ backgroundColor: customPreviewColor }}
                >
                  <input
                    ref={nativePickerRef}
                    id="text-color-native-picker"
                    className="text-color-popover__native-picker"
                    type="color"
                    value={customPreviewColor}
                    onChange={(event) => handleCustomPickerChange(event.target.value)}
                    aria-label="カラーピッカー"
                  />
                  <span className="text-color-popover__picker-border" />
                </label>
              </div>
              <Button
                type="button"
                variant="primary"
                className="text-color-popover__apply"
                onClick={applyCustomHex}
              >
                適用
              </Button>
            </div>
          </CardBody>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
