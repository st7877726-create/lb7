// const list = document.getElementById('todo-list')
// const itemCountSpan = document.getElementById('item-count')
// const uncheckedCountSpan = document.getElementById('unchecked-count')

// let todos = JSON.parse(localStorage.getItem('todos')) || [
//     { id: 1, text: "Вивчити HTML", checked: true },
//     { id: 2, text: "Вивчити CSS", checked: true },
//     { id: 3, text: "Вивчити JavaScript", checked: false }
// ];

// function updateCounter() {
//     const totalCount = todos.length; 
//     const uncheckedCount = todos.filter(todo => !todo.checked).length; 
//     itemCountSpan.textContent = totalCount;
//     uncheckedCountSpan.textContent = uncheckedCount;
// }

// function saveToLocalStorage() {
//     localStorage.setItem('todos', JSON.stringify(todos));
// }

// function renderTodo(todo) {
//     const textClass = todo.checked ? "text-success text-decoration-line-through" : "";
//     const checkedAttribute = todo.checked ? "checked" : "";

//     return `
//         <li class="list-group-item">
//             <input type="checkbox" class="form-check-input me-2" id="todo-${todo.id}" ${checkedAttribute} onChange="checkTodo(${todo.id})">
//             <label for="todo-${todo.id}"><span class="${textClass}">${todo.text}</span></label>
//             <button class="btn btn-danger btn-sm float-end" onClick="deleteTodo(${todo.id})">delete</button>
//         </li>
//     `;
// }

// function render() {
//     const htmlList = todos.map(todo => renderTodo(todo)).join('');
//     list.innerHTML = htmlList;
//     updateCounter();
//     saveToLocalStorage();
// }

// function newTodo() {
//     const todoText = prompt("Введіть назву нової справи:");
//         if (todoText && todoText.trim() !== "") {
//         const newTodoObject = {
//             id: Date.now(),
//             text: todoText.trim(),
//             checked: false
//         };
        
//         todos.push(newTodoObject);
//         console.log("Дані успішно збережено в масив:", todos); 
//         render(); 
//     }
// }

// function deleteTodo(id) {
//     todos = todos.filter(todo => todo.id !== id);
//     render();
// }

// function checkTodo(id) {
//     todos = todos.map(todo => {
//         if (todo.id === id) {
//             return { ...todo, checked: !todo.checked };
//         }
//         return todo;
//     });
//     render();
// }

// render();




const BASE_URL = "https://todo-app-lab7-6e11d-default-rtdb.firebaseio.com/todos.json";

const list = document.getElementById('todo-list');
const itemCountSpan = document.getElementById('item-count');
const uncheckedCountSpan = document.getElementById('unchecked-count');

const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');

let todos = [];

function updateCounter() {
    const totalCount = todos.length; 
    const uncheckedCount = todos.filter(todo => !todo.completed).length; // замінено checked на completed
    itemCountSpan.textContent = totalCount;
    uncheckedCountSpan.textContent = uncheckedCount;
}

function renderTodo(todo) {
    const textClass = todo.completed ? "text-success text-decoration-line-through" : "";
    const checkedAttribute = todo.completed ? "checked" : "";

    return `
        <li class="list-group-item">
            <input type="checkbox" class="form-check-input me-2" id="todo-${todo.id}" ${checkedAttribute} onChange="checkTodo('${todo.id}')">
            <label for="todo-${todo.id}"><span class="${textClass}">${todo.text}</span></label>
            <button class="btn btn-danger btn-sm float-end" onClick="deleteTodo('${todo.id}')">delete</button>
        </li>
    `;
}

function render() {
    const htmlList = todos.map(todo => renderTodo(todo)).join('');
    list.innerHTML = htmlList;
    updateCounter();
}

function toggleLoader(show) {
    if (loader) loader.style.display = show ? "block" : "none";
}

function showError(msg) {
    if (errorMessage) {
        errorMessage.textContent = `Помилка: ${msg}`;
        errorMessage.style.display = "block";
    }
}

function clearError() {
    if (errorMessage) {
        errorMessage.style.display = "none";
        errorMessage.textContent = "";
    }
}


function loadTodosFromServer() {
    toggleLoader(true);
    clearError();

    fetch(BASE_URL) 
        .then(response => {
            if (!response.ok) throw new Error("Не вдалося завантажити дані з сервера.");
            return response.json();
        })
        .then(data => {
            if (!data) {
                todos = [];
            } else {
                todos = Object.keys(data).map(key => ({
                    id: key,
                    text: data[key].text,
                    completed: data[key].completed
                }));
            }
            render();
        })
        .catch(error => showError(error.message))
        .finally(() => toggleLoader(false));
}

function newTodo() {
    const todoText = prompt("Введіть назву нової справи:");
    if (todoText && todoText.trim() !== "") {
        
        const newTodoObject = {
            text: todoText.trim(),
            completed: false
        };
        
        toggleLoader(true);
        clearError();

        fetch(BASE_URL, {
            method: "POST", 
            body: JSON.stringify(newTodoObject), 
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            }
        })
        .then(response => {
            if (!response.ok) throw new Error("Помилка при додаванні справи на сервер.");
            return response.json();
        })
        .then(data => {
            const createdTodo = {
                id: data.name, 
                ...newTodoObject
            };
            
            todos.push(createdTodo);
            console.log("Дані успішно збережено в масив та Firebase:", todos); 
            render(); 
        })
        .catch(error => showError(error.message))
        .finally(() => toggleLoader(false));
    }
}

function deleteTodo(id) {
    toggleLoader(true);
    clearError();

    const deleteUrl = `https://todo-app-lab7-6e11d-default-rtdb.firebaseio.com/todos/${id}.json`;

    fetch(deleteUrl, {
        method: "DELETE" 
    })
    .then(response => {
        if (!response.ok) throw new Error("Не вдалося видалити справу з сервера.");
        
        todos = todos.filter(todo => todo.id !== id);
        render();
    })
    .catch(error => showError(error.message))
    .finally(() => toggleLoader(false));
}

function checkTodo(id) {
    const currentTodo = todos.find(todo => todo.id === id);
    if (!currentTodo) return;

    toggleLoader(true);
    clearError();

    const updateUrl = `https://todo-app-lab7-6e11d-default-rtdb.firebaseio.com/todos/${id}.json`;
    const updatedData = { completed: !currentTodo.completed };

    fetch(updateUrl, {
        method: "PATCH", 
        body: JSON.stringify(updatedData),
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Не вдалося оновити статус справи на сервері.");
        return response.json();
    })
    .then(() => {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        render();
    })
    .catch(error => showError(error.message))
    .finally(() => toggleLoader(false));
}

loadTodosFromServer();