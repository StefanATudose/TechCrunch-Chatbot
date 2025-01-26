"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Article from "../lib/objects/article";

const host = "localhost:8000";

async function fetchArticles(pageNumber: number): Promise<Article[]> {
  const target: string = `http://${host}/get_articles/${pageNumber}`;
  console.log(`target: ${target}`);
  const response = await fetch(target);
  const data = await response.json();
  return data;
}



function ArticleList(props: {pageNumber: number}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    try{
      fetchArticles(props.pageNumber).then((data) => setArticles(data));
    }
    catch (error){
      setError((error as any).message);
    } 
  }, []);
  
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      {articles.map((article) => (
        <div key={article.url}>
          <h2>{article.title}</h2>
          <p>{article.summary}</p>
          <Image src={article.img} alt={article.title} width={200} height={200} />
          <span>{article.time}, {article.author}, {article.category}</span>
          <Link href={article.url}>View on TechCrunch</Link>
          <Link href={`/chat?articleUrl=${encodeURIComponent(article.url)}`}>Ask a question</Link>
        </div>
      ))}
    </div>
  );
}


export default function Home() {


  return (
    <main>
      <header>
        <Image src="/TV_logo.png" alt="TechVector" width={200} height={200} />
        <Link href = "">Conversation List</Link>
      </header>
      <div>
        <h1>TechVector</h1>
        <h2>An easier way of staying up-to-date with the tech world.</h2>
        <p>based on all TechCrunch article posted in 2025, powered by OpenAI's gpt-4o-mini, stored in PGVector</p>

        <Link href = "/search_articles">Seach Document</Link>
        <Link href="">Ask a General Question</Link>
      </div>

      <ArticleList pageNumber={0}/>

    </main>
  );
}
