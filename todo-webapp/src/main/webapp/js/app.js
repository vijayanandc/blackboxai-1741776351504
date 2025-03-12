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

    // Function to get current user's ID token
    async function getCurrentUserToken() {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }
        return await user.getIdToken();
    }

    // Function to load all todos
    async function loadTodos() {
        try {
            const idToken = await getCurrentUserToken();
            $.ajax({
                url: '/todo',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                },
                success: function(todos) {
                    $('#todoList').empty();
                    todos.forEach(function(todo) {
                        appendTodoToList(todo);
                    });
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 401) {
                        showError('Authentication failed. Please login again.');
                    } else {
                        showError('Failed to load todos. Please try again later.');
                    }
                }
            });
        } catch (error) {
            showError('Authentication error. Please login again.');
        }
    }

    // Function to add new todo
    async function addTodo(description) {
        try {
            const idToken = await getCurrentUserToken();
            $.ajax({
                url: '/todo',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                },
                data: { description: description },
                success: function(todo) {
                    appendTodoToList(todo);
                    showSuccess('Task added successfully!');
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 401) {
                        showError('Authentication failed. Please login again.');
                    } else {
                        showError('Failed to add task. Please try again.');
                    }
                }
            });
        } catch (error) {
            showError('Authentication error. Please login again.');
        }
    }

    // Function to update todo status
    async function updateTodoStatus(todoId, isCompleted, todoItem) {
        try {
            const idToken = await getCurrentUserToken();
            $.ajax({
                url: `/todo?id=${todoId}`,
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                },
                data: { completed: isCompleted },
                success: function(updatedTodo) {
                    todoItem.find('.todo-text').toggleClass('completed', isCompleted);
                    showSuccess('Task updated successfully!');
                },
                error: function(xhr, status, error) {
                    // Revert checkbox state on error
                    todoItem.find('.todo-checkbox').prop('checked', !isCompleted);
                    if (xhr.status === 401) {
                        showError('Authentication failed. Please login again.');
                    } else {
                        showError('Failed to update task. Please try again.');
                    }
                }
            });
        } catch (error) {
            // Revert checkbox state on error
            todoItem.find('.todo-checkbox').prop('checked', !isCompleted);
            showError('Authentication error. Please login again.');
        }
    }

    // Function to delete todo
    async function deleteTodo(todoId, todoItem) {
        try {
            const idToken = await getCurrentUserToken();
            $.ajax({
                url: `/todo?id=${todoId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                },
                success: function() {
                    todoItem.slideUp(300, function() {
                        $(this).remove();
                    });
                    showSuccess('Task deleted successfully!');
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 401) {
                        showError('Authentication failed. Please login again.');
                    } else {
                        showError('Failed to delete task. Please try again.');
                    }
                }
            });
        } catch (error) {
            showError('Authentication error. Please login again.');
        }
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

    // Function to show error message
    function showError(message) {
        const errorDiv = $('<div>')
            .addClass('error-message')
            .text(message)
            .hide();
        
        $('.container:visible').prepend(errorDiv);
        errorDiv.slideDown(300).delay(3000).slideUp(300, function() {
            $(this).remove();
        });
    }

    // Function to show success message
    function showSuccess(message) {
        const successDiv = $('<div>')
            .addClass('success-message')
            .text(message)
            .hide();
        
        $('.container:visible').prepend(successDiv);
        successDiv.slideDown(300).delay(3000).slideUp(300, function() {
            $(this).remove();
        });
    }
});
