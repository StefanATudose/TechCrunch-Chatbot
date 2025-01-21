import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Article{
  url: string;
  title: string;
  time: string;
  img: string;
  category: string;
  summary: string;
  questions: string;
  author: string;
}

const url = "localhost:8000";

async function fetchArticles(): Promise<Article[]> {
  const response = await fetch(`{url}/get_articles`);
  const data = await response.json();
  return data;
}


function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  useEffect(() => {
    fetchArticles().then((data) => setArticles(data));
  }, []);

  return (
    <div>
      {articles.map((article) => (
        <div key={article.url}>
          <h2>{article.title}</h2>
          <p>{article.summary}</p>
          <Image src={article.img} alt={article.title} width={200} height={200} />
          <span>{article.time}, {article.author}, {article.category}</span>
          <Link href={article.url}>View on TechCrunch</Link>
          <Link href="">Ask a question</Link>
        </div>
      ))}
    </div>
  );
}


export default function Home() {


  return (
    <main>
      <header>
        <Image src="/public/TV_logo.png" alt="TechVector" width={200} height={200} />
        <Link href = "">Conversation List</Link>
      </header>
      <div>
        <h1>TechVector</h1>
        <h2>An easier way of staying up-to-date with the tech world.</h2>
        <p>based on all TechCrunch article posted in 2025, powered by OpenAI's gpt-4o-mini, stored in PGVector</p>

        <Link href = "">Seach Document</Link>
        <Link href="">Ask a General Question</Link>

      </div>
    </main>
  );
}
