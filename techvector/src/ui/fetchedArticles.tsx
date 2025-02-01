import Link from "next/link";

function FetchedArticles(props : any){
    
    console.log("rendered fetched articles");
    console.log(props.articles);

    return(
        <div> 
            {props.articles && props.articles.map((article : any, index : any) => 
                <Link href ={article[1]}>{index}. {article[0]}</Link>
            )}
        </div>
    )
}

export default FetchedArticles;