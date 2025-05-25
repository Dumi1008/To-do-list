const inputBox = document.getElementById('inputBox');
const listContainer = document.getElementById('list-container');

function addTask() {
    if(inputBox.value.trim() === '') {
        inputBox.focus();
        return;
    }
    
    let li = document.createElement('li');
    li.innerHTML = `
        ${inputBox.value}
        <span>×</span>
    `;
    listContainer.prepend(li);
    inputBox.value = '';
    saveData();
    inputBox.focus();
}

listContainer.addEventListener('click', function(e) {
    if(e.target.tagName === 'LI') {
        e.target.classList.toggle('checked');
        saveData();
        // Animație pentru task completat
        if(e.target.classList.contains('checked')) {
            e.target.style.transform = 'translateX(0)';
        }
    } else if(e.target.tagName === 'SPAN') {
        e.target.parentElement.style.transform = 'translateX(100%)';
        e.target.parentElement.style.opacity = '0';
        setTimeout(() => {
            e.target.parentElement.remove();
            saveData();
        }, 200);
    }
}, false);

function saveData() {
    localStorage.setItem('tasks', listContainer.innerHTML);
}

function showTasks() {
    listContainer.innerHTML = localStorage.getItem('tasks') || '';
}

// Animație la încărcare
document.addEventListener('DOMContentLoaded', () => {
    showTasks();
    setTimeout(() => {
        document.querySelector('.glass-container').style.opacity = '1';
        document.querySelector('.glass-container').style.transform = 'translateY(0)';
    }, 50);
    
    // Adăugăm animații pentru fiecare task existent
    const items = listContainer.querySelectorAll('li');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100 + index * 50);
    });
});

inputBox.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});