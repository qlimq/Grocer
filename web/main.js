// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
function dec2hex (dec) {
    return dec.toString(16).padStart(2, "0")
}

// generateId :: Integer -> String
function generateId (len) {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, dec2hex).join('')
}

if (!localStorage.getItem('user')) {
    localStorage.setItem('user', generateId(8))
}

let username = localStorage.getItem('user');

const urlParams = new URLSearchParams(window.location.search);
let noteID = '';

if (urlParams.has('id')) {
    noteID = urlParams.get('id')
} else {
    noteID = generateId(20);
    window.history.replaceState(null, null, `?id=${noteID}`);
}

const ws = new WebSocket("ws://localhost:8082");
let connected = false;
let users = ['']

const TYPE_INTRODUCTION = 1
const TYPE_BROADCAST = 2
const TYPE_HANDSHAKE = 3
const TYPE_CLIENTDATA = 4
const TYPE_SERVERCLOSE = 7

ws.onerror = () => {
    document.getElementById('debug').innerHTML = 'connection error...';
    connected = false;
}

ws.addEventListener("open", () => {
    document.getElementById('debug').innerHTML = "connected";
    connected = true;
    ws.send(`{"type": ${TYPE_INTRODUCTION}, "name": "${username}"}`);
    ws.send(`{"type": ${TYPE_HANDSHAKE}, "name": "${username}", "noteID":"${noteID}" }`);

});
ws.addEventListener("message", ({data}) => {
    if (data.toString().startsWith('{')){
        console.log(data.toString())
        let object = JSON.parse(data); 
        console.log(object)

        if (object.type == TYPE_BROADCAST) {
            users = object.data.users;
            document.querySelector('.list').replaceChildren()
            document.getElementById('listTitle').value = object.data.title
            document.getElementById('shared').innerText = `shared with ${users.join()}`
            for (let i = 0; i < object.data.list.length; i++){
                createNewObj(false, object.data.list[i].done, object.data.list[i].task, object.data.list[i].count)
            }
            
        }
    }
});

// really dont know anything that i could use, think should learn es6..
// class User {
//     constructor(name) {
//         this.name = name
//     }
// }
// class NoteID {
//     constructor(noteID) {
//         this.noteID = noteID
//     }
// }
// class Data {
//     constructor(data) {
//         this.data = data
//     }
// //send method here?? 
// }

// function sendData(type, ...args){
//     switch (type){
//         case TYPE_BROADCAST:

//     }
//     ws.send(`{"type": 4, "user":"${username}", "noteID":"${noteID}", "data": ${JSON.stringify(newObject)} }`);
// }

function sendData(type, user = null, noteID = null, data = null){
    let query = {};
    query.type = type;
    ws.send(`{"type": 4, "user":"${username}", "noteID":"${noteID}", "data": ${JSON.stringify(newObject)} }`);
}


const addButton = document.getElementById('add');
const taskList = document.querySelector('.list');



const taskListItemTemplate = `
    <input type="checkbox" name="" id="" autocomplete="off"  onchange="save()">
    <svg class="check" width="25" height="25" xmlns="http://www.w3.org/2000/svg">
        <g>
            <line stroke-width="2" y2="18.5" x2="12.5" y1="12.125" x1="5.375" stroke="#000" fill="none"/>
            <line stroke-width="2" y2="7.875" x2="19.375" y1="18.75" x1="11.25" stroke="#000" fill="none"/>
        </g>
    </svg>
    <input type="text" name="" id="" autocomplete="off" onblur=save()>
    <div class="counter">
        <button onclick="counterChange(this,false)">-</button>
        <p>1</p>
        <button onclick="counterChange(this,true)">+</button>
    </div>
    `

function counterChange(target, add){
    const targetCounter = target.parentElement.children[1]
    if (add) {
        targetCounter.innerHTML = Number(targetCounter.innerHTML) + 1;
    } else {
        if(targetCounter.innerHTML == 1) {
            target.parentElement.parentElement.remove();
        }
        if(targetCounter.innerHTML > 1){   
            targetCounter.innerHTML -= 1;
        }
    }
    save();
}

function updateTimestamp(){
    const date = new Date();
    const timestamp = `last updated at ${date.getHours()}:${date.getMinutes().length < 10 ? "0" + String(date.getMinutes()) : date.getMinutes()}`
    document.getElementById('lastedit').children[0].innerHTML = timestamp; 
    return date.toISOString()
}

function save(){
    const tasks = taskList.children;
    const newObject = {};
    const newArray = [];
    const title = document.getElementById('listTitle').value;

    title ? newObject.title = title : newObject.title = 'notitle' 

    newObject.users = users;

    for (let i = 0; i < tasks.length; i++) {
        newArray.push({
            id: i, 
            done: tasks[i].children[0].checked, 
            task: tasks[i].children[2].value,
            count: tasks[i].children[3].children[1].innerText})
    }

    newObject.list = newArray;

    updateTimestamp();
    document.getElementById('debug').innerHTML = JSON.stringify(newObject);

    ws.send(`{"type": 4, "user":"${username}", "noteID":"${noteID}", "data": ${JSON.stringify(newObject)} }`);
}


function createNewObj(userCreated, done, task, count){
    const newNode = document.createElement('div');
    newNode.className = 'list-item';
    newNode.innerHTML = taskListItemTemplate;
    taskList.append(newNode);
    const newobj = taskList.lastChild;
    if (userCreated) {
        newobj.querySelector('input[type=text]').focus();
    } else {


        newobj.querySelector('input[type=checkbox]').checked = done;
        newobj.querySelector('input[type=text]').value = task;
        newobj.querySelector('.counter > p').innerText = count;


        const [checkbox, textInput, counter] = newobj.querySelectorAll('input[type=checkbox], input[type=text], .counter > p')
        const values = [done, task, count]; 
        [checkbox.checked, textInput.value, counter.textContent] = values;

    }
}

addButton.addEventListener('click', () => {
    
    if (taskList.lastChild.children == undefined){
        createNewObj(true);
        return;
    }

    if (taskList.lastChild.children[2].value != ""){
        createNewObj(true);
    }

})