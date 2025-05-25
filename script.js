const inputBox = document.getElementById('inputBox');
const listContainer = document.getElementById('list-container');
function addTask(){
    if(inputBox.value === ''){
        alert("Nu ai introdus nimic!");
    }
    else{
        let li = document.createElement('li');
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);
        let span = document.createElement('span');
        span.innerHTML = "\u00d7";
        li.appendChild(span);
        span.addEventListener('click', function(){
            listContainer.removeChild(li);
            saveData
        });
    }
    inputBox.value = '';
    sortTasks();
}

listContainer.addEventListener('click', function(e){
    if(e.target.tagName === 'LI'){
        e.target.classList.toggle('checked');
        saveData();
    }
    else if(e.target.tagName === 'SPAN'){
        e.target.parentElement.remove();
        saveData();
    }
},false);

function saveData(){
    localStorage.setItem('tasks', listContainer.innerHTML);
}

function showTasks(){
    listContainer.innerHTML = localStorage.getItem('tasks');
    sortTasks();
}
showTasks();

function sortTasks() {
    const tasks = Array.from(listContainer.children);
    const unfinishedTasks = tasks.filter(task => !task.classList.contains('checked'));
    const finishedTasks = tasks.filter(task => task.classList.contains('checked'));
    listContainer.innerHTML = '';
    unfinishedTasks.concat(finishedTasks).forEach(task => {
        listContainer.appendChild(task);
    });
    saveData();
}

inputBox.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});

