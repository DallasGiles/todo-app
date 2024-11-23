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
  
    let selectedTask = null; 
  
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
  
    const calculateDaysRemaining = (dueDate) => {
      if (!dueDate) return { text: 'No due date', className: 'on-time' };
  
      const today = new Date().setHours(0, 0, 0, 0);
      const dueDateTime = new Date(dueDate).setHours(0, 0, 0, 0);
      const differenceInMs = dueDateTime - today;
      const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
  
      if (differenceInDays > 0) return { text: `${differenceInDays} day(s) remaining`, className: 'on-time' };
      if (differenceInDays === 0) return { text: 'Due today!', className: 'due-today' };
      return { text: `Overdue by ${Math.abs(differenceInDays)} day(s)`, className: 'overdue' };
    };
  
    const refreshTasks = () => {
      const tasks = getStoredTasks();
      const today = new Date().toISOString().split('T')[0];
  
      tasks.forEach((task) => {
        if (task.repeat !== 'none' && task.lastUpdated !== today) {
          updateRecurringTask(task);
        }
      });
  
      saveTasks(tasks);
  
      const filteredTasks = filterTasks(tasks);
  
     
      overdueTasksList.innerHTML = '';
      todoTasksList.innerHTML = '';
      inProgressTasksList.innerHTML = '';
      completedTasksList.innerHTML = '';
  
      let hasOverdueTasks = false;
  
      // Categorize and populate tasks
      filteredTasks.forEach((task) => {
        const listItem = document.createElement('li');
        listItem.dataset.priority = task.priority;
  
       
        const { text: daysRemaining, className } = calculateDaysRemaining(task.dueDate);
  
        listItem.innerHTML = `
          ${task.name} (${task.type === 'recurring' ? task.repeat : `Due: ${task.dueDate}`})
          <span class="countdown ${className}">${daysRemaining}</span>
          <div class="task-actions">
            <button class="${task.status === 'completed' ? 'complete-btn' : 'in-progress-btn'}" 
              data-id="${task.id}">
              ${task.status === 'completed' ? 'Undo' : task.status === 'in-progress' ? 'Complete' : 'In Progress'}
            </button>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
          </div>
        `;
  
        
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
      selectedTask = task; 
      taskNameDisplay.textContent = task.name || 'No task name available';
      taskDetails.textContent = task.description || 'No description available for this task.';
      editTaskButton.style.display = 'inline'; 
    };
  
    const deleteTask = (id) => {
      const tasks = getStoredTasks();
      const updatedTasks = tasks.filter((t) => t.id !== id); 
      saveTasks(updatedTasks);
  
      // Reset the description section if the deleted task was selected
      if (selectedTask && selectedTask.id === id) {
        selectedTask = null;
        taskNameDisplay.textContent = 'Select a task to view its details';
        taskDetails.textContent = 'Select a task to view its description.';
        editTaskButton.style.display = 'none'; 
      }
  
      refreshTasks();
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
      task.status = 'todo'; 
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
        status: 'todo', 
        lastUpdated: null, 
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
    searchInput.addEventListener('input', refreshTasks);
    filterDropdown.addEventListener('change', refreshTasks);
  
    refreshTasks();
  });