document.addEventListener('DOMContentLoaded', () => {
    const taskNameInput = document.getElementById('taskName');
    const taskTypeSelect = document.getElementById('taskType');
    const repeatOptionsDiv = document.getElementById('repeatOptions');
    const taskRepeatSelect = document.getElementById('taskRepeat');
    const taskPrioritySelect = document.getElementById('taskPriority');
    const dueDateInput = document.getElementById('dueDate');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const addTaskButton = document.getElementById('addTask');
    const searchInput = document.getElementById('searchTasks');
    const filterDropdown = document.getElementById('filterTasks');
    const overdueTasksList = document.getElementById('overdueTasks');
    const todoTasksList = document.getElementById('todoTasks');
    const inProgressTasksList = document.getElementById('inProgressTasks');
    const completedTasksList = document.getElementById('completedTasks');
    const overdueColumn = document.getElementById('overdueColumn');
    const taskNameDisplay = document.getElementById('taskNameDisplay');
    const taskDetails = document.getElementById('taskDetails');
    const editTaskButton = document.getElementById('editTaskButton');
  
    const editModal = document.getElementById('editModal');
    const editTaskNameInput = document.getElementById('editTaskName');
    const editTaskDescriptionInput = document.getElementById('editTaskDescription');
    const saveEditButton = document.getElementById('saveEditButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
  
    let selectedTask = null; // Track the currently selected task
  
    // Set default date to the current day
    const setDefaultDate = () => {
      const today = new Date().toISOString().split('T')[0];
      dueDateInput.value = today;
    };
  
    const getStoredTasks = () => JSON.parse(localStorage.getItem('tasks')) || [];
    const saveTasks = (tasks) => localStorage.setItem('tasks', JSON.stringify(tasks));
  
    const generateTaskId = () => `task-${Date.now()}`;
  
    const isOverdue = (dueDate) => {
      if (!dueDate) return false;
      const today = new Date().toISOString().split('T')[0];
      return new Date(dueDate) < new Date(today);
    };
  
    const refreshTasks = () => {
      const tasks = getStoredTasks();
      const today = new Date().toISOString().split('T')[0];
  
      // Auto-update recurring tasks
      tasks.forEach((task) => {
        if (task.repeat !== 'none' && task.lastUpdated !== today) {
          updateRecurringTask(task);
        }
      });
  
      saveTasks(tasks);
  
      // Apply filtering and search
      const filteredTasks = filterTasks(tasks);
  
      // Clear task lists
      overdueTasksList.innerHTML = '';
      todoTasksList.innerHTML = '';
      inProgressTasksList.innerHTML = '';
      completedTasksList.innerHTML = '';
  
      let hasOverdueTasks = false;
  
      // Categorize and populate tasks
      filteredTasks.forEach((task) => {
        const listItem = document.createElement('li');
        listItem.dataset.priority = task.priority;
        listItem.innerHTML = `
          ${task.name} (${task.type === 'recurring' ? task.repeat : `Due: ${task.dueDate}`})
          <div class="task-actions">
            <button class="${task.status === 'completed' ? 'complete-btn' : 'in-progress-btn'}" 
              data-id="${task.id}">
              ${task.status === 'completed' ? 'Undo' : task.status === 'in-progress' ? 'Complete' : 'In Progress'}
            </button>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
          </div>
        `;
  
        // Add event listeners
        listItem.addEventListener('click', () => displayTaskDescription(task));
        listItem.querySelector('.complete-btn, .in-progress-btn').addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering the description display
          updateTaskStatus(task.id);
        });
        listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering the description display
          deleteTask(task.id);
        });
  
        if (task.status === 'completed') {
          completedTasksList.appendChild(listItem);
        } else if (isOverdue(task.dueDate) && task.status !== 'completed') {
          hasOverdueTasks = true;
          overdueTasksList.appendChild(listItem);
        } else if (task.status === 'in-progress') {
          inProgressTasksList.appendChild(listItem);
        } else {
          todoTasksList.appendChild(listItem);
        }
      });
  
      // Toggle overdue column visibility
      overdueColumn.style.display = hasOverdueTasks ? 'block' : 'none';
    };
  
    const filterTasks = (tasks) => {
      const searchTerm = searchInput.value.toLowerCase();
      const filterValue = filterDropdown.value;
  
      return tasks.filter((task) => {
        const matchesSearch = task.name.toLowerCase().includes(searchTerm);
  
        let matchesFilter = true;
        if (filterValue === 'todo') matchesFilter = task.status === 'todo';
        else if (filterValue === 'in-progress') matchesFilter = task.status === 'in-progress';
        else if (filterValue === 'completed') matchesFilter = task.status === 'completed';
        else if (filterValue === 'overdue') matchesFilter = isOverdue(task.dueDate);
        else if (filterValue === 'high') matchesFilter = task.priority === 'high';
        else if (filterValue === 'medium') matchesFilter = task.priority === 'medium';
        else if (filterValue === 'low') matchesFilter = task.priority === 'low';
        else if (filterValue === 'one-time') matchesFilter = task.type === 'one-time';
        else if (filterValue === 'recurring') matchesFilter = task.type === 'recurring';
  
        return matchesSearch && matchesFilter;
      });
    };
  
    const displayTaskDescription = (task) => {
      selectedTask = task; // Store the currently selected task
      taskNameDisplay.textContent = task.name || 'No task name available';
      taskDetails.textContent = task.description || 'No description available for this task.';
      editTaskButton.style.display = 'inline'; // Show the edit button
    };
  
    const updateTaskStatus = (id) => {
      const tasks = getStoredTasks();
      const task = tasks.find((t) => t.id === id);
  
      // Cycle through statuses: todo -> in-progress -> completed -> todo
      if (task.status === 'todo') {
        task.status = 'in-progress';
      } else if (task.status === 'in-progress') {
        task.status = 'completed';
      } else {
        task.status = 'todo';
      }
  
      saveTasks(tasks);
      refreshTasks();
    };
  
    const deleteTask = (id) => {
  const tasks = getStoredTasks();
  const updatedTasks = tasks.filter((t) => t.id !== id); // Remove task by id
  saveTasks(updatedTasks);

  // Reset the description section if the deleted task was selected
  if (selectedTask && selectedTask.id === id) {
    selectedTask = null;
    taskNameDisplay.textContent = 'Select a task to view its details';
    taskDetails.textContent = 'Select a task to view its description.';
    editTaskButton.style.display = 'none'; // Hide the edit button
  }

  refreshTasks();
};

const toggleRepeatOptions = () => {
    if (taskTypeSelect.value === 'recurring') {
      repeatOptionsDiv.style.display = 'block';
    } else {
      repeatOptionsDiv.style.display = 'none';
    }
  };

    const updateRecurringTask = (task) => {
      const today = new Date().toISOString().split('T')[0];
      const taskDueDate = new Date(task.dueDate);
  
      if (task.repeat === 'daily') {
        task.dueDate = today;
      } else if (task.repeat === 'weekly') {
        taskDueDate.setDate(taskDueDate.getDate() + 7);
        task.dueDate = taskDueDate.toISOString().split('T')[0];
      } else if (task.repeat === 'monthly') {
        taskDueDate.setMonth(taskDueDate.getMonth() + 1);
        task.dueDate = taskDueDate.toISOString().split('T')[0];
      }
  
      task.lastUpdated = today;
      task.status = 'todo'; // Reset status for recurring tasks
    };

    const showEditModal = () => {
      if (!selectedTask) return;
  
      // Populate modal fields with the selected task's data
      editTaskNameInput.value = selectedTask.name;
      editTaskDescriptionInput.value = selectedTask.description || '';
      editModal.classList.remove('hidden'); // Show the modal
    };
  
    const hideEditModal = () => {
      editModal.classList.add('hidden'); // Hide the modal
    };
  
    const saveTaskEdits = () => {
      if (!selectedTask) return;
  
      const newName = editTaskNameInput.value.trim();
      const newDescription = editTaskDescriptionInput.value.trim();
  
      if (newName) selectedTask.name = newName;
      selectedTask.description = newDescription;
  
      const tasks = getStoredTasks();
      const taskIndex = tasks.findIndex((t) => t.id === selectedTask.id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = selectedTask; // Update task in storage
        saveTasks(tasks);
        refreshTasks();
        displayTaskDescription(selectedTask); // Refresh the display
      }
  
      hideEditModal(); // Hide the modal after saving
    };
  
    addTaskButton.addEventListener('click', () => {
      const taskName = taskNameInput.value.trim();
      const taskType = taskTypeSelect.value;
      const taskRepeat = taskRepeatSelect.value;
      const dueDate = dueDateInput.value;
      const taskPriority = taskPrioritySelect.value;
      const taskDescription = taskDescriptionInput.value.trim();
  
      if (!taskName || (taskType === 'one-time' && !dueDate)) {
        alert('Please provide a task name and a valid due date for one-time tasks.');
        return;
      }
  
      const tasks = getStoredTasks();
      tasks.push({
        id: generateTaskId(),
        name: taskName,
        type: taskType,
        repeat: taskRepeat,
        dueDate: dueDate || null,
        priority: taskPriority,
        description: taskDescription || null,
        status: 'todo', // New tasks start in the "To-Do" column
        lastUpdated: null, // Track when the task was last updated
      });
  
      saveTasks(tasks);
      taskNameInput.value = '';
      taskRepeatSelect.value = 'none';
      taskPrioritySelect.value = 'low';
      taskDescriptionInput.value = '';
      setDefaultDate();
      refreshTasks();
    });
  
    // Initialize the app
    setDefaultDate();
    taskTypeSelect.addEventListener('change', toggleRepeatOptions);
    searchInput.addEventListener('input', refreshTasks);
    filterDropdown.addEventListener('change', refreshTasks);
    editTaskButton.addEventListener('click', showEditModal);
    saveEditButton.addEventListener('click', saveTaskEdits);
    cancelEditButton.addEventListener('click', hideEditModal);
  
    refreshTasks();
  });