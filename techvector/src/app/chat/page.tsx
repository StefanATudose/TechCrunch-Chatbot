'use client';

import { useEffect, useState } from "react";
import Article from "../../lib/objects/article";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Cookies, useCookies } from "react-cookie";
import FetchedArticles from "@/ui/fetchedArticles";
import ChatList from "@/ui/chatList";
const host = "localhost:8000";
var thread_id_given : string;
var retrieved_articles_for_general : [[string]];
const cookies_instance = new Cookies();

async function fetchArticle(articleUrl: string): Promise<Article> {
    const url = encodeURI(articleUrl);
    const target: string = `http://${host}/get_article/${url}`;
    console.log(`target: ${target}`);
    const response = await fetch(target);
    const data = await response.json();
    return data;
}

async function getPastChat(type: "0"|"1", thread_id: string){
  const target: string = `http://${host}/conversation_history/${type}/${thread_id}`;
  const response = await fetch(target);
    const data = await response.json();
    return data;
}

function ChatHistory(){
  const allCookies = cookies_instance.getAll();
  const history_list = []
  for (let cookie in allCookies){
    if (/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(cookie)){
        history_list.push([allCookies[cookie], cookie]);
    }
  }

  const attachThread = (thread : string) => {
    sessionStorage.setItem("thread_id", thread);
  };

  return(
    history_list.map((cook : any, index) => 
      cook[0] == "general" ?
        <div key = {index}>
          <Link href={`/chat`} shallow onClick={() => attachThread(cook[1])}>{cook[0][2]} </Link>
        </div>       
        :
        <div key = {index}>
          <Link href={`/chat?articleUrl=${encodeURIComponent(cook[0][3])}`} shallow onClick={() => attachThread(cook[1])}>{cook[0][1]} </Link>
          <Image src={cook[0][2]} alt = "@/public/placeholder_img" width={50} height={50}/>
        </div>        
      
    )
  )
}


export default function Chat(props : any) {
    const [cookies, setCookie, removeCookie] = useCookies();
    const router = useSearchParams();
    const articleUrlParam = router.get("articleUrl");
    const articleUrl = articleUrlParam ? encodeURI(articleUrlParam) : null;
    const [article, setArticle] = useState<Article>();
    const [error, setError] = useState<string | null>(null);
    const [fetchedArticles, setFetchedArticles] = useState <{}> ()
    const [chatMessages, setChatMessages] = useState<string[]>([])
    

    useEffect(() => {
      try{
        if (articleUrl != null && typeof articleUrl === 'string')
            fetchArticle(articleUrl).then((data) => setArticle(data));
        thread_id_given = sessionStorage.getItem("thread_id") || "";
        sessionStorage.removeItem("thread_id");
        if (thread_id_given != ""){
          getPastChat(articleUrl ? "0" : "1", thread_id_given).then((data :any) => setChatMessages(data))
        }
          
      }
      catch (error){
        setError((error as any).message);
      } 
    }, [router]);

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

        if (!articleUrl && !thread_id_given){
          setFetchedArticles(retrieved_articles_for_general);
        }
      
      
        console.log(error)
        
        if (!thread_id_given){
          thread_id_given = articleUrl ? data[1] : data[2];
        }
        
        console.log(thread_id_given)
        const currentCookie = cookies_instance.get(thread_id_given);
        if (!articleUrl){
          if (!currentCookie){
            setCookie(thread_id_given, ["general", retrieved_articles_for_general, question, articleUrl])    
          }
        }
        else{
          if (!currentCookie){
            setCookie(thread_id_given, ["url", article?.title, article?.img, articleUrl])   
          } 
        }
        
        setChatMessages([...chatMessages, question, text_response])
        
        console.log(`chatMessages: ${chatMessages}`);

      }
      catch (error){
        setError((error as any).message);
      } 
      
    }


    function getChatHistory(){
      const allCookies = cookies_instance.getAll()
      console.log(allCookies);
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
          <ChatHistory />

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

          {articleUrl && <FetchedArticles articles = {fetchedArticles}/>}
          <ChatList messages = {chatMessages} />
          
        </div>
    );
}