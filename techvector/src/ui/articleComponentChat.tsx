import Article from "@/lib/objects/article";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";




function ArticleComponentChat(props: any) {
    const article = props.article;
    if (!article)
        return;

    article.time = article.time.split("T").join(", ");

    return (
      <div key={article.url} className="text-white p-12 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 lg:flex items-center space-x-6">
      <div className="flex-1 mb-3 lg:mb-0">
        <h2 className="text-2xl font-bold mb-2 text-cyan-400">{article.title}</h2>
        <p className="text-gray-300 mb-4 text-2xl">{article.summary}</p>
      </div>
      <div className="flex flex-col flex-shrink-0 justify-center">
        <Image
          src={article.img}
          alt={article.title}
          width={400}
          height={300}
          className="rounded-lg max-h-[20vh] w-auto object-contain"
        />
        <div className="text-lg text-gray-400 my-4">
          <span>{article.time} | {article.author} | {article.category}</span>
        </div>
        <Link href={article.url} target="_blank" className="text-center bg-cyan-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-cyan-600 transition">
            View on TechCrunch
        </Link>
      </div>
    </div>
    );
  }

  export default ArticleComponentChat;