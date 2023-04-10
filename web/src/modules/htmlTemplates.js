function taskListItemTemplate() {
    const newItem = document.createElement('div');
    newItem.className = 'list-item';
    newItem.innerHTML += `
    <input type="checkbox" name="" autocomplete="off" class="checkbox">
    <svg class="check" width="25" height="25" xmlns="http://www.w3.org/2000/svg">
        <g>
            <line stroke-width="2" y2="18.5" x2="12.5" y1="12.125" x1="5.375" stroke="#000" fill="none"/>
            <line stroke-width="2" y2="7.875" x2="19.375" y1="18.75" x1="11.25" stroke="#000" fill="none"/>
        </g>
    </svg>
    <input type="text" name="" class="noteValue" autocomplete="off">
    <div class="counter">
        <button class="minus">-</button>
        <p>1</p>
        <button class="plus">+</button>
    </div>`

    return newItem;
}

function noteItemTemplate(id, title, sharedWith, lastEdit){
    const newItem = document.createElement('button');
    newItem.innerHTML += `
    <h4>${title}</h4>
        <div>
            <p>${sharedWith}</p>
            <p>${lastEdit}</p>
        </div>`
    newItem.className = "noteListItem";
    newItem.dataset.id = id;
    return newItem;
}

export { taskListItemTemplate, noteItemTemplate };