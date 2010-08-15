CREATE TABLE IF NOT EXISTS budgets (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), status CHAR(20) DEFAULT "active", description VARCHAR(1024))
CREATE TABLE if NOT EXISTS lines (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, budget_id INTEGER NOT NULL, text VARCHAR(255), parent_id INTEGER NOT NULL DEFAULT 0, type CHAR(20) NOT NULL)