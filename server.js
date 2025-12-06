// server.js - full-stack TaskBoard backend with related tables

var express = require('express');
var path = require('path');
// NOTE: Use 'sqlite3' for local development. Render will re-compile this binary.
var sqlite3 = require('sqlite3').verbose(); 
var bodyParser = require('body-parser');

var app = express();

// use JSON body parser
app.use(bodyParser.json());

// serve the files in public/ (index.html, styles.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));

// open (or create) the SQLite database file
var DB_PATH = path.join(__dirname, 'tasks.db');
var db = new sqlite3.Database(DB_PATH, function(err) {
  if (err) {
    console.error('Could not open DB', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite DB at', DB_PATH);
  }
});

// CREATE TWO RELATED TABLES (Tasks and Categories)
var createSql = `
-- Table 1: Categories (The parent table)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Table 2: Tasks (The child table, linked via category_id)
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  dueDate TEXT NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
`;
db.exec(createSql, function(err) { // Use db.exec() for multiple statements
  if (err) {
    console.error('Failed to create tables', err);
  }
});


// GET /api/tasks - return all tasks as JSON (USES JOIN)
app.get('/api/tasks', function(req, res) {
  // Use a JOIN to fetch the category name (c.name) along with the task details (t.*)
  var sql = `
    SELECT 
      t.*, 
      c.name AS category 
    FROM tasks t 
    JOIN categories c ON t.category_id = c.id 
    ORDER BY t.dueDate ASC, t.priority ASC
  `; 
  db.all(sql, [], function(err, rows) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});


// POST /api/tasks - add a new task (Handles Category lookup/insertion)
app.post('/api/tasks', function(req, res) {
  var title = req.body.title;
  var categoryName = req.body.category;
  var priority = req.body.priority;
  var dueDate = req.body.dueDate;
  var description = req.body.description || null;

  if (!title || !categoryName || !priority || !dueDate) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // 1. Find or create the category ID
  db.get('SELECT id FROM categories WHERE name = ?', [categoryName], function(err, row) {
    if (err) { return res.status(500).json({ error: err.message }); }

    var categoryId;
    if (row) {
      categoryId = row.id;
      insertTask(categoryId);
    } else {
      // Insert new category if it doesn't exist
      db.run('INSERT INTO categories (name) VALUES (?)', [categoryName], function(err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        categoryId = this.lastID;
        insertTask(categoryId);
      });
    }
  });

  // 2. Insert the task using the categoryId
  function insertTask(categoryId) {
    var sql = 'INSERT INTO tasks (title, category_id, priority, dueDate, description) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [title, categoryId, priority, dueDate, description], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id: this.lastID });
      }
    });
  }
});

// DELETE /api/tasks/:id - delete a task
app.delete('/api/tasks/:id', function(req, res) {
  var id = Number(req.params.id);
  var sql = 'DELETE FROM tasks WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.json({ deleted: true });
    }
  });
});

// serve index.html at root (already covered by express.static but this is explicit)
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// start server
var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Server listening on port', PORT);
});