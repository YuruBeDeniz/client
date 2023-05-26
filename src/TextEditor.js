import { useCallback, useEffect, useState } from 'react';
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from 'react-router-dom';

const SAVE_INTERVAL_MS = 2000;

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

  const { id: documentId } = useParams();
  
  //we are connecting with the server with io() and then when we are done with it
  //we're disconnecting with disconnect()
  useEffect(() => {
  const s = io("http://localhost:3001");
  setSocket(s)
  return () => {
    s.disconnect()
  }
  }, []);

  //this useEffect is for detecting changes whenever quill changes
  //the source will determine whether a user or the actuall quill lib made these changes
  //so it is really imp that we make sure our user made these changes
  //we want to send these changes to server
  //then we need to remove the event listener if we no longer needed
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return
      socket.emit("send-changes", delta)
    }
    quill.on("text-change", handler)

    return () => {
      quill.off("text-change", handler)
    }
  }, [socket, quill]);

  //to receive the event:
  //instead of quill.on() we'll have socket.on() -->  socket.on("receive-changes") 
  //this is the event we set up on our server & we have a handler that'll take in 
  //the delta that we get from our receive-changes event
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = delta => {
      quill.updateContents(delta)
    }
    socket.on("receive-changes", handler)

    return () => {
      socket.off("receive-changes", handler)
    }
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", document => {
        quill.setContents(document);
        quill.enable();
    })

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  //to save data:
  useEffect(() => {
    if (socket == null || quill == null) return;
    const interval = setInterval(() => {
        socket.emit("save-document", quill.getContents())
    }, SAVE_INTERVAL_MS);

   return () => {
    clearInterval(interval);
   }

  }, [socket, quill])

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS} });
    
    q.disable();
    q.setText("Loading...")
    setQuill(q);
  }, []);


  return (
    <div className='container' ref={wrapperRef}></div>
  )
}
