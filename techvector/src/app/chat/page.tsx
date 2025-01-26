'use client';

import "react-chat-elements/dist/main.css"
import { MessageBox } from "react-chat-elements";
import { useEffect, useState } from "react";
import Article from "../../lib/objects/article";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
const host = "localhost:8000";

async function fetchArticle(articleUrl: string): Promise<Article> {
    const url = encodeURI(articleUrl);
    const target: string = `http://${host}/get_article/${url}`;
    console.log(`target: ${target}`);
    const response = await fetch(target);
    const data = await response.json();
    return data;
  }


export default function Chat() {
    const router = useSearchParams();
    const articleUrlParam = router.get("articleUrl");
    const articleUrl = articleUrlParam ? encodeURI(articleUrlParam) : "";
    const [article, setArticle] = useState<Article>();
    const [error, setError] = useState<string | null>(null);
    var thread_id_given: any;

    useEffect(() => {
      try{
        if (articleUrl != null && typeof articleUrl === 'string')
            fetchArticle(articleUrl).then((data) => setArticle(data));
      }
      catch (error){
        setError((error as any).message);
      } 
    }, []);

    const questions = article?.questions.split("&&&")

    async function handle_question(formData : any){
      
      console.log(1);
      const question = formData.get("question");

      if (!question) {
        return;
      }
      const responseComponent = document.createElement("p");
      responseComponent.textContent = question;
      document.body.appendChild(responseComponent);

      const request = new Request(`http://${host}/url_chatbot`, {
          method: "POST",
          headers: {
        'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: question, url: articleUrl, thread_id: thread_id_given ? thread_id_given : "" }),
        });


      try{
        //console.log(await request.json());
        console.log(3);
        var response = await fetch(request)
        console.log(response);
        var data: any = await response.json()
        console.log(data);
        
        const responsee = data[0].content;
        if (!thread_id_given)
          thread_id_given = data[1];
        
        console.log(error)
        const responseComponent = document.createElement("p");
        responseComponent.textContent = responsee;
        document.body.appendChild(responseComponent);
        console.log(5)
      }
      catch (error){
        setError((error as any).message);
      } 

      
      
    }

    if (error)
      return (
        <h1> {error} </h1>
      )

    return (
        <div>
            <div key={article?.url}>
                <h2>{article?.title}</h2>
                <p>{article?.summary}</p>
                <Image src={article?.img || "/placeholder_img.svg"} alt={article?.title || "[Article Title]"} width={200} height={200} />
                <span>{article?.time}, {article?.author}, {article?.category}</span>
                <Link href={article?.url || "https://techcrunch.com/"}>View on TechCrunch</Link>
            </div>
            <div>
                <h3>{questions && questions.length > 0 ? questions[0] : "Question 1"}</h3>
                <h3>{questions && questions.length > 0 ? questions[1] : "Question 2"}</h3>
                <h3>{questions && questions.length > 0 ? questions[2] : "Question 3"}</h3>
            </div>

            <form action={handle_question}>
                <input name="question" type = 'text'/>
                <button type="submit">Ask</button>
            </form>
        </div>
    );
}