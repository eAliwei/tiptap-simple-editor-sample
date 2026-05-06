import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { generateJSON } from '@tiptap/core'
import { useState } from 'react'
import Bold from '@tiptap/extension-bold'
// Option 2: Browser-only (lightweight)
// import { generateJSON } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
export default function App() {


  const content = `<div style="text-align:center"><strong><span style="font-size:18px">お客様のメールアドレス<br />カート情報を送信いたします</span></strong></div><br /><span style="font-size:14px">この後、ご検討商品のカート情報をお送りいたしますのでご確認ください。<br />※送信には数分かかる場合があります。</span>`
  const json = generateJSON(content, [Document, Paragraph, Text, Bold])

  console.log("Generated JSON:", json)
  const [editorContent, setEditorContent] = useState(content)
  return (<><SimpleEditor onChange={setEditorContent} content={content} />

    <textarea
      value={editorContent}
      readOnly
      style={{ width: "100%", height: "200px", marginTop: "1rem" }}
    ></textarea>
  </>
  )
}