import Link from "next/link";

function FetchedArticles(props : any){
    
    const articles = props.articles;
    if (!articles)
        return

    return(
        <div> 
            {props.articles && props.articles.map((article : any, index : any) => 
                <Link href ={article[1]}>{index}. {article[0]}</Link>
            )}
        </div>
    )
}

export default FetchedArticles;