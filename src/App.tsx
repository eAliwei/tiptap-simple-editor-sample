import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { useState } from 'react'
export default function App() {
  const content = `<div style="text-align:center"><strong><span style="font-size:18px">お客様のメールアドレス<br />カート情報を送信いたします</span></strong></div><br /><span style="font-size:14px">この後、ご検討商品のカート情報をお送りいたしますのでご確認ください。<br />※送信には数分かかる場合があります。</span>`

  const [editorContent, setEditorContent] = useState(content)
  return (<>
    <h3>Tiptap editor sample</h3>
    <textarea
      defaultValue={content}
      style={{ width: "100%", height: "200px", marginTop: "1rem" }}
      onChange={({ target }) => setEditorContent(target.value)}
    ></textarea>
    <SimpleEditor onChange={setEditorContent} content={editorContent} />
    <h3>Editor content</h3>
    <code>
      {editorContent}
    </code>
  </>
  )
}