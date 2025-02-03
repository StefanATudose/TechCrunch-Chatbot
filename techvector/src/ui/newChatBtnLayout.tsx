"use client";

import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import Link from "next/link";
import Chat from "./chatList";

function ChatBtnLayout(){
    return(
    <Link href = "/chat" onClick={() => sessionStorage.removeItem("thread_id")} > 
        <IoChatbubbleEllipsesOutline className="inline size-16"/>
    </Link>
  );
}

export default ChatBtnLayout;