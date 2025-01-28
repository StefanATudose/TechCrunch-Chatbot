"use client";

import Article from "@/lib/objects/article";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const host = "localhost:8000";

async function fetchArticles(pageNumber: number): Promise<Article[]> {
  const target: string = `http://${host}/get_articles/${pageNumber}`;
  console.log(`target: ${target}`);
  const response = await fetch(target);
  const data = await response.json();
  return data;
}

function ArticleList(props: any) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [error, setError] = useState<string | null>(null);
    const pageNumber = props.pageNumber;
    useEffect(() => {
      try{
        fetchArticles(pageNumber).then((data) => setArticles(data));
      }
      catch (error){
        setError((error as any).message);
      } 
    }, [pageNumber]);
    
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

  export default ArticleList;