"use client";

import { useEffect, useRef } from 'react';
import Image from 'next/image';

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

  return (
    <div>
      <div className="flex flex-col p-4 space-y-4 mb-30">
        {messages.map((msg:any, index:any) => (
          <div
            key={index}
            className={`max-w-2xl p-3 rounded-lg shadow-md ${index % 2 === 0 ? 'bg-cyan-500 text-black self-end' : 'bg-gray-800 text-white self-start'}`}
          >
            {msg}
          </div>
          ))}
        {messages.length % 2 == 1 && <Image src="/typing.gif" alt="Typing..." width={50} height={50} />}
      </div>
      <div ref={chatRef}/>
    </div>
  );
}
