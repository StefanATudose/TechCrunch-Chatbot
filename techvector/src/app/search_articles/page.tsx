'use client'

import Link from "next/link";
import Image from "next/image";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import Article from "@/lib/objects/article";
import ArticleList from "@/ui/articleList";
import ArticleComponent from "@/ui/articleComponent";

export default function SearchArticles(){
    const [query, setQuery] = useState<string>();
    const [articles, setArticles] = useState<Article[]> ();
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<boolean>(false);
    const host = "localhost:8000";

    function interstitial(){
        setLoading(true);
        setArticles([]);
        setFetchError(false);
        search_articles();
    }

    async function search_articles(){

        console.log("here");
        if (!query || query == "")
            return

        const encoded_query = encodeURI(query);
        
        try{
          var response = await fetch(`http://${host}/get_articles_by_query/${encoded_query}`);
          const data = await response.json();
          if (data)
              setArticles(data);     
          setLoading(false);
          console.log(data);  
        }  
        catch {
            console.log("res status faultyu");
            setFetchError(true);
            setLoading(false);
            return;
        }

         
    }

    return(
        <div className="flex flex-col items-center">
            <h2 className = "text-6xl font-semibold">Search for an article</h2>
            <form action={interstitial} className="bg-gray-900 p-4 rounded-2xl shadow-lg flex items-center space-x-4 w-[60%] my-20">
                <textarea
                  placeholder="Ex: Give me an article about Amazon posted on 10 January"
                  className="flex-1 overflow-y-auto resize-none overflow-x-hidden bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={query}
                  onChange={(event)=>{setQuery(event.target.value);}}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (event.shiftKey) {
                        // Shift + Enter should create a new line
                        event.preventDefault();
                        setQuery((prev) => prev + "\n");
                      } else {
                        // Enter should submit the form
                        event.preventDefault();
                        interstitial();
                      }
                    }
                  }}
                  required
                />
                <button
                  className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-cyan-600 disabled:bg-cyan-600 transition-shadow shadow-md hover:shadow-lg"
                  disabled = {loading}>
                  Ask
                </button>
            </form>
            {loading && <Image src = "/loading.gif" alt = "Loading..." width={200} height={200} />}
            {articles?.map((article : any, idx: any) => (
                <ArticleComponent key = {idx} article = {article} />
            ))}
            {fetchError && 
            <div className="bg-red-600 text-black flex flex-col space-y-2 p-4 rounded-2xl shadow-lg text-center">
              <h1 className="text-xl font-bold">Model Error</h1>
              <p className="text-md">The query was too complex and couldn't be processed at this time. It might work later.</p>
              <p className="text-md">This is because for this demo, I used the cheapest model from OpenAI, gpt-4o-mini (due to budget constraints).</p>
              <p className="text-md">Using gpt-4o would solve this error, but that costs 15 times more, and nobody got money for that.</p>
            </div>
            }
        </div>
    )
}