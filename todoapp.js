var todoInput = document.getElementById("todoInput");
var listItems = document.getElementById("listItems");

//firebase config 

firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var database = firebase.database();

// Register function
function register(email, password) {
  auth
    .createUserWithEmailAndPassword(email, password)
    .then(() => Swal.fire("Success", "Registration successful", "success"))
    .catch((error) => Swal.fire("Error", error.message, "error"));
}

// Login function
function login(email, password) {
  console.log("email", email, password);
  auth
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      Swal.fire("Success", "Login successful", "success");
      document.getElementById("authSection").style.display = "none";
      document.getElementById("todoSection").style.display = "block";
      loadTodos(); // Load todos after login
    })
    .catch((error) => Swal.fire("Error", error.message, "error"));
}

// Show login form
function showLoginForm() {
  Swal.fire({
    title: "Login",
    html:
      '<input id="loginEmail" class="swal2-input" placeholder="Email">' +
      '<input id="loginPassword" type="password" class="swal2-input" placeholder="Password">',
    focusConfirm: false,
    preConfirm: () => {
      var email = document.getElementById("loginEmail").value;
      var password = document.getElementById("loginPassword").value;
      login(email, password);
    },
  });
}

// Show register form
function showRegisterForm() {
  Swal.fire({
    title: "Register",
    html:
      '<input id="registerEmail" class="swal2-input" placeholder="Email">' +
      '<input id="registerPassword" type="password" class="swal2-input" placeholder="Password">',
    focusConfirm: false,
    preConfirm: () => {
      var email = document.getElementById("registerEmail").value;
      var password = document.getElementById("registerPassword").value;
      register(email, password);
    },
  });
}

// Add item to the list and save to Firebase
function addItem() {
  if (todoInput.value) {
    var liElement = document.createElement("li");
    var liText = document.createTextNode(todoInput.value);
    liElement.appendChild(liText);
    listItems.append(liElement);
    saveTodoToFirebase(todoInput.value, liElement);
    todoInput.value = "";
  } else {
    alert("Item must be filled and not empty");
  }
}

// Save Todo to Firebase
function saveTodoToFirebase(todo, liElement) {
  if (auth.currentUser) {
    const newTodoRef = database.ref(`todos/${auth.currentUser.uid}`).push();
    newTodoRef
      .set({ todo: todo })
      .then(() => {
        liElement.dataset.key = newTodoRef.key;


        // Add Delete button
        var deletebtn = document.createElement("button");
        var delBtnText = document.createTextNode("Delete");
        deletebtn.appendChild(delBtnText);
        liElement.appendChild(deletebtn);
        deletebtn.setAttribute("onclick", "dltItem(this)");

        // Add Edit button
        var editbtn = document.createElement("button");
        var editbtnText = document.createTextNode("Edit");
        editbtn.appendChild(editbtnText);
        liElement.appendChild(editbtn);
        editbtn.setAttribute("onclick", "editItem(this)");

        toggleDeleteAllButton()
      })
      .catch((error) => Swal.fire("Error", error.message, "error"));
  }
}

// Delete individual item
function dltItem(x) {
  var todoItem = x.parentNode;
  var todoKey = todoItem.dataset.key;
  console.log("todoKey", x.parentNode);

  todoItem.remove();

  if (auth.currentUser && todoKey) {
    database
      .ref(`todos/${auth.currentUser.uid}/${todoKey}`)
      .remove().then(() => {
        toggleDeleteAllButton()
      })
      .catch((error) => Swal.fire("Error", error.message, "error"));
  }
}

// Edit todo item
function editItem(x) {
  var todoItem = x.parentNode;
  var todoKey = todoItem.dataset.key;
  var currentText = todoItem.firstChild.nodeValue;

  var updatedVal = prompt("Edit Todo:", currentText);

  if (updatedVal && updatedVal !== currentText) {
    todoItem.firstChild.nodeValue = updatedVal;

    if (auth.currentUser && todoKey) {
      database
        .ref(`todos/${auth.currentUser.uid}/${todoKey}`)
        .update({ todo: updatedVal })
        .catch((error) => Swal.fire("Error", error.message, "error"));
    }
  }
}


// Delete all todo items from UI and Firebase
function deleteAll() {
    if (auth.currentUser) {
        database.ref(`todos/${auth.currentUser.uid}`).remove()
            .then(() => {
                listItems.innerHTML = "";
                toggleDeleteAllButton()
            })
            .catch((error) => Swal.fire("Error", error.message, "error"));
    }
}


// Load Todos from Firebase after login
function loadTodos() {
    if (auth.currentUser) {
        database.ref(`todos/${auth.currentUser.uid}`).once('value', (snapshot) => {
            const todos = snapshot.val();
            listItems.innerHTML = ''; // Clear the list before appending new items

            if (todos) {
                let hasTodos = false;
                for (let key in todos) {
                    const todo = todos[key].todo;
                    var liElement = document.createElement('li');
                    var liText = document.createTextNode(todo);
                    liElement.appendChild(liText);

                    // Store the Firebase key as a data attribute
                    liElement.dataset.key = key;  // Store the Firebase key in 'data-key'

                    listItems.append(liElement);

                    // Add Delete button
                    var deletebtn = document.createElement("button");
                    var delBtnText = document.createTextNode("Delete");
                    deletebtn.appendChild(delBtnText);
                    liElement.appendChild(deletebtn);
                    deletebtn.setAttribute('onclick', 'dltItem(this)');

                    // Add Edit button
                    var editbtn = document.createElement("button");
                    var editbtnText = document.createTextNode("Edit");
                    editbtn.appendChild(editbtnText);
                    liElement.appendChild(editbtn);
                    editbtn.setAttribute('onclick', 'editItem(this)');

                    hasTodos = true;  // Mark that there are todos
                }

                // Show or hide the "Delete All" button based on whether there are todos
                const deleteAllBtn = document.getElementById('deleteAllBtn');
                if (hasTodos) {
                    deleteAllBtn.style.display = 'inline'; // Show "Delete All" button
                } else {
                    deleteAllBtn.style.display = 'none';  // Hide "Delete All" button
                }
            } else {
                // If no todos, hide the "Delete All" button
                const deleteAllBtn = document.getElementById('deleteAllBtn');
                deleteAllBtn.style.display = 'none';
            }
        }).catch((error) => Swal.fire("Error", error.message, "error"));
    }
}



// Toggle visibility of "Delete All" button based on whether there are todos
function toggleDeleteAllButton() {
    if (auth.currentUser) {
        database.ref(`todos/${auth.currentUser.uid}`).once('value', (snapshot) => {
            const todos = snapshot.val();
            const deleteAllBtn = document.getElementById('deleteAllBtn');
            
            // Show the button if there are todos, hide if there are none
            if (todos && Object.keys(todos).length > 0) {
                deleteAllBtn.style.display = 'inline';  // Show "Delete All" button
            } else {
                deleteAllBtn.style.display = 'none';  // Hide "Delete All" button
            }
        }).catch((error) => Swal.fire("Error", error.message, "error"));
    }
}
