import { taskListItemTemplate, noteItemTemplate } from "./modules/htmlTemplates.js";


let lastTab = 0;
let noteID = '';

const carousel = document.getElementById('carousel');

function changeCarousel(to) {
    carousel.style.transform = `translateX(-${to * 100}%)`
}
function menuHandler(whereTo) {
    if (whereTo == -1) {
        changeCarousel(lastTab);
        if (lastTab == 0) {
            ws.send(`{"type": ${TYPE_INTRODUCTION}, "name": "${username}"}`);
            window.history.replaceState(null, null, '/');
        }
        lastTab = 0;
    } else {
        lastTab = carousel.style.transform.match(/[0-9]/).join('');
        changeCarousel(whereTo);
    }
}

function openNote(target) {
    let targ = target.currentTarget // stackoverflow yayyy
    window.history.replaceState(null, null, `?id=${targ.dataset.id}`);
    menuHandler(1);
    ws.send(`{"type": ${TYPE_HANDSHAKE}, "name": "${username}", "noteID":"${targ.dataset.id}" }`);
    noteID = targ.dataset.id;
}

const profileButtons = document.querySelectorAll('.profile');
profileButtons.forEach(i => {
    i.addEventListener('click',() => menuHandler(2));
})
const backButtons = document.querySelectorAll('.backButton');
backButtons.forEach(i => {
    i.addEventListener('click',() => menuHandler(-1));
})
document.querySelector('.noteListItem').addEventListener('click', () => createNewNote());
document.querySelector('.heading').addEventListener('blur', () => save());

function clearNote(usrs = [], title = '', shared = '') {
    users = usrs;
    const list = document.querySelector('.list');
    while (list.childNodes.length > 1) {
        list.removeChild(list.lastChild);
    }
    document.getElementById('listTitle').value = title;
    document.getElementById('shared').innerText = `${shared}`
}

function createNewNote(){
    let newId = generateId(20);
    window.history.replaceState(null, null, `?id=${newId}`);
    // THIS TOOK ME A WHOLE HOOOOUR TO FIND OUT I DIDNT EVEN SET NOTE ID............ 
    noteID = newId;
    // ws.send(`{"type": ${TYPE_HANDSHAKE}, "name": "${username}", "noteID":"${newId}" }`);
    menuHandler(1);
    clearNote();
}

// stackoverflow: dec2hex :: Integer -> String
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

const usernameTextInput = document.getElementById('username');
usernameTextInput.value = username;
usernameTextInput.placeholder = username;
usernameTextInput.addEventListener('blur', () => {
    username = usernameTextInput.value;
    localStorage.setItem('user', username)
})

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('id')) {
    noteID = urlParams.get('id');
    menuHandler(1);
}
console.log(window.location.hostname)
const ws = new WebSocket(`ws://${window.location.hostname}:8082`);
let connected = false;
let users = ['']

const TYPE_INTRODUCTION = 1
const TYPE_BROADCAST = 2
const TYPE_HANDSHAKE = 3
const TYPE_CLIENTDATA = 4
const TYPE_OWNEDNOTES = 5
const TYPE_ASKFORNOTEID = 6
const TYPE_SERVERCLOSE = 7
const TYPE_NOTEIDRESPONSE = 8;

ws.onerror = () => {
    document.getElementById('debug').innerHTML = 'connection error...';
    connected = false;
}

ws.addEventListener("open", () => {
    document.getElementById('debug').innerHTML = "connected";
    connected = true;
    ws.send(`{"type": ${TYPE_INTRODUCTION}, "name": "${username}"}`);
    if (urlParams.has('id')) {
        ws.send(`{"type": ${TYPE_HANDSHAKE}, "name": "${username}", "noteID":"${noteID}" }`);
    }

});


ws.addEventListener("message", ({data}) => {
    if (data.toString().startsWith('{')){
        console.log(data.toString())
        let object = JSON.parse(data); 
        console.log(object)
        if (object.type == TYPE_ASKFORNOTEID){
            ws.send(`{"type": ${TYPE_NOTEIDRESPONSE}, "name": "${username}", "noteID": "${noteID}"}`)
        }
        if (object.type == TYPE_OWNEDNOTES) {
            while (menuNoteList.childNodes.length > 2) {
                menuNoteList.removeChild(menuNoteList.lastChild);
            }
            
            for (const i in object.notes) { 
                const newNoteItem = noteItemTemplate(object.notes[i].id,object.notes[i].title, "x", "x");
                menuNoteList.append(newNoteItem);
                newNoteItem.addEventListener('click', openNote);
            }
        }
        if (object.type == TYPE_BROADCAST) {
            clearNote(object.data.users, object.data.title, users.join())
            for (let i = 0; i < object.data.list.length; i++){
                createNewObj(false, object.data.list[i].done, object.data.list[i].task, object.data.list[i].count);
            }
            
        }
    }
});


// todo
function sendData(type, user = null, noteID = null, data = null){
    let query = {};
    query.type = type;
    ws.send(`{"type": 4, "user":"${username}", "noteID":"${noteID}", "data": ${JSON.stringify(newObject)} }`);
}


const addButton = document.getElementById('add');
const taskList = document.querySelector('.list');
const menuNoteList = document.querySelector('.listedItems');

function counterChange(target, add){
    const targetCounter = target.target.parentElement.children[1]
    if (add) {
        targetCounter.innerHTML = Number(targetCounter.innerHTML) + 1;
    } else {
        if(targetCounter.innerHTML == 1) {
            target.target.parentElement.parentElement.remove();
        }
        if(targetCounter.innerHTML > 1){   
            targetCounter.innerHTML -= 1;
        }
    }
    save();
}

function updateTimestamp(){
    function addZero(target) {
        return target.length < 10 ? "0" + String(target) : target
    }
    const date = new Date();
    const timestamp = `last updated at ${addZero(date.getHours())}:${addZero(date.getMinutes())}`
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
    console.log(newObject.users)
    console.log(!newObject.users.includes(username))
    if (!newObject.users.includes(username)) {
        newObject.users.push(username);
    }

    for (let i = 0; i < tasks.length; i++) {
        newArray.push({
            id: i, 
            done: tasks[i].children[0].checked, 
            task: tasks[i].children[2].value,
            count: tasks[i].children[3].children[1].innerText})
    }

    newObject.list = newArray;

    updateTimestamp();
    console.log(noteID)
    ws.send(`{"type": 4, "user":"${username}", "noteID":"${noteID}", "data": ${JSON.stringify(newObject)} }`);
}


function createNewObj(userCreated, done, task, count){
    const newItem = taskListItemTemplate();
    taskList.append(newItem);    
    newItem.querySelector('input[type=checkbox]').addEventListener('change', () => save());
    newItem.querySelector('input[type=text]').addEventListener('blur', () => save());
    newItem.querySelector('.minus').addEventListener('click', ev => counterChange(ev, false));
    newItem.querySelector('.plus').addEventListener('click', ev => counterChange(ev, true));
    const newobj = taskList.lastChild;
    if (userCreated) {
        newobj.querySelector('input[type=text]').focus();
    } else {
        newobj.querySelector('input[type=checkbox]').checked = done;
        newobj.querySelector('input[type=text]').value = task;
        newobj.querySelector('.counter > p').innerText = count;
    }
}

addButton.addEventListener('click', () => {
    if (taskList.lastChild.children == null || taskList.lastChild.children == undefined){
        createNewObj(true);
        return;
    }
    if (taskList.lastChild.children[2].value != ""){
        createNewObj(true);
    }
})
