/* eslint-env browser */

// @ts-ignore
import CodeMirror from 'codemirror'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CodemirrorBinding } from './js/y-codemirror'
import 'codemirror/mode/javascript/javascript.js'

window.addEventListener('load', () => {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(
    'wss://server.cocreate.app:8080/crdt',
   'eyJvcmciOiI1ZGUwMzg3YjEyZTIwMGVhNjMyMDRkNmMiLCJjb2xsZWN0aW9uIjoiYXBwbGVzIiwiZG9jdW1lbnRfaWQiOiI1ZmU5ZTBhMTFiNGE3MDNlNzFjNTFiYTgifQ==',
    ydoc
  )
  const yText = ydoc.getText('codemirror')
  const editorContainer = document.createElement('div')
  editorContainer.setAttribute('id', 'editor')
  document.body.insertBefore(editorContainer, null)

  const editor = CodeMirror(editorContainer, {
    mode: 'javascript',
    lineNumbers: true
  })

  const binding = new CodemirrorBinding(yText, editor, provider.awareness)

  // const connectBtn = /** @type {HTMLElement} */ (document.getElementById('y-connect-btn'))
  // connectBtn.addEventListener('click', () => {
  //   if (provider.shouldConnect) {
  //     provider.disconnect()
  //     connectBtn.textContent = 'Connect'
  //   } else {
  //     provider.connect()
  //     connectBtn.textContent = 'Disconnect'
  //   }
  // })

  // @ts-ignore
  window.example = { provider, ydoc, yText, binding, Y }
})