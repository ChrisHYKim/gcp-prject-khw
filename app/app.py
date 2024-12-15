from fastapi import FastAPI, Request
from fastapi.websockets import WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
# from fastapi.responses import HTMLResponse
import json
from fastapi.staticfiles import StaticFiles
import os

# FastAPI 생성
app = FastAPI(title="Cam Video Streaming")
templates = Jinja2Templates(directory= "templates")
app.mount("/static", StaticFiles(directory="static"), name="static")
active_user = {}

async def ws_send_to_recv(webSocket: WebSocket, msg_types:str, msg_data: dict):
    for connection in active_user.values():
        if connection != webSocket: 
            message = json.dumps({
                "type": msg_types,
                **msg_data
            })
            await connection.send_text(message)
@app.websocket("/ws")
async def websocket_endpoint(webSocket: WebSocket):
    await webSocket.accept()
    active_user[webSocket]=webSocket
    try:
        while True:
            data = await webSocket.receive_text()
            msg_Data = json.loads(data)  # 메시지 파싱

            if msg_Data["type"] == "offer":
                print("offer receive")
                await ws_send_to_recv(webSocket, "offer", {"sdp": msg_Data['sdp']})

            elif msg_Data["type"] == "answer":
                print("answer receive")
                await ws_send_to_recv(webSocket, 'answer', {"sdp": msg_Data['sdp']})
            elif msg_Data["type"] == "candidate":
                print("candidate receive")
                await ws_send_to_recv(webSocket, "candidate", {"candidate": msg_Data["candidate"]})
                
    except WebSocketDisconnect:
        print("연결 종료")
        # 연결 종료 시 active_user에서 제거
        active_user.pop(webSocket, None)  
        try:
            await webSocket.close()
        except RuntimeError:
            print('websocker closed')
       

# video/audio 페이지 로드
@app.get("/")
async def cam_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
