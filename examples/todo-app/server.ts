import { userQueries, listQueries, todoQueries } from "./db";

const PORT = 3001;

// Simple session store (in-memory for demo)
const sessions = new Map<string, number>();

function generateSessionId(): string {
    return crypto.randomUUID();
}

function hashPassword(password: string): string {
    return Bun.hash(password).toString(16);
}

function verifyPassword(password: string, hash: string): boolean {
    return Bun.hash(password).toString(16) === hash;
}

function getUserIdFromRequest(req: Request): number | null {
    const cookie = req.headers.get("cookie");
    if (!cookie) return null;
    
    const sessionMatch = cookie.match(/session=([^;]+)/);
    if (!sessionMatch || !sessionMatch[1]) return null;
    
    const sessionId = sessionMatch[1];
    return sessions.get(sessionId) ?? null;
}

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

function errorResponse(message: string, status = 400): Response {
    return jsonResponse({ error: message }, status);
}

// Serve static files from current directory
async function serveStatic(pathname: string): Promise<Response | null> {
    // Map paths
    let filePath = pathname === "/" ? "./index.html" : `.${pathname}`;
    
    // Handle lib requests - serve from parent
    if (pathname.startsWith("/lib/")) {
        filePath = `..${pathname}`;
    }
    
    const file = Bun.file(filePath);
    if (await file.exists()) {
        return new Response(file);
    }
    return null;
}

Bun.serve({
    port: PORT,
    
    async fetch(req) {
        const url = new URL(req.url);
        const pathname = url.pathname;
        const method = req.method;
        
        // API Routes
        if (pathname.startsWith("/api/")) {
            // ==================== AUTH ====================
            
            // Register
            if (pathname === "/api/register" && method === "POST") {
                try {
                    const { username, password } = await req.json();
                    
                    if (!username || !password) {
                        return errorResponse("Username and password required");
                    }
                    
                    if (password.length < 4) {
                        return errorResponse("Password must be at least 4 characters");
                    }
                    
                    const existing = userQueries.findByUsername.get(username);
                    if (existing) {
                        return errorResponse("Username already exists");
                    }
                    
                    const passwordHash = hashPassword(password);
                    const result = userQueries.create.get(username, passwordHash);
                    
                    // Auto-login after register
                    const sessionId = generateSessionId();
                    sessions.set(sessionId, result!.id);
                    
                    return new Response(JSON.stringify({ 
                        success: true, 
                        user: { id: result!.id, username } 
                    }), {
                        headers: {
                            "Content-Type": "application/json",
                            "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; SameSite=Strict`
                        }
                    });
                } catch (e) {
                    return errorResponse("Registration failed");
                }
            }
            
            // Login
            if (pathname === "/api/login" && method === "POST") {
                try {
                    const { username, password } = await req.json();
                    
                    const user = userQueries.findByUsername.get(username);
                    if (!user || !verifyPassword(password, user.password_hash)) {
                        return errorResponse("Invalid username or password", 401);
                    }
                    
                    const sessionId = generateSessionId();
                    sessions.set(sessionId, user.id);
                    
                    return new Response(JSON.stringify({ 
                        success: true, 
                        user: { id: user.id, username: user.username } 
                    }), {
                        headers: {
                            "Content-Type": "application/json",
                            "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; SameSite=Strict`
                        }
                    });
                } catch (e) {
                    return errorResponse("Login failed");
                }
            }
            
            // Logout
            if (pathname === "/api/logout" && method === "POST") {
                const cookie = req.headers.get("cookie");
                const sessionMatch = cookie?.match(/session=([^;]+)/);
                if (sessionMatch?.[1]) {
                    sessions.delete(sessionMatch[1]);
                }
                
                return new Response(JSON.stringify({ success: true }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Set-Cookie": "session=; Path=/; HttpOnly; Max-Age=0"
                    }
                });
            }
            
            // Get current user
            if (pathname === "/api/me" && method === "GET") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const user = userQueries.findById.get(userId);
                if (!user) {
                    return errorResponse("User not found", 404);
                }
                
                return jsonResponse({ user });
            }
            
            // ==================== LISTS ====================
            
            // Get all lists for user
            if (pathname === "/api/lists" && method === "GET") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const lists = listQueries.findByUser.all(userId);
                return jsonResponse({ lists });
            }
            
            // Create list
            if (pathname === "/api/lists" && method === "POST") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                try {
                    const { name } = await req.json();
                    if (!name) {
                        return errorResponse("List name required");
                    }
                    
                    const list = listQueries.create.get(userId, name);
                    return jsonResponse({ list }, 201);
                } catch (e) {
                    return errorResponse("Failed to create list");
                }
            }
            
            // Update list
            const listUpdateMatch = pathname.match(/^\/api\/lists\/(\d+)$/);
            if (listUpdateMatch?.[1] && method === "PUT") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const listId = parseInt(listUpdateMatch[1]);
                const list = listQueries.findById.get(listId);
                
                if (!list) {
                    return errorResponse("List not found", 404);
                }
                if (list.user_id !== userId) {
                    return errorResponse("Not authorized", 403);
                }
                
                try {
                    const { name } = await req.json();
                    if (!name) {
                        return errorResponse("List name required");
                    }
                    
                    listQueries.update.run(name, listId);
                    return jsonResponse({ success: true, list: { ...list, name } });
                } catch (e) {
                    return errorResponse("Failed to update list");
                }
            }
            
            // Delete list
            if (listUpdateMatch?.[1] && method === "DELETE") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const listId = parseInt(listUpdateMatch[1]);
                const list = listQueries.findById.get(listId);
                
                if (!list) {
                    return errorResponse("List not found", 404);
                }
                if (list.user_id !== userId) {
                    return errorResponse("Not authorized", 403);
                }
                
                listQueries.delete.run(listId);
                return jsonResponse({ success: true });
            }
            
            // ==================== TODOS ====================
            
            // Get todos for a list
            const listTodosMatch = pathname.match(/^\/api\/lists\/(\d+)\/todos$/);
            if (listTodosMatch?.[1] && method === "GET") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const listId = parseInt(listTodosMatch[1]);
                const list = listQueries.findById.get(listId);
                
                if (!list) {
                    return errorResponse("List not found", 404);
                }
                if (list.user_id !== userId) {
                    return errorResponse("Not authorized", 403);
                }
                
                const todos = todoQueries.findByList.all(listId);
                return jsonResponse({ todos, list });
            }
            
            // Create todo
            if (listTodosMatch?.[1] && method === "POST") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const listId = parseInt(listTodosMatch[1]);
                const list = listQueries.findById.get(listId);
                
                if (!list) {
                    return errorResponse("List not found", 404);
                }
                if (list.user_id !== userId) {
                    return errorResponse("Not authorized", 403);
                }
                
                try {
                    const { text } = await req.json();
                    if (!text) {
                        return errorResponse("Todo text required");
                    }
                    
                    const todo = todoQueries.create.get(listId, text);
                    return jsonResponse({ todo }, 201);
                } catch (e) {
                    return errorResponse("Failed to create todo");
                }
            }
            
            // Update/Toggle todo
            const todoMatch = pathname.match(/^\/api\/todos\/(\d+)$/);
            if (todoMatch?.[1] && method === "PUT") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const todoId = parseInt(todoMatch[1]);
                const todo = todoQueries.findById.get(todoId);
                
                if (!todo) {
                    return errorResponse("Todo not found", 404);
                }
                
                // Verify ownership through list
                const list = listQueries.findById.get(todo.list_id);
                if (!list || list.user_id !== userId) {
                    return errorResponse("Not authorized", 403);
                }
                
                try {
                    const body = await req.json();
                    
                    // If just toggling completed status
                    if (body.toggle) {
                        todoQueries.toggleComplete.run(todoId);
                        return jsonResponse({ 
                            success: true, 
                            todo: { ...todo, completed: todo.completed ? 0 : 1 } 
                        });
                    }
                    
                    // Full update
                    const text = body.text ?? todo.text;
                    const completed = body.completed ?? todo.completed;
                    
                    todoQueries.update.run(text, completed, todoId);
                    return jsonResponse({ 
                        success: true, 
                        todo: { ...todo, text, completed } 
                    });
                } catch (e) {
                    return errorResponse("Failed to update todo");
                }
            }
            
            // Delete todo
            if (todoMatch?.[1] && method === "DELETE") {
                const userId = getUserIdFromRequest(req);
                if (!userId) {
                    return errorResponse("Not authenticated", 401);
                }
                
                const todoId = parseInt(todoMatch[1]);
                const todo = todoQueries.findById.get(todoId);
                
                if (!todo) {
                    return errorResponse("Todo not found", 404);
                }
                
                // Verify ownership through list
                const list = listQueries.findById.get(todo.list_id);
                if (!list || list.user_id !== userId) {
                    return errorResponse("Not authorized", 403);
                }
                
                todoQueries.delete.run(todoId);
                return jsonResponse({ success: true });
            }
            
            return errorResponse("Not found", 404);
        }
        
        // Static file serving with SPA fallback
        const staticResponse = await serveStatic(pathname);
        if (staticResponse) {
            return staticResponse;
        }
        
        // SPA fallback - serve index.html for unknown routes
        const indexFile = Bun.file("./index.html");
        if (await indexFile.exists()) {
            return new Response(indexFile);
        }
        
        return new Response("Not Found", { status: 404 });
    }
});

console.log(`🚀 Todo App running at http://localhost:${PORT}`);

