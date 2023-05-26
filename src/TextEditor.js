import { useCallback, useEffect, useState } from 'react';
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function TextEditor() {
  //to have the collaboration feature; to make sure we can access our socket from 
  //anywhere, we put it into state;  
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  
  //we are connecting with the server with io() and then when we are done with it
  //we're disconnecting with disconnect()
  useEffect(() => {
  const s = io("http://localhost:3001");
  setSocket(s)
  return () => {
    s.disconnect()
  }

  }, [])

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS} });
    setQuill(q);
  }, []);


  return (
    <div className='container' ref={wrapperRef}></div>
  )
}
