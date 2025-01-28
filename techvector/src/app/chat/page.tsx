'use client';

import { useEffect, useRef, useState } from "react";
import Article from "../../lib/objects/article";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Cookies, useCookies } from "react-cookie";
const host = "localhost:8000";
var thread_id_given : string;
var retrieved_articles_for_general : [[string]];


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
    const articleUrl = articleUrlParam ? encodeURI(articleUrlParam) : null;
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

    var questions;
    if (article)
      questions = article?.questions.split("&&&");


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

      const request = articleUrl ? new Request(`http://${host}/url_chatbot`, {
          method: "POST",
          headers: {
        'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: question, url: articleUrl, thread_id: thread_id_given ? thread_id_given : "" }),
        }) 
        :
        new Request(`http://${host}/general_chatbot`, {
          method: "POST",
          headers: {
        'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: question, thread_id: thread_id_given ? thread_id_given : "" }),
        });


      try{
        //console.log(await request.json());
        var response = await fetch(request)
        var data: any = await response.json()
        const text_response = data[0].content;

        var retrieved_articles_for_general = data[1][0]

        if (!thread_id_given){
          const retrieved_articles_dom = document.createElement("div");
          for (let current_article of retrieved_articles_for_general){
            const retrieved = document.createElement("a");
            retrieved.textContent = current_article[0];
            retrieved.href = current_article[1];
            retrieved_articles_dom.appendChild(retrieved);
          }
          document.body.appendChild(retrieved_articles_dom); 
        }
      
      
        console.log(error)
        
        
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
          setCookie(thread_id_given, [retrieved_articles_for_general, question, text_response])


        const responseComponent = document.createElement("p");
        responseComponent.textContent = text_response;
        document.body.appendChild(responseComponent);

        if (!thread_id_given){
          thread_id_given = articleUrl ? data[1] : data[2];
        }

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
          {articleUrl ?
            <div>
              <div key={article?.url}>
                  <h2>{article?.title}</h2>
                  <p>{article?.summary}</p>
                  <Image src={article?.img || "/placeholder_img.svg"} alt={article?.title || "[Article Title]"} width={200} height={200} />
                  <span>{article?.time}, {article?.author}, {article?.category}</span>
                  <Link href={article?.url || "https://techcrunch.com/"}>View on TechCrunch</Link>
              </div>
              <div>
                  {questions && questions.length > 0 && <h3>{questions[0]}</h3>}
                  {questions && questions.length > 0 && <h3>{questions[1]}</h3>}
                  {questions && questions.length > 0 && <h3>{questions[2]}</h3>}
              </div>
            </div>
            :
            <div>
              <h3>Is there something new about Elon Musk?</h3>
              <h3>Tell me something interesting from CES 2025</h3>
              <h3>Latest news about startups</h3>           
            </div> 
          }
            <form action={handle_question}>
                <input name="question" type = 'text'/>
                <button type="submit">Ask</button>
            </form>
            <button onClick={getChatHistory}>History</button>
            <button onClick={getThread}>Thread</button>
        </div>
    );
}