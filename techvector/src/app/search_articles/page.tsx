'use client'

import Link from "next/link";
import Image from "next/image";
import { createRoot } from "react-dom/client";

export default function SearchArticles(){

    const host = "localhost:8000";

    async function search_articles(formParams: any){
        var query = formParams.get("query");
        if (!query || query == "")
            return

        query = encodeURI(query);
        
        var response = await fetch(`http://${host}/get_articles_by_query/${query}`);
        if (response.status !== 200) {
            console.error('Failed to fetch articles');
            return;
        }

        response = await response.json();

        const element = document.getElementById("articlesContainer");
        if (element) {     
            element.remove();
        }

        const container = document.createElement("div");
        container.id = "articlesContainer";
        document.body.appendChild(container);

        const root = createRoot(container);
        root.render(<ArticleList articles = {response} />);
    }

    function ArticleList(props: any){
        const articles = props.articles;
        return(
            <div>
            {articles.map((article : any) => (
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
        )
    }

    return(
        <div>
            <form action = {search_articles}>
                <input type="text" name="query" />
                <button type='submit'> Search articles </button>
            </form>
        </div>
    )
}