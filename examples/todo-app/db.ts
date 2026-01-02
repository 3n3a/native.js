import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";

// Ensure data directory exists
await mkdir("./data", { recursive: true });

// Initialize database
const db = new Database("./data/todo.db");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Create tables
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    )
`);

// User queries
export const userQueries = {
    create: db.prepare<{ id: number }, [string, string]>(
        "INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id"
    ),
    findByUsername: db.prepare<{ id: number; username: string; password_hash: string }, [string]>(
        "SELECT id, username, password_hash FROM users WHERE username = ?"
    ),
    findById: db.prepare<{ id: number; username: string }, [number]>(
        "SELECT id, username FROM users WHERE id = ?"
    ),
};

// List queries
export const listQueries = {
    create: db.prepare<{ id: number; name: string; created_at: string }, [number, string]>(
        "INSERT INTO lists (user_id, name) VALUES (?, ?) RETURNING id, name, created_at"
    ),
    findByUser: db.prepare<{ id: number; name: string; created_at: string }, [number]>(
        "SELECT id, name, created_at FROM lists WHERE user_id = ? ORDER BY created_at DESC"
    ),
    findById: db.prepare<{ id: number; user_id: number; name: string; created_at: string }, [number]>(
        "SELECT id, user_id, name, created_at FROM lists WHERE id = ?"
    ),
    update: db.prepare<null, [string, number]>(
        "UPDATE lists SET name = ? WHERE id = ?"
    ),
    delete: db.prepare<null, [number]>(
        "DELETE FROM lists WHERE id = ?"
    ),
};

// Todo queries
export const todoQueries = {
    create: db.prepare<{ id: number; text: string; completed: number; created_at: string }, [number, string]>(
        "INSERT INTO todos (list_id, text) VALUES (?, ?) RETURNING id, text, completed, created_at"
    ),
    findByList: db.prepare<{ id: number; text: string; completed: number; created_at: string }, [number]>(
        "SELECT id, text, completed, created_at FROM todos WHERE list_id = ? ORDER BY created_at ASC"
    ),
    findById: db.prepare<{ id: number; list_id: number; text: string; completed: number }, [number]>(
        "SELECT id, list_id, text, completed FROM todos WHERE id = ?"
    ),
    update: db.prepare<null, [string, number, number]>(
        "UPDATE todos SET text = ?, completed = ? WHERE id = ?"
    ),
    toggleComplete: db.prepare<null, [number]>(
        "UPDATE todos SET completed = NOT completed WHERE id = ?"
    ),
    delete: db.prepare<null, [number]>(
        "DELETE FROM todos WHERE id = ?"
    ),
};

export { db };

