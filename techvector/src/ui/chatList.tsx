"use client";

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Chat( props :any ) {
  const chatRef = useRef<HTMLDivElement>(null);
  const messages = props.messages;
  if (!messages)
    return;

  const scrollToBottom = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  function getMessages(){
    console.log(messages);
  }


  return (
    <div>
      <button className='size-20' id = "cuc" onClick={getMessages}>Salut</button>
      {messages.length>0 && <div className="flex flex-col p-4 space-y-4 mb-25">
        {messages.map((msg:any, index:any) => (
          typeof msg === "string" ? 
          <div
            key={index}
            className={`max-w-2xl p-3 rounded-lg shadow-md ${(index - messages.slice(0, index).filter((o : any) => typeof o !== "string").length) % 2 === 0 ? 'bg-cyan-500 text-black self-end' : 'bg-gray-800 text-white self-start'}`}
          >
            {msg}
          </div>
          :
          <div className='flex flex-col p-4 space-y-4 self-start'> 
            <h2>Retrieved documents</h2>
            {msg.map((article : any, index : any) => 
                <Link href ={article[1]}>{index}. {article[0]}</Link>
            )}
          </div>
          ))}
        {messages.filter((o : any) => typeof o === "string").length % 2 == 1 && <Image src="/typing.gif" alt="Typing..." width={50} height={50} />}
      </div> }
      {messages.length>0 && <div ref={chatRef}/>}
    </div>
  );
}
