// websocker client 생성 (24.12.14)
const ws = new WebSocket('ws://localhost:8000/ws');
// 화면 공유 버튼
let exit_Btn = document.getElementById("off_view");
// Local View
let localView = document.getElementById("local-view");
let remoteView = document.getElementById("remote-view");
const iceServer = [
  {
    urls: ['stun:stun.l.google.com:19302']
  }
];
let pc1 = new RTCPeerConnection({iceServers: iceServer});

// video stream 가져온다.
function camStream(stream){
    try {
  
        localView.srcObject = stream;
        localView.play();
        localView.volume =0;
        stream.getTracks().forEach(tracks=>{
          pc1.addTrack(tracks,stream);
        });

        return navigator.mediaDevices.enumerateDevices();
    } catch (error) {
        console.log("errors" , error.message, error.name)
    }
}

async function getCamera(){
    try {
        let stream = (await navigator.mediaDevices.getUserMedia({video: true, audio: true}))
        camStream(stream);
        createOffer();
    } catch (error) {
        console.log(error);
    }
}
// Camera Start
function start(){
  getCamera();
}


ws.addEventListener("open", (evt)=>{
    // audioIn , videoselect -> video track, audio track 생성
    start();
 
});

pc1.onicecandidate =(evt)=>{
  if (evt.candidate) {
    // ICE Message
    ws.send(JSON.stringify({
        type: "candidate",
        candidate: evt.candidate
    }));
  }
};
// 원격 스트림을 수신하면, remoteView에 표시
pc1.ontrack = (event) => {
  try {
    remoteView.srcObject = event.stream[0];
    remoteView.play();
  } catch (error) {
    console.log(error);
  }
};

async function createOffer(){
  try {
    const offer = pc1.createOffer();
    await pc1.setLocalDescription(offer)

    // offer를 WebSocket 서버로 전송
    ws.send(JSON.stringify({
      type: "offer",
      sdp: pc1.localDescription
    }));
  } catch (error) {
    console.log("offer error", error)
  }
}

async function createAnswer(sdpoffer) {
  try {
      let sdpSession = new RTCSessionDescription(sdpoffer)
      await pc1.setRemoteDescription(sdpSession);
      const answer = await pc1.createAnswer();
      await pc1.setLocalDescription(answer);

      ws.send(JSON.stringify({
          type: "answer",
          sdp: pc1.localDescription
      }));
  } catch (error) {
      console.log("Answer error:", error);
  }
}


ws.addEventListener("message", (message)=>{
  const data = JSON.parse(message.data);

  if(data.type === 'offer'){
    createAnswer(data.sdp)
  }else if (data.type === "answer"){
    console.log('answer receiver');
    let answer_session = new RTCSessionDescription(data.sdp)
    pc1.setRemoteDescription(answer_session);
  }else if (data.type==="candidate"){
    console.log("ICE Reciver");
    let ice_session = new RTCIceCandidate(data.candidate);
    pc1.addIceCandidate(ice_session);
  }
});
function streamingLocalRelease(releaseView) {
  try {
    releaseView.getTracks().forEach(track=>{
      track.stop();
    });
    localView.srcObject = null;
    remoteView.srcObject = null;
  } catch (error) {
    console.log("모든 비디오 중지",error);
  }
}

function streamingRemoteRelease(releaseView) {
  try {
    releaseView.getTracks().forEach(track=>{
      track.stop();
    });
    remoteView.srcObject = null;
  } catch (error) {
    console.log("모든 비디오 중지",error);
  }
}
function wsClose() {
  try {
    if(ws.readyState === WebSocket.OPEN){
      console.log("Live View 종료합니다.");
      ws.close();
    }
  } catch (error) {
    console.log(error);
  }finally{
    if(localView.srcObject !== null) {
      streamingLocalRelease(localView.srcObject);
    }
    else if (remoteView.srcObject !=null){
      streamingRemoteRelease(remoteView.srcObject);
    }
  }

}
exit_Btn.onclick = wsClose;
