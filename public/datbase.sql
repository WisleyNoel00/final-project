-- 1. Table Creation Statements (Two Related Tables)
--------------------------------------------------

-- Table 1: Categories (Parent Table)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Table 2: Tasks (Child Table, with Foreign Key)
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  dueDate TEXT NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);


-- 2. INSERT Statements (At least 5 per table)
---------------------------------------------

-- Categories Inserts (for 5 tasks)
INSERT INTO categories (name) VALUES ('Work');
INSERT INTO categories (name) VALUES ('Personal');
INSERT INTO categories (name) VALUES ('Health');

-- Tasks Inserts (using category IDs)
-- Assuming Work=1, Personal=2, Health=3
INSERT INTO tasks (title, category_id, priority, dueDate, description) VALUES 
('Finish Project Outline', 1, 1, '2025-12-10', 'Review all requirements and create a README.');

INSERT INTO tasks (title, category_id, priority, dueDate, description) VALUES 
('Book Dentist Appointment', 3, 5, '2025-12-15', 'Call office to schedule checkup.');

INSERT INTO tasks (title, category_id, priority, dueDate, description) VALUES 
('Grocery Shopping', 2, 4, '2025-12-07', 'Buy milk, eggs, bread.');

INSERT INTO tasks (title, category_id, priority, dueDate, description) VALUES 
('Deploy Application to Render', 1, 1, '2025-12-08', 'Ensure all environment variables are set.');

INSERT INTO tasks (title, category_id, priority, dueDate, description) VALUES 
('Run 5K', 3, 3, '2025-12-12', 'Morning run before work.');


-- 3. Three SELECT Queries
--------------------------

-- 1. Basic SELECT: Retrieve all tasks ordered by due date
SELECT * FROM tasks ORDER BY dueDate ASC;


-- 2. JOIN query between related tables: Retrieve tasks with the category name
SELECT 
    t.title, 
    c.name AS category_name, 
    t.dueDate, 
    t.priority
FROM tasks t
JOIN categories c ON t.category_id = c.id
ORDER BY t.priority ASC;


-- 3. Filtered or aggregated query (using WHERE and GROUP BY)
-- Count the number of tasks in each category that have a high priority (1 or 2).
SELECT 
    c.name AS category_name, 
    COUNT(t.id) AS high_priority_task_count
FROM tasks t
JOIN categories c ON t.category_id = c.id
WHERE t.priority IN (1, 2)
GROUP BY c.name
HAVING high_priority_task_count > 0;