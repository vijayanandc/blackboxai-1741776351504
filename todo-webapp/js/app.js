$(document).ready(function() {
    // Load existing todos when page loads - only if user is authenticated
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadTodos();
        }
    });

    // Handle form submission for new todos
    $('#todoForm').on('submit', function(e) {
        e.preventDefault();
        const todoText = $('#todoInput').val().trim();
        
        if (todoText) {
            addTodo(todoText);
            $('#todoInput').val(''); // Clear input
        }
    });

    // Event delegation for dynamically created elements
    $('#todoList').on('change', '.todo-checkbox', function() {
        const todoItem = $(this).closest('.todo-item');
        const todoId = todoItem.data('id');
        const isCompleted = $(this).prop('checked');
        
        updateTodoStatus(todoId, isCompleted, todoItem);
    });

    $('#todoList').on('click', '.delete-todo', function() {
        const todoItem = $(this).closest('.todo-item');
        const todoId = todoItem.data('id');
        
        deleteTodo(todoId, todoItem);
    });

    // Function to load all todos
    function loadTodos() {
        const user = auth.currentUser;
        if (!user) return;

        $.ajax({
            url: '/todo-webapp/todo',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.uid}`
            },
            success: function(todos) {
                $('#todoList').empty();
                todos.forEach(function(todo) {
                    appendTodoToList(todo);
                });
            },
            error: function(xhr, status, error) {
                showError('Failed to load todos. Please try again later.');
            }
        });
    }

    // Function to add new todo
    function addTodo(description) {
        const user = auth.currentUser;
        if (!user) {
            showError('Please login to add todos');
            return;
        }

        $.ajax({
            url: '/todo-webapp/todo',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.uid}`
            },
            data: { 
                description: description,
                userId: user.uid
            },
            success: function(todo) {
                appendTodoToList(todo);
                showSuccess('Task added successfully!');
            },
            error: function(xhr, status, error) {
                showError('Failed to add task. Please try again.');
            }
        });
    }

    // Function to update todo status
    function updateTodoStatus(todoId, isCompleted, todoItem) {
        const user = auth.currentUser;
        if (!user) {
            showError('Please login to update todos');
            return;
        }

        $.ajax({
            url: `/todo-webapp/todo?id=${todoId}`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${user.uid}`
            },
            data: { 
                completed: isCompleted,
                userId: user.uid
            },
            success: function(updatedTodo) {
                todoItem.find('.todo-text').toggleClass('completed', isCompleted);
                showSuccess('Task updated successfully!');
            },
            error: function(xhr, status, error) {
                // Revert checkbox state on error
                todoItem.find('.todo-checkbox').prop('checked', !isCompleted);
                showError('Failed to update task. Please try again.');
            }
        });
    }

    // Function to delete todo
    function deleteTodo(todoId, todoItem) {
        const user = auth.currentUser;
        if (!user) {
            showError('Please login to delete todos');
            return;
        }

        $.ajax({
            url: `/todo-webapp/todo?id=${todoId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.uid}`
            },
            data: {
                userId: user.uid
            },
            success: function() {
                todoItem.slideUp(300, function() {
                    $(this).remove();
                });
                showSuccess('Task deleted successfully!');
            },
            error: function(xhr, status, error) {
                showError('Failed to delete task. Please try again.');
            }
        });
    }

    // Function to append todo item to the list
    function appendTodoToList(todo) {
        const template = document.getElementById('todoItemTemplate');
        const todoElement = $(template.content.cloneNode(true));
        
        const todoItem = todoElement.find('.todo-item');
        todoItem.data('id', todo.id);
        
        const checkbox = todoElement.find('.todo-checkbox');
        checkbox.prop('checked', todo.completed);
        
        const todoText = todoElement.find('.todo-text');
        todoText.text(todo.description);
        if (todo.completed) {
            todoText.addClass('completed');
        }

        todoItem.addClass('new-todo');
        $('#todoList').prepend(todoElement);
    }
});
