// server.js - beginner-friendly backend
// - Serves static files from /public
// - Provides /api/tasks GET, POST, DELETE
// - Uses a local SQLite file tasks.db

var express = require('express');
var path = require('path');
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

// create table if it doesn't exist
var createSql = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL,
  dueDate TEXT NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
`;
db.run(createSql, function(err) {
  if (err) {
    console.error('Failed to create table', err);
  }
});

// GET /api/tasks - return all tasks as JSON
app.get('/api/tasks', function(req, res) {
  var sql = 'SELECT * FROM tasks ORDER BY dueDate ASC, priority ASC';
  db.all(sql, [], function(err, rows) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// POST /api/tasks - add a new task
app.post('/api/tasks', function(req, res) {
  var title = req.body.title;
  var category = req.body.category;
  var priority = req.body.priority;
  var dueDate = req.body.dueDate;
  var description = req.body.description || null;

  if (!title || !category || !priority || !dueDate) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  var sql = 'INSERT INTO tasks (title, category, priority, dueDate, description) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [title, category, priority, dueDate, description], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
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
