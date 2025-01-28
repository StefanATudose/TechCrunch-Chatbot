from fastapi.testclient import TestClient
from API import app, conversation_history

# client = TestClient(app)

#print(type(app))

# def test_read_API():
#     response = client.get("/conversation_history/0/155")
#     assert response.status_code == 200



# import asyncio

# async def main():
#     salut = await conversation_history("0", "155")
#     print(salut)

# asyncio.run(main())

class A:
    a = 5

x = A()

class A:
    a = 7

print(x.a)