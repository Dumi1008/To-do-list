// Global variables
        const inputBox = document.getElementById('inputBox');
        const listContainer = document.getElementById('list-container');
        const emptyState = document.getElementById('emptyState');

        document.addEventListener('DOMContentLoaded', function() {
            // Initialize date picker
            flatpickr("#dueDate", {
                dateFormat: "Y-m-d",
                minDate: "today"
            });

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

        function addTask() {
            const taskText = inputBox.value.trim();
            if(!taskText) {
                inputBox.focus();
                return;
            }

            const dueDate = document.getElementById('dueDate').value;
            const priority = document.getElementById('taskPriority').value;
            
            const taskId = Date.now();
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.dataset.id = taskId;
            taskItem.dataset.status = "todo";
            taskItem.dataset.priority = priority;
            if(dueDate) taskItem.dataset.due = dueDate;
            
            taskItem.innerHTML = createTaskHTML(taskText, priority, dueDate, 'todo');
            
            listContainer.insertBefore(taskItem, listContainer.firstChild);
            resetForm();
            saveData();
            animateTask(taskItem);
            updateEmptyState();
            
            // Add event listeners for task buttons
            setupTaskButtons(taskItem);
        }

        function createTaskHTML(text, priority, dueDate, status) {
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
                        ${dueDate ? `
                        <div class="task-due ${isOverdue(dueDate) ? 'overdue' : ''}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                                <path d="M16 2v4"></path>
                                <path d="M8 2v4"></path>
                                <path d="M3 10h18"></path>
                            </svg>
                            ${formatDueDate(dueDate)}
                        </div>` : ''}
                    </div>
                </div>
            `;
        }

        function setupTaskButtons(taskItem) {
            // Status buttons
            taskItem.querySelectorAll('.status-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const status = this.classList.contains('status-todo') ? 'todo' :
                                  this.classList.contains('status-in-progress') ? 'in-progress' : 'done';
                    
                    taskItem.dataset.status = status;
                    taskItem.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Animation for status change
                    if(status === 'done') {
                        taskItem.style.opacity = '0.8';
                        taskItem.querySelector('.task-title').style.textDecoration = 'line-through';
                    } else {
                        taskItem.style.opacity = '1';
                        taskItem.querySelector('.task-title').style.textDecoration = 'none';
                    }
                    
                    saveData();
                });
            });
            
            // Edit button
            taskItem.querySelector('.edit-btn').addEventListener('click', function() {
                editTask(taskItem);
            });
            
            // Delete button
            taskItem.querySelector('.delete-btn').addEventListener('click', function() {
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
            const currentDue = taskItem.dataset.due || '';
            const currentPriority = taskItem.dataset.priority;
            
            taskItem.innerHTML = `
                <div class="edit-form">
                    <input type="text" class="edit-input" value="${taskTitle}">
                    <div class="edit-options">
                        <input type="date" class="edit-due" value="${currentDue}">
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
            
            // Initialize date picker for edit form
            flatpickr(".edit-due", {
                dateFormat: "Y-m-d"
            });
            
            // Event listeners for edit buttons
            taskItem.querySelector('.save-edit').addEventListener('click', function() {
                const newText = taskItem.querySelector('.edit-input').value.trim();
                if(newText) {
                    const newDue = taskItem.querySelector('.edit-due').value;
                    const newPriority = taskItem.querySelector('.edit-priority').value;
                    
                    taskItem.dataset.due = newDue;
                    taskItem.dataset.priority = newPriority;
                    
                    const status = taskItem.dataset.status;
                    taskItem.innerHTML = createTaskHTML(newText, newPriority, newDue, status);
                    
                    setupTaskButtons(taskItem);
                    saveData();
                }
            });
            
            taskItem.querySelector('.cancel-edit').addEventListener('click', function() {
                const status = taskItem.dataset.status;
                const priority = taskItem.dataset.priority;
                const due = taskItem.dataset.due;
                
                taskItem.innerHTML = createTaskHTML(taskTitle, priority, due, status);
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
                emptyState.style.display = 'block';
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
                    due: task.dataset.due || ''
                });
            });
            // Using in-memory storage instead of localStorage for Claude artifacts
            window.taskData = tasks;
        }

        function showTasks() {
            // Using in-memory storage instead of localStorage for Claude artifacts
            const savedTasks = window.taskData || [];
            
            savedTasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                taskItem.dataset.id = task.id;
                taskItem.dataset.status = task.status;
                taskItem.dataset.priority = task.priority;
                if(task.due) taskItem.dataset.due = task.due;
                
                taskItem.innerHTML = createTaskHTML(task.text, task.priority, task.due, task.status);
                
                listContainer.appendChild(taskItem);
                setupTaskButtons(taskItem);
                
                if(task.status === 'done') {
                    taskItem.style.opacity = '0.8';
                    taskItem.querySelector('.task-title').style.textDecoration = 'line-through';
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