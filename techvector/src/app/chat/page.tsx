'use client';

import { useEffect, useState, useRef} from "react";
import Article from "../../lib/objects/article";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Cookies, useCookies } from "react-cookie";
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
  if (response.status != 200){
    cookies_instance.remove(thread_id);
    return null;
  }
  const data = await response.json();
  return data;
}



export default function Chat(props : any) {
    const [cookies, setCookie, removeCookie] = useCookies();
    const router = useSearchParams();
    const articleUrlParam = router.get("articleUrl");
    const articleUrl = articleUrlParam ? encodeURI(articleUrlParam) : null;
    const [article, setArticle] = useState<Article>();
    const [error, setError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<string[]>([])
    const [question, setQuestion] = useState<string>();
    const formRef = useRef<HTMLFormElement>(null);
    const [shouldSubmit, setShouldSubmit] = useState<Boolean>(false);
    const refreshTrigger = useRef(0);
    let fetched : any;

    useEffect(() => {
      try{
        if (articleUrl != null && typeof articleUrl === 'string')
            fetchArticle(articleUrl).then((data) => setArticle(data));
        thread_id_given = sessionStorage.getItem("thread_id") || "";
        sessionStorage.removeItem("thread_id");
        if (thread_id_given != ""){
          getPastChat(articleUrl ? "0" : "1", thread_id_given).then((data :any) =>{
            if (data)
            {
              setChatMessages(data);
              console.log(`Chat history received, data: ${data}`);
            }
              
            else
              setChatMessages(["The selected chat is corrupt and was removed"]);
          });
        }
        else{
          setChatMessages([]);
        }
          
      }
      catch (error){
        setError((error as any).message);
      } 
    }, [router, refreshTrigger.current]);

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
        refreshTrigger.current += 1;
      };
    
    
      return(
        <div className="basis-1/5 overflow-y-auto text-white p-4 rounded-2xl shadow-lg text-center">
          {history_list.reverse().map((cook, index) => (
            cook[0][0] === "general" ? (
              <div key={index} className={`mb-7 ${thread_id_given == cook[1] && "bg-gray-800 rounded-2xl"}`}>
                <Link 
                  href={`/chat`} 
                  shallow 
                  onClick={() => {attachThread(cook[1])}} 
                  className="text-cyan-400 hover:underline"
                >
                  {cook[0][1]}
                </Link>
              </div>
            ) : (
              <div key={index} className={`flex items-center space-x-3 mb-7 ${thread_id_given == cook[1] && "bg-gray-800 rounded-2xl"}`}>
                <Image 
                  src={cook[0][2]} 
                  alt="Chat Thumbnail" 
                  width={50} 
                  height={50} 
                  className="rounded-lg"
                />
                <Link 
                  href={`/chat?articleUrl=${encodeURIComponent(cook[0][3])}`} 
                  shallow 
                  onClick={() => attachThread(cook[1])} 
                  className="text-cyan-400 hover:underline"
                >
                  {cook[0][1]}
                </Link>
              </div>
            )
          ))}
        </div>
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

      try{
        var response = await fetch(request)
        var data: any = await response.json()
        const text_response = data[0].content;

        if (!articleUrl && data.length == 3){
          retrieved_articles_for_general = data[1][0];
          const seen = new Set();
          retrieved_articles_for_general = retrieved_articles_for_general.filter(([title, url]) => {
            const key = `${title}-${url}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true; 
          });
        }

        
        if (!thread_id_given){
          if (articleUrl)
            thread_id_given =  data[1];
          else
            if (data.length == 3)
              thread_id_given = data[2];
            else
              thread_id_given = data[1];
        }

        const currentCookie = cookies_instance.get(thread_id_given);
        if (!articleUrl){
          if (!currentCookie){
            setCookie(thread_id_given, ["general", question])    
          }
        }
        else{
          if (!currentCookie){
            setCookie(thread_id_given, ["url", article?.title, article?.img, articleUrl])   
          } 
        }
        if (retrieved_articles_for_general)
          setChatMessages((prevState) => [...prevState, retrieved_articles_for_general, text_response]);
        else
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
            <div className = {`overflow-y-scroll ${articleUrl ? "" : "flex-col items-center h-full justify-center"}`}>
              {articleUrl &&
                <div>
                  <ArticleComponentChat article = {article} />
                  {!question && chatMessages.length == 0 &&
                  <div className = "grid grid-cols-4 mx-50 my-5 gap-6">
                      {questions && <QuestionSuggestion question = {questions[0]} gridPosition = "col-span-2"/>}
                      {questions && <QuestionSuggestion question = {questions[1]} gridPosition = "col-span-2"/>}
                      {questions && <QuestionSuggestion question = {questions[2]} gridPosition = "col-span-2 col-start-2"/>}
                  </div>}
                </div> }
                
                {!articleUrl && !question && chatMessages.length == 0 && <div className="flex flex-col items-center h-full justify-center pb-20"> 
                  <h2 className = "text-6xl font-semibold mb-20">Ask a general question</h2>
                  <div className = "grid grid-cols-4 mx-50 my-5 gap-6">
                      <QuestionSuggestion question = "Is there something new about Elon Musk?" gridPosition = "col-span-2"/>
                      <QuestionSuggestion question = "Tell me something interesting from CES 2025" gridPosition = "col-span-2"/>
                      <QuestionSuggestion question = "Latest news about startups" gridPosition = "col-span-2 col-start-2"/>      
                  </div>
                </div>
                }

    
              <ChatList messages = {chatMessages} />
              <form ref = {formRef} action={handle_question1} className="bg-gray-900 p-4 rounded-2xl shadow-lg flex items-center space-x-4 absolute bottom-0 left-50 right-50">
                <textarea
                  placeholder="Ask something..."
                  className="flex-1 overflow-y-auto resize-none overflow-x-hidden bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={question}
                  onChange={(event)=>{setQuestion(event.target.value);}}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (event.shiftKey) {
                        // Shift + Enter should create a new line
                        event.preventDefault();
                        setQuestion((prev) => prev + "\n");
                      } else {
                        // Enter should submit the form
                        event.preventDefault();
                        handle_question1();
                      }
                    }
                  }}
                  required
                />
                <button
                  className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-cyan-600 disabled:bg-cyan-600 transition-shadow shadow-md hover:shadow-lg"
                  disabled = {chatMessages.filter((o : any) => typeof o === "string").length % 2 == 1}>
                  Ask
                </button>
              </form>
              
            </div>
          </div>
        </div>
    );
}