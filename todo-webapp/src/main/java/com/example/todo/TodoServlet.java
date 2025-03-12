package com.example.todo;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.ArrayList;

@WebServlet("/todo")
public class TodoServlet extends HttpServlet {
    // Thread-safe map to store todos per user
    private static final Map<String, List<TodoItem>> userTodos = new ConcurrentHashMap<>();
    private static int nextId = 1;

    @Override
    public void init() throws ServletException {
        // Initialize Firebase with the service account file
        FirebaseAuthUtil.initialize(null);
    }

    // Helper method to get authenticated user ID
    private String authenticateUser(HttpServletRequest request) throws ServletException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ServletException("Missing or invalid Authorization header");
        }
        String idToken = authHeader.substring(7);
        return FirebaseAuthUtil.verifyIdToken(idToken);
    }

    // Helper method to get user's todo list
    private List<TodoItem> getUserTodoList(String userId) {
        return userTodos.computeIfAbsent(userId, k -> new ArrayList<>());
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            String userId = authenticateUser(request);
            List<TodoItem> todos = getUserTodoList(userId);
            
            // Return all todos as JSON array
            StringBuilder jsonArray = new StringBuilder("[");
            for (int i = 0; i < todos.size(); i++) {
                if (i > 0) {
                    jsonArray.append(",");
                }
                jsonArray.append(todos.get(i).toJson());
            }
            jsonArray.append("]");
            
            out.print(jsonArray.toString());
        } catch (ServletException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"Failed to retrieve todos\"}");
            e.printStackTrace();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            String userId = authenticateUser(request);
            String description = request.getParameter("description");
            
            if (description == null || description.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\":\"Description is required\"}");
                return;
            }

            // Create new todo
            TodoItem newTodo = new TodoItem(nextId++, description.trim());
            getUserTodoList(userId).add(newTodo);
            
            // Return the created todo
            out.print(newTodo.toJson());
        } catch (ServletException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"Failed to create todo\"}");
            e.printStackTrace();
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            String userId = authenticateUser(request);
            String idStr = request.getParameter("id");
            String completedStr = request.getParameter("completed");
            
            if (idStr == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\":\"ID is required\"}");
                return;
            }

            int id = Integer.parseInt(idStr);
            boolean completed = Boolean.parseBoolean(completedStr);

            // Find and update todo
            List<TodoItem> userTodoList = getUserTodoList(userId);
            TodoItem todoToUpdate = null;
            for (TodoItem todo : userTodoList) {
                if (todo.getId() == id) {
                    todo.setCompleted(completed);
                    todoToUpdate = todo;
                    break;
                }
            }

            if (todoToUpdate == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\":\"Todo not found\"}");
                return;
            }

            // Return the updated todo
            out.print(todoToUpdate.toJson());
        } catch (ServletException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\":\"Invalid ID format\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"Failed to update todo\"}");
            e.printStackTrace();
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            String userId = authenticateUser(request);
            String idStr = request.getParameter("id");
            
            if (idStr == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\":\"ID is required\"}");
                return;
            }

            int id = Integer.parseInt(idStr);
            List<TodoItem> userTodoList = getUserTodoList(userId);

            // Find and remove todo
            boolean removed = userTodoList.removeIf(todo -> todo.getId() == id);

            if (!removed) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\":\"Todo not found\"}");
                return;
            }

            // Return success message
            out.print("{\"message\":\"Todo deleted successfully\"}");
        } catch (ServletException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\":\"Invalid ID format\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"Failed to delete todo\"}");
            e.printStackTrace();
        }
    }
}
