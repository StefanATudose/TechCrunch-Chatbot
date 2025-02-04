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

  const removeDupedArticles = (articleList : any) => {
    const seen = new Set();
    articleList = articleList.filter(([title, url]: [string, string]) => {
      const key = `${title}-${url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true; 
    });
    return articleList;
  }

  useEffect(() => {
    scrollToBottom()
    console.log(messages);
  }, [messages]);



  return (
    <div>
      {messages.length>0 && <div className="flex flex-col p-4 space-y-4 mb-25">
        {messages.map((msg:any, index:any) => (
          (typeof msg === "string") || (msg instanceof String) ? 
          <div
            key={index}
            className={`max-w-2xl p-3 rounded-lg shadow-md ${(index - messages.slice(0, index).filter((o : any) => typeof o !== "string").length) % 2 === 0 ? 'bg-cyan-500 text-black self-end' : 'bg-gray-800 text-white self-start'}`}
          >
            {msg}
          </div>
          :
          <div className="flex flex-col p-4 space-y-4 self-start bg-gray-900 text-white rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-cyan-400">Retrieved Articles</h2>
            {msg && removeDupedArticles(msg).map((article : any, index : any) => (
              <Link 
                key={index} 
                href={article[1]} 
                target="_blank" 
                className="text-cyan-400 hover:underline"
              >
                {index}. {article[0]}
              </Link>
          ))}
        </div>
          ))}
        {messages.filter((o : any) => typeof o === "string").length % 2 == 1 && <Image src="/typing.gif" alt="Typing..." width={50} height={50} />}
      </div> }
      {messages.length>0 && <div ref={chatRef}/>}
    </div>
  );
}
