const WebSocket = require('ws');
const wss = new WebSocket.Server({port:8082});

const TYPE_INTRODUCTION = 1
const TYPE_BROADCAST = 2
const TYPE_HANDSHAKE = 3
const TYPE_CLIENTDATA = 4
const TYPE_SERVERCLOSE = 7

// later: SQL?
let fakedata = {
    test: {
        "title": "dadaa", 
        "list": [{"id":0,"done":true,"task":"pizza","count":"5"},{"id":1,"done":true,"task":"bread","count":"4"},{"id":2,"done":false,"task":"idk lalalla","count":"1"}],
        "users": ["nyancat","idk"]
    },    
    helloworld: {
        "title": "hello world!", 
        "list": [{"id":0,"done":false,"task":"uwu","count":"12"},{"id":1,"done":false,"task":"owo","count":"7"}]
    }
}

wss.on("connection", ws => {

    console.log('INFO: Client connected');

    function broadcast(data, addCheck = true){
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN && eval(addCheck)) {
                client.send(data);
            }
        });
    }

    ws.on("message", data => {
        console.log(`INFO: Got data ${data}`);

        let parsedData = null;
        try { 
            parsedData = JSON.parse(data) 
        } 
        catch (err) {
            console.log('WARN: Client-side data is unparsable, check front-end code.')
        }

        const noteID = parsedData.noteID;

        if (parsedData.type == TYPE_HANDSHAKE && noteID in fakedata) {
            ws.send(`{"type": ${TYPE_BROADCAST}, "data": ${JSON.stringify(fakedata[noteID])}}`);
        }

        if (parsedData.type == TYPE_CLIENTDATA){
            fakedata[parsedData.noteID] = parsedData.data;
            broadcast(`{"type": ${TYPE_BROADCAST}, "data": ${JSON.stringify(parsedData.data)}}`, 'client !== ws');
        }
    });

    ws.on("close", (e) => {
        broadcast(`{"type": ${TYPE_SERVERCLOSE}}`);
    });
});