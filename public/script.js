// script.js - beginner-friendly frontend logic
// This file:
// - loads tasks from the backend
// - renders them into the table and category list
// - handles form submission (adds a task)
// - handles delete buttons

// find important elements
var form = document.getElementById('task-form');
var tasksTableBody = document.querySelector('#tasks-table tbody');
var categoryList = document.getElementById('category-list');
var formError = document.getElementById('form-error');

// LOAD tasks from backend and render them
function loadTasks() {
  // fetch() returns a Promise, use then() to handle it
  fetch('/api/tasks')
    .then(function(response) { return response.json(); })
    .then(function(tasks) {
      renderTasks(tasks);
      renderCategories(tasks);
    })
    .catch(function(error) {
      console.error('Error loading tasks:', error);
    });
}

// RENDER tasks into table
function renderTasks(tasks) {
  // clear existing rows
  tasksTableBody.innerHTML = '';

  // for each task, create a table row
  tasks.forEach(function(task) {
    var tr = document.createElement('tr');

    // simple-safe text insertion
    function safeText(text) {
      return (text === null || text === undefined) ? '' : String(text);
    }

    var due = safeText(task.dueDate);
    // format date: simple approach
    var dueDisplay = due ? new Date(due).toLocaleDateString() : '';

    tr.innerHTML = ''
      + '<td>' + safeText(task.title) + '</td>'
      + '<td>' + safeText(task.category) + '</td>'
      + '<td>' + safeText(task.priority) + '</td>'
      + '<td>' + dueDisplay + '</td>'
      + '<td>' + safeText(task.description) + '</td>'
      + '<td><button data-id="' + task.id + '" class="delete-btn">Delete</button></td>';

    tasksTableBody.appendChild(tr);
  });

  // attach delete event handlers (after rows are in the DOM)
  var deleteButtons = tasksTableBody.querySelectorAll('.delete-btn');
  deleteButtons.forEach(function(btn) {
    btn.addEventListener('click', function(event) {
      var id = event.target.getAttribute('data-id');
      deleteTask(id);
    });
  });
}

// RENDER categories (counts)
function renderCategories(tasks) {
  var counts = {};
  tasks.forEach(function(t) {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });

  categoryList.innerHTML = '';
  var keys = Object.keys(counts);
  if (keys.length === 0) {
    categoryList.innerHTML = '<li>No categories yet</li>';
    return;
  }

  keys.forEach(function(cat) {
    var li = document.createElement('li');
    li.textContent = cat + ' (' + counts[cat] + ')';
    categoryList.appendChild(li);
  });
}

// DELETE a task by id
function deleteTask(id) {
  fetch('/api/tasks/' + id, { method: 'DELETE' })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      loadTasks(); // reload list after delete
    })
    .catch(function(error) {
      console.error('Error deleting task:', error);
    });
}

// FORM validation (very simple)
function validateForm(data) {
  var errors = [];
  if (!data.title || data.title.trim().length < 2) {
    errors.push('Title must be at least 2 characters');
  }
  if (!data.category || data.category.trim() === '') {
    errors.push('Category is required');
  }
  if (!data.dueDate) {
    errors.push('Due date is required');
  }
  var p = Number(data.priority);
  if (!Number.isInteger(p) || p < 1 || p > 5) {
    errors.push('Priority must be an integer between 1 and 5');
  }
  return errors;
}

// HANDLE form submit
form.addEventListener('submit', function(e) {
  e.preventDefault(); // stop the browser from reloading the page
  formError.textContent = '';

  var data = {
    title: form.title.value.trim(),
    category: form.category.value.trim(),
    priority: form.priority.value,
    dueDate: form.dueDate.value,
    description: form.description.value.trim()
  };

  var errors = validateForm(data);
  if (errors.length > 0) {
    formError.textContent = errors.join(' • ');
    return;
  }

  // send the data to backend
  fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(response) {
    if (!response.ok) {
      return response.json().then(function(json) {
        throw new Error(json.error || 'Server error');
      });
    }
    // reset form and reload tasks
    form.reset();
    loadTasks();
  })
  .catch(function(error) {
    formError.textContent = 'Could not add task: ' + error.message;
    console.error(error);
  });
});

// initial load when page opens
loadTasks();
