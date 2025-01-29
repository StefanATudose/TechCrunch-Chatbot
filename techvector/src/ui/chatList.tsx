"use client"

function ChatList(props : any){

    console.log(`props messages : ${props.messages}`)
    return(
        <div> 
            {props.messages && props.messages.map((message : string, index : any) => 
                <h3>{message}</h3>
            )}
        </div>
    )
}

export default ChatList;