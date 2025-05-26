// Global variables
const inputBox = document.getElementById('inputBox');
const listContainer = document.getElementById('list-container');
const emptyState = document.getElementById('emptyState');
const themeToggle = document.getElementById('themeToggle');

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Theme toggle functionality
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Theme toggle event
    themeToggle.addEventListener('click', toggleTheme);

    // Initialize date pickers
    flatpickr("#startDate", {
        dateFormat: "Y-m-d",
        defaultDate: getTodayDate() // Set default to today
    });
    
    flatpickr("#dueDate", {
        dateFormat: "Y-m-d",
        minDate: "today"
    });

    // Set start date to today by default
    document.getElementById('startDate').value = getTodayDate();

    // Load tasks
    showTasks();
    
    // Filter tasks
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterTasks(this.dataset.filter);
        });
    });
});

async function addTask() {
    const taskText = inputBox.value.trim();
    if(!taskText) {
        inputBox.focus();
        return;
    }

    let startDate = document.getElementById('startDate').value;
    const dueDate = document.getElementById('dueDate').value;
    const priority = document.getElementById('taskPriority').value;

    if (!startDate) {
        startDate = getTodayDate();
        document.getElementById('startDate').value = startDate;
    }

    // Creează task-ul în baza de date
    const response = await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: taskText,
            status: 'todo',
            priority: priority,
            start: startDate,
            due: dueDate
        })
    });
    const newTask = await response.json();

    // Creează task-ul în UI și atașează _id-ul din MongoDB
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item';
    taskItem.dataset.id = newTask._id; // Folosește _id de la MongoDB
    taskItem.dataset.dbid = newTask._id;
    taskItem.dataset.status = newTask.status;
    taskItem.dataset.priority = newTask.priority;
    taskItem.dataset.start = newTask.start;
    if(newTask.due) taskItem.dataset.due = newTask.due;

    taskItem.innerHTML = createTaskHTML(newTask.text, newTask.priority, newTask.start, newTask.due, newTask.status);

    listContainer.insertBefore(taskItem, listContainer.firstChild);
    resetForm();
    animateTask(taskItem);
    updateEmptyState();

    setupTaskButtons(taskItem);
}

function createTaskHTML(text, priority, startDate, dueDate, status) {
    return `
        <div class="task-content">
            <div class="task-main">
                <span class="task-priority priority-${priority}"></span>
                <div class="task-title">${text}</div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="delete-btn" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="task-meta">
                <div class="task-status">
                    <button class="status-btn status-todo ${status === 'todo' ? 'active' : ''}">To Do</button>
                    <button class="status-btn status-in-progress ${status === 'in-progress' ? 'active' : ''}">In Progress</button>
                    <button class="status-btn status-done ${status === 'done' ? 'active' : ''}">Done</button>
                </div>
                <div class="task-dates">
                    ${startDate ? `
                    <div class="task-start">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        Start: ${formatDueDate(startDate)}
                    </div>` : ''}
                    ${dueDate ? `
                    <div class="task-due ${isOverdue(dueDate) ? 'overdue' : ''}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                            <path d="M16 2v4"></path>
                            <path d="M8 2v4"></path>
                            <path d="M3 10h18"></path>
                        </svg>
                        Due: ${formatDueDate(dueDate)}
                    </div>` : ''}
                </div>
            </div>
        </div>
    `;
}

function setupTaskButtons(taskItem) {
    // Status buttons
    taskItem.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
        const status = this.classList.contains('status-todo') ? 'todo' :
                      this.classList.contains('status-in-progress') ? 'in-progress' : 'done';

        taskItem.dataset.status = status;
        taskItem.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Animation for status change
        if(status === 'done') {
            taskItem.style.opacity = '0.7';
            taskItem.querySelector('.task-title').style.textDecoration = 'line-through';
            taskItem.style.borderLeft = '3px solid var(--done-color)';
        } else if (status === 'in-progress') {
            taskItem.style.opacity = '1';
            taskItem.querySelector('.task-title').style.textDecoration = 'none';
            taskItem.style.borderLeft = '3px solid var(--in-progress)';
        } else {
            taskItem.style.opacity = '1';
            taskItem.querySelector('.task-title').style.textDecoration = 'none';
            taskItem.style.borderLeft = '3px solid var(--text-light)';
        }

        // Actualizează și în baza de date dacă există id
        const taskId = taskItem.dataset.dbid || taskItem.dataset.id;
        if (taskId) {
            await fetch(`http://localhost:3001/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: taskItem.querySelector('.task-title').textContent,
                    status: status,
                    priority: taskItem.dataset.priority,
                    start: taskItem.dataset.start,
                    due: taskItem.dataset.due
                })
            });
        }

        saveData();
    });
});
    
    // Edit button
    taskItem.querySelector('.edit-btn').addEventListener('click', function() {
        editTask(taskItem);
    });
    
    // Delete button
    taskItem.querySelector('.delete-btn').addEventListener('click', async function() {
        // Dacă task-ul are un id din baza de date (MongoDB)
        const taskId = taskItem.dataset.dbid; // presupunem că salvezi _id-ul MongoDB în data-dbId
        if (taskId) {
            await fetch(`http://localhost:3001/tasks/${taskId}`, { method: 'DELETE' });
        }
        // Animatie și ștergere din UI/localStorage
        taskItem.style.transform = 'translateX(100%)';
        taskItem.style.opacity = '0';
        setTimeout(() => {
            taskItem.remove();
            saveData();
            updateEmptyState();
        }, 200);
    });
}


function editTask(taskItem) {
    const taskTitle = taskItem.querySelector('.task-title').textContent;
    const currentStart = taskItem.dataset.start || getTodayDate(); // Default to today if no start date
    const currentDue = taskItem.dataset.due || '';
    const currentPriority = taskItem.dataset.priority;
    
    taskItem.innerHTML = `
        <div class="edit-form">
            <input type="text" class="edit-input" value="${taskTitle}">
            <div class="edit-options">
                <input type="date" class="edit-start" value="${currentStart}" placeholder="Start date">
                <input type="date" class="edit-due" value="${currentDue}" placeholder="Due date">
                <select class="edit-priority">
                    <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>High</option>
                </select>
                <button class="save-edit">Save</button>
                <button class="cancel-edit">Cancel</button>
            </div>
        </div>
    `;
    
    // Initialize date pickers for edit form
    flatpickr(".edit-start", {
        dateFormat: "Y-m-d"
    });
    
    flatpickr(".edit-due", {
        dateFormat: "Y-m-d",
        minDate: "today"
    });
    
    // Event listeners for edit buttons
    taskItem.querySelector('.save-edit').addEventListener('click', async function() {
    const newText = taskItem.querySelector('.edit-input').value.trim();
    if(newText) {
        let newStart = taskItem.querySelector('.edit-start').value;
        const newDue = taskItem.querySelector('.edit-due').value;
        const newPriority = taskItem.querySelector('.edit-priority').value;

        // Ensure start date is set
        if (!newStart) {
            newStart = getTodayDate();
        }

        taskItem.dataset.start = newStart;
        taskItem.dataset.due = newDue;
        taskItem.dataset.priority = newPriority;

        const status = taskItem.dataset.status;

        // Actualizează și în baza de date dacă există id
        const taskId = taskItem.dataset.dbid || taskItem.dataset.id;
        if (taskId) {
            await fetch(`http://localhost:3001/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: newText,
                    status: status,
                    priority: newPriority,
                    start: newStart,
                    due: newDue
                })
            });
        }

        taskItem.innerHTML = createTaskHTML(newText, newPriority, newStart, newDue, status);

        setupTaskButtons(taskItem);
        saveData();
    }
});

    
    taskItem.querySelector('.cancel-edit').addEventListener('click', function() {
        const status = taskItem.dataset.status;
        const priority = taskItem.dataset.priority;
        const start = taskItem.dataset.start || getTodayDate();
        const due = taskItem.dataset.due;
        
        taskItem.innerHTML = createTaskHTML(taskTitle, priority, start, due, status);
        setupTaskButtons(taskItem);
    });
}

function filterTasks(filter) {
    const tasks = document.querySelectorAll('.task-item');
    
    tasks.forEach(task => {
        switch(filter) {
            case 'all':
                task.style.display = 'flex';
                break;
            case 'todo':
                task.style.display = task.dataset.status === 'todo' ? 'flex' : 'none';
                break;
            case 'in-progress':
                task.style.display = task.dataset.status === 'in-progress' ? 'flex' : 'none';
                break;
            case 'done':
                task.style.display = task.dataset.status === 'done' ? 'flex' : 'none';
                break;
        }
    });
}

function isOverdue(dueDate) {
    if(!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
}

function formatDueDate(dateString) {
    if(!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if(diffDays === 0) return 'Today';
    if(diffDays === 1) return 'Tomorrow';
    if(diffDays === -1) return 'Yesterday';
    if(diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function resetForm() {
    inputBox.value = '';
    document.getElementById('startDate').value = getTodayDate(); // Reset to today's date
    document.getElementById('dueDate').value = '';
    document.getElementById('taskPriority').value = 'medium';
    inputBox.focus();
}

function animateTask(task) {
    task.style.opacity = '0';
    task.style.transform = 'translateY(10px)';
    setTimeout(() => {
        task.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        task.style.opacity = '1';
        task.style.transform = 'translateY(0)';
    }, 50);
}

function updateEmptyState() {
    const tasks = document.querySelectorAll('.task-item');
    if (tasks.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
    }
}

function saveData() {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(task => {
        tasks.push({
            id: task.dataset.id,
            text: task.querySelector('.task-title').textContent,
            status: task.dataset.status,
            priority: task.dataset.priority,
            start: task.dataset.start || getTodayDate(), // Ensure start date exists
            due: task.dataset.due || ''
        });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

async function showTasks() {
    // Ia task-urile din baza de date, nu din localStorage
    const response = await fetch('http://localhost:3001/tasks');
    const savedTasks = await response.json();

    listContainer.innerHTML = ''; // Golește lista

    savedTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task._id;
        taskItem.dataset.dbid = task._id;
        taskItem.dataset.status = task.status;
        taskItem.dataset.priority = task.priority;
        taskItem.dataset.start = task.start || getTodayDate();
        if (task.due) taskItem.dataset.due = task.due;

        taskItem.innerHTML = createTaskHTML(task.text, task.priority, task.start || getTodayDate(), task.due, task.status);

        listContainer.appendChild(taskItem);
        setupTaskButtons(taskItem);

        if (task.status === 'done') {
            taskItem.style.opacity = '0.7';
            taskItem.querySelector('.task-title').style.textDecoration = 'line-through';
            taskItem.style.borderLeft = '3px solid var(--done-color)';
        } else if (task.status === 'in-progress') {
            taskItem.style.borderLeft = '3px solid var(--in-progress)';
        } else {
            taskItem.style.borderLeft = '3px solid var(--text-light)';
        }
    });

    updateEmptyState();
}

// Enter key for adding task
inputBox.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});


document.getElementById('exportToDB').addEventListener('click', exportTasksToDB);

async function exportTasksToDB() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    for (const task of savedTasks) {
        // Trimite fiecare task către server
        await fetch('http://localhost:3001/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: task.text,
                status: task.status,
                priority: task.priority,
                start: task.start,
                due: task.due
            })
        });
    }
    alert('Task-urile au fost exportate în baza de date!');
}

