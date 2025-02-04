"use client";

import Article from "@/lib/objects/article";
import { useState, useEffect } from "react";
import ArticleComponent from "./articleComponent";

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
      <div id = "articleList">
        {articles && articles.length > 0 && articles.map((article) => (
          <ArticleComponent key={article.url} article={article}/>
        ))}
      </div>
    );
  }

  export default ArticleList;