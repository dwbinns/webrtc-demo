/*
Minimal implementation of a WebRTC video chat.
See README.md
*/


let WebSocketServer = require('ws').Server;
let fs=require('fs');
let static = require('node-static');

let file = new static.Server('.');

let server=require('http').createServer((request, response)=>{
    request.addListener('end', ()=>file.serve(request, response)).resume();
});

let sockets=[];

var wss = new WebSocketServer({server:server,path:'/api'});
wss.on('connection', function(ws) {
    console.log('connected');

    sockets.push(ws);

    ws.on('close',()=>sockets=sockets.filter(s=>s!=ws));
    
    ws.on('message', function(message) {
        sockets.filter(s=>s!=ws).forEach(s=>s.send(message));
    });
});

server.listen(8739);