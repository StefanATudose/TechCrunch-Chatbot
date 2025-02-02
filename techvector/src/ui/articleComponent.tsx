import Article from "@/lib/objects/article";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";


function ArticleComponent(props: any) {
    const article = props.article;
    

    return (
      <div key={article.url} className="bg-gray-900 text-white p-12 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 lg:flex items-center space-x-6">
      <div className="flex-1 mb-3 lg:mb-0">
        <h2 className="text-2xl font-bold mb-2 text-cyan-400">{article.title}</h2>
        <p className="text-gray-300 mb-4 text-2xl">{article.summary}</p>
        <div className="text-lg text-gray-400 mb-4">
          <span>{article.time} | {article.author} | {article.category}</span>
        </div>
        <div className="flex space-x-4">
          <Link href={article.url} className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-cyan-600 transition">
            View on TechCrunch
          </Link>
          <Link href={`/chat?articleUrl=${encodeURIComponent(article.url)}`} className="bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition">
            Ask a question
          </Link>
        </div>
      </div>
      <div className="w-5/6 lg:w-1/4 flex-shrink-0">
        <Image
          src={article.img}
          alt={article.title}
          width={400}
          height={300}
          className="rounded-lg"
        />
      </div>
    </div>
    );
  }

  export default ArticleComponent;