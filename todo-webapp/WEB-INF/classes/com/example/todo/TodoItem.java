package com.example.todo;

import java.util.Date;

public class TodoItem {
    private int id;
    private String description;
    private boolean completed;
    private Date createdAt;

    // Default constructor
    public TodoItem() {
        this.createdAt = new Date();
        this.completed = false;
    }

    // Constructor with description
    public TodoItem(int id, String description) {
        this();
        this.id = id;
        this.description = description;
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    // Convert TodoItem to JSON string
    public String toJson() {
        return String.format(
            "{\"id\":%d,\"description\":\"%s\",\"completed\":%b,\"createdAt\":\"%s\"}",
            id,
            description.replace("\"", "\\\""), // Escape quotes in description
            completed,
            createdAt.toString()
        );
    }
}
