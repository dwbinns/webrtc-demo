/*
Minimal implementation of a WebRTC video chat.
*/

var localVideo = document.querySelector('#local');
var remoteVideo = document.querySelector('#remote');
let callButton = document.querySelector('#call');

let peerConnection;
let stream;
let server;

function getLocalVideo() {
    localVideo.onerror=e=>alert('Error displaying video:'+e.message);
    return navigator.mediaDevices.getUserMedia({audio: false,video: true})
    .then(s=>{
        stream=s;
        localVideo.src = window.URL.createObjectURL(stream);
    })
    .catch(e=>{
        console.log('Unable to get local video:'+e.name);
    });
    
}

function sendMessage(message) {
    server.send(JSON.stringify(message));
}


function connectWebsocket() {
    return new Promise((resolve,reject)=>{
        if (location.protocol=='file:') throw new Error('Will not work with a file:// URL');
            
        server=new WebSocket((location.protocol=='http:' ? "ws" : "wss")+"://"+location.host+"/api");

        server.onopen=()=>resolve()

        server.onerror=()=>reject(new Error('Unable to connect to websocket'));

        server.onmessage=message=>{
            let data=JSON.parse(message.data);
            if (data.type=='offer') {
                createPeerConnection();
                peerConnection.setRemoteDescription(data);
                peerConnection.createAnswer()
                .then(sessionDescription=>{
                    peerConnection.setLocalDescription(sessionDescription);
                    sendMessage(sessionDescription);
                });
            }
            if (data.type=='answer') {
                peerConnection.setRemoteDescription(data);
            }
            if (data.type=='candidate') {
                peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };
    });
}
            

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(null);
    peerConnection.onicecandidate = onIceCandidate;
    peerConnection.onaddstream=event=>remoteVideo.src = window.URL.createObjectURL(event.stream);
    if (stream) peerConnection.addStream(stream);
    
}

function call() {
    createPeerConnection();
    peerConnection.createOffer()
    .then(sessionDescription=>{
        peerConnection.setLocalDescription(sessionDescription);
        sendMessage(sessionDescription);
    })
}

function onIceCandidate(event) {
    if (event.candidate) sendMessage({type: 'candidate',candidate:event.candidate});
}


function init() {
    callButton.onclick=call;
    getLocalVideo()
    .then(connectWebsocket)
    .then(()=>callButton.disabled=false)
    .catch(e=>alert('Error:'+e.message));
}

init();