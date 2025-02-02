'use client';

import { useEffect, useState, useRef} from "react";
import Article from "../../lib/objects/article";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Cookies, useCookies } from "react-cookie";
import FetchedArticles from "@/ui/fetchedArticles";
import ChatList from "@/ui/chatList";
import ArticleComponentChat from "@/ui/articleComponentChat";
const host = "localhost:8000";
var thread_id_given : string;
var retrieved_articles_for_general : string[][];
const cookies_instance = new Cookies();

async function fetchArticle(articleUrl: string): Promise<Article> {
    const url = encodeURI(articleUrl);
    const target: string = `http://${host}/get_article/${url}`;
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
    <div className = "basis-1/5">
      {history_list.map((cook : any, index) => 
        cook[0][0] == "general" ?
          <div key = {index}>
            <Link href={`/chat`} shallow onClick={() => attachThread(cook[1])}>{cook[0][2]} </Link>
          </div>       
          :
          <div key = {index}>
            <Link href={`/chat?articleUrl=${encodeURIComponent(cook[0][3])}`} shallow onClick={() => attachThread(cook[1])}>{cook[0][1]} </Link>
            <Image src={cook[0][2]} alt = "@/public/placeholder_img" width={50} height={50}/>
          </div>        
        
      )}
    </div>
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
    const [question, setQuestion] = useState<string>();
    const formRef = useRef<HTMLFormElement>(null);
    const [shouldSubmit, setShouldSubmit] = useState<Boolean>(false);

    useEffect(() => {
      try{
        if (articleUrl != null && typeof articleUrl === 'string')
            fetchArticle(articleUrl).then((data) => setArticle(data));
        thread_id_given = sessionStorage.getItem("thread_id") || "";
        sessionStorage.removeItem("thread_id");
        if (thread_id_given != ""){
          getPastChat(articleUrl ? "0" : "1", thread_id_given).then((data :any) => setChatMessages(data))
          if (!articleUrl)
            console.log(`setting fetched articles state with the value of ${cookies_instance.get(thread_id_given)[1]}`);
            setFetchedArticles(cookies_instance.get(thread_id_given)[1]);
        }
          
      }
      catch (error){
        setError((error as any).message);
      } 
    }, [router]);

    useEffect(()=>{
      if (formRef.current && shouldSubmit){
        setShouldSubmit(false);
        formRef.current.requestSubmit();
        setQuestion("");
      }
    }, [question]);

    var questions;
    if (article)
      questions = article?.questions.split("&&&");

    function QuestionSuggestion(props : any){
      return (
        <button onClick = {() => {
          if (formRef.current){
            setQuestion(props.question);
            setShouldSubmit(true);
          }
          
        }} className = {`${props.gridPosition} bg-gray-700 text-white hover:bg-gray-600 p-5 rounded-lg font-medium transition-shadow shadow-md hover:shadow-lg`}>{props.question}</button>
      )
    }

    async function handle_question1(){
      if (!question) {
        return;
      }
      setChatMessages((prevState) => [...prevState, question]);
      handle_question2();
    }

    async function handle_question2(){
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
        console.log(`value of question before state: ${question}`);
        
        console.log(`value of chatmessages state: ${chatMessages}`);

      try{
        var response = await fetch(request)
        var data: any = await response.json()
        const text_response = data[0].content;

        if (!articleUrl && !thread_id_given){
          retrieved_articles_for_general = data[1][0];
          const seen = new Set();
          retrieved_articles_for_general = retrieved_articles_for_general.filter(([title, url]) => {
            const key = `${title}-${url}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true; 
          });
          setFetchedArticles(retrieved_articles_for_general);
        }

        
        if (!thread_id_given){
          thread_id_given = articleUrl ? data[1] : data[2];
        }

        const currentCookie = cookies_instance.get(thread_id_given);
        if (!articleUrl){
          if (!currentCookie){
            setCookie(thread_id_given, ["general", retrieved_articles_for_general, question])    
          }
        }
        else{
          if (!currentCookie){
            setCookie(thread_id_given, ["url", article?.title, article?.img, articleUrl])   
          } 
        }
        //setChatMessages([...chatMessages, question]);
        setChatMessages((prevState) => [...prevState, text_response]);
        setQuestion("");
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
        <div className="flex h-[88vh]">
          <ChatHistory />
          <div className="basis-4/5 flex relative flex-col">
            <div className = "overflow-y-scroll">
              {articleUrl ?
                <div>
                  <ArticleComponentChat article = {article} />
                  {!question && chatMessages.length == 0 &&
                  <div className = "grid grid-cols-4 mx-50 my-20 gap-10">
                      {questions && <QuestionSuggestion question = {questions[0]} gridPosition = "col-span-2"/>}
                      {questions && <QuestionSuggestion question = {questions[1]} gridPosition = "col-span-2"/>}
                      {questions && <QuestionSuggestion question = {questions[2]} gridPosition = "col-span-2 col-start-2"/>}
                  </div>}
                </div>
                :
                <div>
                  <h3>Is there something new about Elon Musk?</h3>
                  <h3>Tell me something interesting from CES 2025</h3>
                  <h3>Latest news about startups</h3>           
                </div> 
              }

              {!articleUrl && <FetchedArticles articles = {fetchedArticles}/>}
              <ChatList messages = {chatMessages} />
              <form ref = {formRef} action={handle_question1} className="bg-gray-900 p-4 rounded-2xl shadow-lg flex items-center space-x-4 absolute bottom-0 left-50 right-50">
                <input
                  type="text"
                  placeholder="Ask something..."
                  className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={question}
                  onChange={(event)=>{setQuestion(event.target.value);}}
                  required
                />
                <button
                  className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-cyan-600 disabled:bg-cyan-600 transition-shadow shadow-md hover:shadow-lg"
                  disabled = {chatMessages.length % 2 == 1}>
                  Ask
                </button>
              </form>
              
            </div>
          </div>
        </div>
    );
}