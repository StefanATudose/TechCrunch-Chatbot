import Image from "next/image";
import Link from "next/link";
import ArticleList from "@/ui/articleList";
import Pagination from "@/ui/pagination";
import { Geostar } from "next/font/google";
import ScrollButton from "@/ui/scrollToArticleList";

const host = "localhost:8000"

const geostar = Geostar({
  weight: "400",
  subsets: ["latin"],
});


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

  const scrollToList = (ref : any) =>{
    if (ref && ref.current){
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }


  return (
    <main>
      <div className="h-[88vh] flex flex-col items-center justify-center space-y-4 pb-25">
        <h1 className={`text-9xl font-bold ${geostar.className}`}>TechVector</h1>
        <h2 className="text-4xl text-emerald-500">An easier way of staying up-to-date with the tech world,</h2>
        <p className="text-center text-xl text-gray-200 max-w-2xl">based on all TechCrunch articles posted in 2025, powered by OpenAI's gpt-4o-mini, stored in PGVector</p>
        <div className="flex space-x-4 mt-4">
          <Link className="px-4 py-2 bg-teal-800 text-white rounded-lg" href = "/search_articles">Seach Document</Link>
          <Link className="px-4 py-2 bg-teal-800 text-white rounded-lg" href="/chat">Ask a General Question</Link>
        </div>
        <ScrollButton />
      </div>

      <ArticleList pageNumber={currentPage}/>

      <Pagination totalPages = {totalPages} />

    </main>
  );
}
