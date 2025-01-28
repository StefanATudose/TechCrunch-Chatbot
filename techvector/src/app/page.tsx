import Image from "next/image";
import Link from "next/link";
import ArticleList from "@/ui/articleList";
import Pagination from "@/ui/pagination";

const host = "localhost:8000"

export default async function Home(props: any) {
  const searchParams = await props.searchParams;
  const currentPage = Number(searchParams?.page) || 1;
  
  const response = await fetch(`http://${host}/get_article_pages`);
  if (response.status != 200)
    return <main>
            <h1> {response.headers}</h1>
            <h1> {response.json()}</h1>
          </main>
  const totalPages = await response.json();


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
        <Link href="/chat">Ask a General Question</Link>
      </div>

      <ArticleList pageNumber={currentPage}/>

      <Pagination totalPages = {totalPages} />

    </main>
  );
}
