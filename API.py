from fastapi import FastAPI
import psycopg2
from langchain.chains.query_constructor.schema import AttributeInfo
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain_openai import ChatOpenAI, OpenAIEmbeddings 
from langchain_postgres import PGVector
from typing import Dict, Tuple, Union, Annotated, List
from langchain_core.structured_query import (
    Comparator,
    Comparison,
    Operation,
    Operator,
    StructuredQuery,
    Visitor,
)
from langchain_core.tools import InjectedToolArg, tool
from langgraph.graph import MessagesState, StateGraph, END
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg import Connection
import uuid
from pydantic import BaseModel
from dotenv import load_dotenv
from urllib.parse import unquote
from langchain_core.documents import Document
from fastapi.middleware.cors import CORSMiddleware


#####Section 1: Global Framework Variables Definition



load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to specify allowed origins, e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # You can specify methods like ["GET", "POST"]
    allow_headers=["*"],  # You can specify allowed headers like ["Content-Type", "Authorization"]
)

@app.on_event('startup')
def initialization():
    llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name="my_docs2",
        connection="postgresql+psycopg://stefan:gigelfrone112@localhost:5432/techvector",
    )

    conn = psycopg2.connect("dbname=techvector user=stefan password=gigelfrone112 host=localhost port=5432")
    cursor = conn.cursor()

    db_url = "postgresql://stefan:gigelfrone112@localhost:5432/techvector"
    app.postgresCheckpointer = PostgresSaver(Connection.connect(db_url))
    #postgresCheckpointer.setup()  #first time call only

items_per_page = 10       # for main page pagination

#####Section 2: Building the document retriever for get_articles_by_query_api

def replace_date_objects(data):
    """
    Recursively traverses the JSON object and replaces every dictionary
    containing 'date' and 'type' keys with the value of the 'date' key.

    :param data: JSON object (dict, list, or other types)
    :return: Updated JSON object
    """

    if isinstance(data, dict):
        # Check if the current dictionary is the one to replace
        if "date" in data and "type" in data:
            return data["date"]
        
        # Otherwise, process each key-value pair
        return {key: replace_date_objects(value) for key, value in data.items()}

    elif isinstance(data, list):
        # Process each element in the list
        return [replace_date_objects(item) for item in data]

    # Return the data as is for other types
    return data


class CustomTranslator(Visitor):
    """Translate `PGVector` internal query language elements to valid filters."""

    """Subset of allowed logical operators and comparators."""
    allowed_operators = [Operator.AND, Operator.OR]
    allowed_comparators = [
        Comparator.EQ,
        Comparator.NE,
        Comparator.GT,
        Comparator.LT,
        Comparator.IN,
        Comparator.NIN,
        Comparator.CONTAIN,
        Comparator.LIKE,
    ]

    #Unchanged from official PGTranslator implementation
    def _format_func(self, func: Union[Operator, Comparator]) -> str:
        self._validate_func(func)
        return f"${func.value}"

    #Unchanged from official PGTranslator implementation
    def visit_operation(self, operation: Operation) -> Dict:
        args = [arg.accept(self) for arg in operation.arguments]
        return {self._format_func(operation.operator): args}


    #Unchanged from official PGTranslator implementation
    def visit_comparison(self, comparison: Comparison) -> Dict:
        return {
            comparison.attribute: {
                self._format_func(comparison.comparator): comparison.value
            }
        }


    def visit_structured_query(
        self, structured_query: StructuredQuery
    ) -> Tuple[str, dict]:
        if structured_query.filter is None:
            kwargs = {}
        else:
            kwargs = {"filter": structured_query.filter.accept(self)}
            
            #Reformatted "data" fields to be compatible with the Documents' metadata
            kwargs = replace_date_objects(kwargs)
        return structured_query.query, kwargs


metadata_field_info = [
    AttributeInfo(
        name="title",
        description="The title that the article was published under",
        type="string",
    ),
    AttributeInfo(
        name="author",
        description="The name of the author of the article",
        type="string",
    ),
    AttributeInfo(
        name="date",
        description="The date that the article was published on, in the format 'YYYY-MM-DD'. If the month is given by its name, it is converted to its number.",
        type="string",
    ),
    AttributeInfo(
        name="category",
        description="The category that the article belongs to. One of ['AI', 'Apps', 'Biotech & Health', 'Climate', 'Commerce', 'Crypto', 'Enterprise', 'Fintech', 'Fundraising', 'Gadgets', 'Gaming', 'Government & Policy', 'Hardware', 'Media & Entertainment', 'Privacy', 'Robotics', 'Security', 'Social', 'Space', 'Startups', 'Transportation', 'Venture']",
        type="string",
    ),
    AttributeInfo(
        name="url",
        description="The URL to the original TechCrunch article",
        type="link",
    )
]
document_content_description = "The article content"


retriever = SelfQueryRetriever.from_llm(
    llm,
    vector_store,
    document_content_description,
    metadata_field_info,
    structured_query_translator=CustomTranslator(),
)

#####Section 3: Building the general_chatbot


class StateWithArtifacts(MessagesState):
    artifacts: List[Tuple[str, str]]


@tool(response_format="content_and_artifact")
def retrieve(query: str):
    """Retrieve information related to a query."""
    retrieved_docs = vector_store.similarity_search(query, k=3)
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
        for doc in retrieved_docs
    )
    retrieved_docs = [(doc.metadata['title'], doc.metadata['url']) for doc in retrieved_docs]
    return serialized, retrieved_docs


def query_or_respond(state: StateWithArtifacts):
    """Generate tool call for retrieval or respond."""
    llm_with_tools = llm.bind_tools([retrieve])
    response = llm_with_tools.invoke(state["messages"])
    # MessagesState appends messages to state instead of overwriting
    return {"messages": [response]}


tools = ToolNode([retrieve])


def generate(state: StateWithArtifacts):
    """Generate answer."""
    # Get generated ToolMessages
    recent_tool_messages = []
    for message in reversed(state["messages"]):
        if message.type == "tool":
            recent_tool_messages.append(message)
        else:
            break
    tool_messages = recent_tool_messages[::-1]

    artifacts = [message.artifact for message in tool_messages if message.artifact]

    # Format into prompt
    docs_content = "\n\n".join(doc.content for doc in tool_messages)
    system_message_content = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer based on the retrieved context,"
        "say that the context doesn't contain the answer, but nevertheless try to provide an"
        "explanation based on your pre-trained knowledge. If you still don't know,"
        "say that you don't know. Use three sentences maximum and keep the "
        "answer concise.It is ABSOLUTELY NECESSARY to mention that the retrieved context does not contain the answer if it does not."
        "\n\n"
        f"{docs_content}"
    )
    conversation_messages = [
        message
        for message in state["messages"]
        if message.type in ("human", "system")
        or (message.type == "ai" and not message.tool_calls)
    ]
    prompt = [SystemMessage(system_message_content)] + conversation_messages

    response = llm.invoke(prompt)
    return {"messages": [response], "artifacts": artifacts}


graph_builder = StateGraph(StateWithArtifacts)
graph_builder.add_node(query_or_respond)
graph_builder.add_node(tools)
graph_builder.add_node(generate)

graph_builder.set_entry_point("query_or_respond")
graph_builder.add_conditional_edges(
    "query_or_respond",
    tools_condition,
    {END: END, "tools": "tools"},
)
graph_builder.add_edge("tools", "generate")
graph_builder.add_edge("generate", END)



graph = graph_builder.compile(checkpointer=app.postgresCheckpointer)


##### Section 4: Building the url_chatbot


class CustomState(MessagesState):
    url: str


@tool
def retrieve_by_url(query: str, url: Annotated[str, InjectedToolArg]) -> Tuple[str, list]:
    """Retrieve information related to a query, only fetching documents with a specific URL."""
    retrieved_docs = vector_store.similarity_search(query, k=2, filter={"url": {'$eq': url}})
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
        for doc in retrieved_docs
    )

    return serialized


def query_or_respond_custom(state: CustomState):
    """Generate tool call for retrieval or respond."""
    llm_with_tools = llm.bind_tools([retrieve_by_url])
    response = llm_with_tools.invoke(state["messages"])

    for call in response.tool_calls:
        call["args"]["url"] = state['url']

    return {"messages": [response]}


tools_by_url = ToolNode([retrieve_by_url])


def generate_custom(state: CustomState):
    """Generate answer."""

    # Get generated ToolMessages
    recent_tool_messages = []
    for message in reversed(state["messages"]):
        if message.type == "tool":
            recent_tool_messages.append(message)
        else:
            break
    tool_messages = recent_tool_messages[::-1]

    # Format into prompt
    docs_content = "\n\n".join(doc.content for doc in tool_messages)
    system_message_content = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer based on the retrieved context,"
        "PLEASE EXPLICITLY SAY that the context doesn't contain the answer, but nevertheless try to provide an"
        "explanation based on your pre-trained knowledge. If you still don't know,"
        "say that you don't know. Use three sentences maximum and keep the "
        "answer concise. It is ABSOLUTELY NECESSARY to mention that the retrieved context does not contain the answer if it does not."
        "\n\n"
        f"{docs_content}"
    )
    conversation_messages = [
        message
        for message in state["messages"]
        if message.type in ("human", "system")
        or (message.type == "ai" and not message.tool_calls)
    ]
    prompt = [SystemMessage(system_message_content)] + conversation_messages

    # Run
    response = llm.invoke(prompt)
    return {"messages": [response]}


workflow = StateGraph(CustomState)

workflow.add_node(tools_by_url)
workflow.add_node(query_or_respond_custom)
workflow.add_node(generate_custom)

workflow.set_entry_point("query_or_respond_custom")
workflow.add_edge("tools", "generate_custom")

workflow.add_conditional_edges(
    "query_or_respond_custom",
    tools_condition,
    {END: END, "tools": "tools"},
)

workflow.add_edge("generate_custom", END)


url_graph = workflow.compile(checkpointer=app.postgresCheckpointer)

##### Section 5: Defining the API endpoints

class chatbot_data(BaseModel):
    query: str
    thread_id: str = ""


@app.post("/general_chatbot")
async def general_chatbot(chatbot_data: chatbot_data):
    query = chatbot_data.query
    thread_id = chatbot_data.thread_id

    if thread_id == "":
        thread_id = str(uuid.uuid4())

    input_message = query
    config = {"configurable": {"thread_id": thread_id}}

    ans = graph.invoke({"messages": [{"role": "user", "content": input_message}]} ,config=config,)

    return ans["messages"][-1], ans["artifacts"], thread_id


class Url_chatbot_data(BaseModel):
    query: str
    url: str
    thread_id: str = ""

import logging
LOG = logging.getLogger(__name__)

@app.post("/url_chatbot")
async def url_chatbot(url_chatbot_data: Url_chatbot_data):
    LOG.info("API is starting up")
    query = url_chatbot_data.query
    url = url_chatbot_data.url
    thread_id = url_chatbot_data.thread_id

    if thread_id == "":
        thread_id = str(uuid.uuid4())

    input_message = query
    config = {"configurable": {"thread_id": thread_id}}

    ans = graph.invoke({"messages": [{"role": "user", "content": input_message}], "url": url}, config=config)
    
    return ans["messages"][-1], thread_id



@app.get("/get_articles_by_query/{query}")
async def get_articles_by_query(query: str):
    query = unquote(query)
    query = query.replace("'", "\'")
    query = query.replace("’", "\'")
    docs = retriever.invoke(query)
    urls = list(set([doc.metadata["url"] for doc in docs]))
    cursor.execute("SELECT * FROM article WHERE link = ANY(%s);", (urls,))
    tuples = cursor.fetchall()
    result_dict = [dict(zip(['url', 'title', 'img', 'category', 'summary', 'questions', 'author', 'time'], tup)) for tup in tuples]
    return result_dict 


@app.get("/get_articles/{pageNumber}")
async def get_articles(pageNumber: int):
    cursor.execute(f"SELECT * FROM article order by date desc limit {items_per_page} offset {10*(pageNumber-1)};") 
    tuples = cursor.fetchall()
    result_dict = [dict(zip(['url', 'title', 'img', 'category', 'summary', 'questions', 'author', 'time'], tup)) for tup in tuples]
    return result_dict 


@app.get("/get_article/{url:path}")
async def get_article(url: str):
    url = unquote(url)
    cursor.execute(f"SELECT * FROM article where link = '{url}';")
    tuples = cursor.fetchone()
    if tuples is None:
        return None
    result_dict = dict(zip(['url', 'title', 'img', 'category', 'summary', 'questions', 'author', 'time'], tuples))
    return result_dict


@app.get("/get_article_pages")
async def get_article_pages():
    cursor.execute(f"SELECT * FROM article;")
    total_pages = (cursor.rowcount + items_per_page - 1) // items_per_page
    return total_pages


@app.get("/conversation_history/{type}/{thread_id}")
async def conversation_history(type : str, thread_id: str):
    LOG.info(type, thread_id)
    print(type, thread_id)
    if type == "0":
        snapshot = url_graph.get_state({"configurable": {"thread_id": thread_id}})
    elif type == "1":
        snapshot = graph.get_state({"configurable": {"thread_id": thread_id}})
    else:
        return

    # result = []
    # for item in dir(snapshot):
    #     attr = getattr(snapshot, item)
    #     if callable(attr):
    #         result.append(f"{item}: Method")
    #     else:
    #         result.append(f"{item}: Attribute")

    

    messages = snapshot.values["messages"]
    
    conversation_messages = [
        message.content
        for message in messages
        if message.type in ("human", "system")
        or (message.type == "ai" and not message.tool_calls)
    ]

    return conversation_messages
