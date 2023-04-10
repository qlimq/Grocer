console.log('server active')
const WebSocket = require('ws');
const wss = new WebSocket.Server({port:8082});

const TYPE_INTRODUCTION = 1
const TYPE_BROADCAST = 2
const TYPE_HANDSHAKE = 3
const TYPE_CLIENTDATA = 4
const TYPE_OWNEDNOTES = 5
const TYPE_ASKFORNOTEID = 6
const TYPE_SERVERCLOSE = 7
const TYPE_NOTEIDRESPONSE = 8

// later: SQL?
let fakedata = {
    test: {
        "title": "dadaa", 
        "list": [{"id":0,"done":true,"task":"pizza","count":"5"},{"id":1,"done":true,"task":"bread","count":"4"},{"id":2,"done":false,"task":"idk lalalla","count":"1"}],
        "users": ["f190ded1","idk"]
    },    
    helloworld: {
        "title": "hello world!", 
        "list": [{"id":0,"done":false,"task":"uwu","count":"12"},{"id":1,"done":false,"task":"owo","count":"7"}],
        "users": ["f190ded1"]
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
        if (parsedData.type == TYPE_INTRODUCTION) {
            console.log('intro')

            // find every note that has this specific user
            const x = Object.entries(fakedata);
            let lst = [];
            for (const element of x) {
                if (element[1].users.includes(parsedData.name)) {
                    const newObj = {};
                    newObj.id = element[0];
                    newObj.title = element[1].title;
                    lst.push(newObj)
                }
            }
            // lst.map(i => `"${i}"`).join(',')
            console.log(lst)
            ws.send(`{"type": ${TYPE_OWNEDNOTES}, "notes": ${JSON.stringify(lst, null, 2)}}`)
        }
        if (parsedData.type == TYPE_HANDSHAKE && noteID in fakedata) {
            // fakedata[noteID].users.push(parsedData.name); handled from frontend already
            ws.send(`{"type": ${TYPE_BROADCAST}, "data": ${JSON.stringify(fakedata[noteID])}}`);
            console.log(fakedata)
        }
        let waitingforNoteID = false;
        let buffer = null;
        let usersbuffer = [];
        let sender = null;
        let timeout = null;
        // FIXME: possibly not the best way to implement it, easy to go around probably? this is bad
        if (parsedData.type == TYPE_CLIENTDATA){
            fakedata[parsedData.noteID] = parsedData.data;
            broadcast(`{"type": ${TYPE_ASKFORNOTEID}}`, 'client !== ws');
            waitingforNoteID = true;
            buffer = parsedData;
            sender = ws;
        }
        // && waitingforNoteID
        if (parsedData.type == TYPE_NOTEIDRESPONSE) {
            waitingforNoteID = false;
            const tempObj = {}
            tempObj.client = ws;
            tempObj.noteID = parsedData.noteID;
            usersbuffer.push(tempObj);

            //&& obj.noteID == buffer.noteID
            usersbuffer = usersbuffer.filter(obj => obj.client != sender )
            usersbuffer.forEach(i => {
                i.client.send(`{"type": ${TYPE_BROADCAST}, "data": ${JSON.stringify(buffer)}}`)
                // broadcast(`{"type": ${TYPE_BROADCAST}, "data": ${JSON.stringify(buffer)}}`, `client == ${i.client}`);
            })
        if (!timeout) {
            timeout = setTimeout(() => {
                console.log(usersbuffer)
            }, 500)
        }


            // broadcast(`{"type": ${TYPE_BROADCAST}, "data": ${JSON.stringify(buffer)}}`, 'client !== ws');
            // [buffer, usersbuffer, sender] = [null, [], null];
        }
    });

    ws.on("close", (e) => {
        broadcast(`{"type": ${TYPE_SERVERCLOSE}}`);
    });
});