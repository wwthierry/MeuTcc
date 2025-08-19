// Importações do Firebase (apenas uma vez)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
  getFirestore, 
  setDoc, 
  doc,
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Configuração do Firebase (apenas uma vez)
const firebaseConfig = {
  apiKey: "AIzaSyCnd_9tJDq5sUPnPpLpR2T3xIiBFZeu_T4",
  authDomain: "loginform-855f0.firebaseapp.com",
  projectId: "loginform-855f0",
  storageBucket: "loginform-855f0.appspot.com",
  messagingSenderId: "784385932898",
  appId: "1:784385932898:web:3132db27dbc0940c839b3b"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Função para mostrar mensagens
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  
  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// Cadastro de usuário
const signUpForm = document.getElementById('signupForm');
if (signUpForm) {
  signUpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userData = {
          email: email,
          firstName: firstName,
          lastName: lastName
        };
        
        showMessage('Account Created Successfully', 'signUpMessage');
        
        return setDoc(doc(db, "users", user.uid), userData);
      })
      .then(() => {
        // Mostra o formulário de login após cadastro bem-sucedido
        signUpForm.style.display = 'none';
        document.getElementById('signinForm').style.display = 'block';
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/email-already-in-use') {
          showMessage('Email Address Already Exists!', 'signUpMessage');
        } else {
          showMessage('Unable to create User: ' + error.message, 'signUpMessage');
        }
      });
  });
}

// Login de usuário
const signInForm = document.getElementById('signinForm');
if (signInForm) {
  signInForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        showMessage('Login successful', 'signInMessage');
        const user = userCredential.user;
        localStorage.setItem('loggedInUserId', user.uid);
        window.location.href = 'menu.html';
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/invalid-credential') {
          showMessage('Incorrect Email or Password', 'signInMessage');
        } else {
          showMessage('Error: ' + error.message, 'signInMessage');
        }
      });
  });
}

// Verificação de estado de autenticação (para a homepage)
onAuthStateChanged(auth, (user) => {
  const loggedInUserId = localStorage.getItem('loggedInUserId');
  if (loggedInUserId) {
    const docRef = doc(db, "users", loggedInUserId);
    
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Atualiza apenas elementos que existem na página
          if (document.getElementById('loggedUserFName')) {
            document.getElementById('loggedUserFName').innerText = userData.firstName;
          }
          if (document.getElementById('loggedUserEmail')) {
            document.getElementById('loggedUserEmail').innerText = userData.email;
          }
          if (document.getElementById('loggedUserLName')) {
            document.getElementById('loggedUserLName').innerText = userData.lastName;
          }
        } else {
          console.log("No document found matching id");
        }
      })
      .catch((error) => {
        console.log("Error getting document:", error);
      });
  }
});

// Logout
const logoutButton = document.getElementById('logout');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('loggedInUserId');
    signOut(auth)
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  });
}