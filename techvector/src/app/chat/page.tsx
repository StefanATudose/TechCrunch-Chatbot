'use client';

import { useEffect, useRef, useState } from "react";
import Article from "../../lib/objects/article";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Cookies, useCookies } from "react-cookie";
const host = "localhost:8000";
var thread_id_given : string;

async function fetchArticle(articleUrl: string): Promise<Article> {
    const url = encodeURI(articleUrl);
    const target: string = `http://${host}/get_article/${url}`;
    console.log(`target: ${target}`);
    const response = await fetch(target);
    const data = await response.json();
    return data;
  }


export default function Chat() {
    const [cookies, setCookie, removeCookie] = useCookies();
    const router = useSearchParams();
    const articleUrlParam = router.get("articleUrl");
    const articleUrl = articleUrlParam ? encodeURI(articleUrlParam) : "";
    const [article, setArticle] = useState<Article>();
    const [error, setError] = useState<string | null>(null);
    
    const cookies_instance = new Cookies();

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
      console.log(thread_id_given)
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
        var response = await fetch(request)
        var data: any = await response.json()
        const text_response = data[0].content;
        if (!thread_id_given){
          thread_id_given = data[1];
        }
      
        
        console.log(error)
        const responseComponent = document.createElement("p");
        responseComponent.textContent = text_response;
        document.body.appendChild(responseComponent);
        
        https://stackoverflow.com/questions/61862672/instance-variable-reset-everytime-component-re-render-in-reactjs
        console.log(thread_id_given)
        const currentCookie = cookies_instance.get(thread_id_given);
        if (currentCookie){
          currentCookie.push(question);
          currentCookie.push(text_response);
          setCookie(thread_id_given, currentCookie);  
          console.log(thread_id_given)    
        }
        else
          setCookie(thread_id_given, [question, text_response])
        

      }
      catch (error){
        setError((error as any).message);
      } 
      
    }


    function getChatHistory(){
      const allCookies = cookies_instance.getAll()
      console.log(allCookies);
      // return ({
      //   allCookies.map((cookie: any)  => 
      //     cookie.get
      //   )
      // })
    }

    function getThread(){
      console.log(thread_id_given);
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
            <button onClick={getChatHistory}>History</button>
            <button onClick={getThread}>Thread</button>
        </div>
    );
}