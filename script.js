// Sort tasks by priority: Red (high) -> Yellow (medium) -> Green (low)
function sortTasksByPriority() {
    const taskList = document.getElementById('task-list');
    const tasks = Array.from(taskList.children); // Get all tasks as an array
    tasks.sort((a, b) => {
        const priorityA = a.classList.contains('priority-red') ? 1 : 
                          a.classList.contains('priority-yellow') ? 2 : 3;
        const priorityB = b.classList.contains('priority-red') ? 1 : 
                          b.classList.contains('priority-yellow') ? 2 : 3;
        return priorityA - priorityB; // Sort based on priority: 1 (red) -> 2 (yellow) -> 3 (green)
    });
    
    // Re-append tasks in sorted order
    tasks.forEach(task => taskList.appendChild(task));
}

// Function to filter tasks
function filterTasks(filter) {
    const taskList = document.getElementById('task-list');
    const tasks = document.querySelectorAll('#task-list li'); // Select all tasks

    tasks.forEach(task => {
        task.style.display = 'flex'; // Reset display for all tasks
        
        // Apply the filter
        if (filter === 'completed' && !task.classList.contains('completed')) {
            task.style.display = 'none'; // Hide non-completed tasks
        } else if (filter === 'priority-red' && !task.classList.contains('priority-red')) {
            task.style.display = 'none'; // Hide non-priority-red tasks
        } else if (filter === 'all') {
            task.style.display = 'flex'; // Show all tasks
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const selectedDateDisplay = document.getElementById('selected-date');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const importanceSelect = document.getElementById('task-importance');
    const taskModal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const recurringSelect = document.getElementById('recurring');
    const clockFormatSelect = document.getElementById('clock-format');
    const categorySelect = document.getElementById('category');
    const progressBar = document.getElementById('progress-bar');

    let selectedDate = null;
    let taskEvents = {};

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        timeZone: 'local',
        selectable: true,
        editable: true,
        dateClick: function (info) {
            selectedDate = info.date;
            selectedDateDisplay.textContent = `Tasks for ${new Date(selectedDate).toDateString()}`;
            taskInput.value = '';
            startTimeInput.value = '';
            endTimeInput.value = '';
            taskModal.style.display = 'block';
        },
        events: []
    });

    calendar.render();

    closeModalBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === taskModal) {
            taskModal.style.display = 'none';
        }
    });

    // Task form submission
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const taskText = taskInput.value.trim();
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const importance = importanceSelect.value;
        const recurrence = recurringSelect.value;
        const category = categorySelect.value;
        const selectedFormat = clockFormatSelect.value; // 12 or 24 hour format

        if (!taskText || !selectedDate || !startTime || !endTime) {
            alert('Please fill out all the fields.');
            return;
        }

        // Create and add calendar event
        const taskEvent = calendar.addEvent({
            title: taskText,
            start: `${selectedDate.toISOString().split('T')[0]}T${startTime}`,
            end: `${selectedDate.toISOString().split('T')[0]}T${endTime}`,
            allDay: false,
            backgroundColor: importance === 'red' ? 'rgba(255, 0, 0, 0.5)' :
                             importance === 'yellow' ? 'rgba(255, 255, 0, 0.5)' :
                             'rgba(0, 128, 0, 0.5)',
            textColor: importance === 'yellow' ? 'black' : 'white'
        });

        taskEvents[taskText] = taskEvent;  // Store the event

        if (recurrence !== 'none') {
            addRecurringEvents(taskEvent, recurrence);
        }

        const taskItem = document.createElement('li');
taskItem.innerHTML = `
    <span>${taskText} (${startTime} - ${endTime})</span>
    <button class="delete-btn"><i class="fas fa-trash"></i></button>
    <button class="edit-btn"><i class="fas fa-edit"></i></button>`;
taskItem.classList.add(`priority-${importance}`);
taskItem.classList.add(category);

        // Toggle task completion (strike-through effect)
        taskItem.addEventListener('click', function (e) {
            if (!e.target.closest('.delete-btn') && !e.target.closest('.edit-btn')) {
                taskItem.classList.toggle('completed');
                updateProgress();
            }
        });

        // Add delete task functionality
        taskItem.querySelector('.delete-btn').addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent other events from triggering
            taskList.removeChild(taskItem);

            // Correct method to remove event from FullCalendar
            if (taskEvents[taskText]) {
                taskEvents[taskText].remove();  // Use the event's remove method
                delete taskEvents[taskText];
            }

            updateProgress();
        });

        // Edit task functionality
        taskItem.querySelector('.edit-btn').addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent other events from triggering
            taskInput.value = taskText;
            startTimeInput.value = startTime;
            endTimeInput.value = endTime;
            taskModal.style.display = 'block';
            taskList.removeChild(taskItem);

            // Remove the corresponding event
            if (taskEvents[taskText]) {
                taskEvents[taskText].remove();
                delete taskEvents[taskText];
            }
        });

        taskList.appendChild(taskItem);
        taskModal.style.display = 'none';

        updateProgress();
    });

    // Function to update task progress
    function updateProgress() {
        const totalTasks = taskList.children.length;
        const completedTasks = document.querySelectorAll('.completed').length;
        const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }

    // Add recurring tasks
    function addRecurringEvents(taskEvent, recurrence) {
        let nextDate = new Date(selectedDate);
        const limit = 10;

        for (let i = 0; i < limit; i++) {
            const newEvent = { ...taskEvent };
            newEvent.start = new Date(nextDate).toISOString();
            newEvent.end = new Date(nextDate).toISOString();
            calendar.addEvent(newEvent);

            if (recurrence === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (recurrence === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (recurrence === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
        }
    }

    // Dark mode toggle
    darkModeToggle.addEventListener('change', function () {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    });

    // Drag-and-drop functionality for task reordering
    taskList.addEventListener('dragstart', (e) => {
        e.target.classList.add('dragging');
    });

    taskList.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
    });

    taskList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(taskList, e.clientY);
        const draggingTask = document.querySelector('.dragging');
        if (afterElement == null) {
            taskList.appendChild(draggingTask);
        } else {
            taskList.insertBefore(draggingTask, afterElement);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});
