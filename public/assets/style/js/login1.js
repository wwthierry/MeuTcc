console.log('login.js carregado');

if (typeof firebase === 'undefined') {
    console.error('Firebase não foi carregado corretamente!');
    alert('Erro no sistema. Por favor, recarregue a página.');
} else if (!firebase.apps.length) {
    console.error('Firebase não foi inicializado!');
    alert('Erro na inicialização do Firebase. Verifique a configuração.');
} else {
    console.log('Firebase carregado e inicializado. Iniciando monitoramento de autenticação.');
    try {
        firebase.auth().onAuthStateChanged((user) => {
            console.log('onAuthStateChanged acionado');
            const userInfo = document.getElementById('userInfo');
            const loginForm = document.getElementById('loginForm');
            const userEmail = document.getElementById('userEmail');

            if (user) {
                console.log('Usuário autenticado:', user.email, 'UID:', user.uid);
                // Mostrar informações do usuário e botão de logout
                if (userInfo && loginForm && userEmail) {
                    userInfo.style.display = 'block';
                    loginForm.style.display = 'none';
                    userEmail.textContent = user.email;
                }
            } else {
                console.log('Nenhum usuário autenticado');
                // Mostrar formulário de login
                if (userInfo && loginForm) {
                    userInfo.style.display = 'none';
                    loginForm.style.display = 'block';
                }
                setupLoginForm();
            }
        });
    } catch (error) {
        console.error('Erro no onAuthStateChanged:', error);
        alert('Erro na autenticação: ' + error.message);
    }
}

function redirectToMenu() {
    console.log('Iniciando redirecionamento para menu.html');
    try {
        const absolutePath = window.location.origin + '/menu.html';
        console.log('Tentando com caminho absoluto:', absolutePath);
        window.location.assign(absolutePath);
    } catch (error) {
        console.error('Erro no redirecionamento:', error);
        alert('Erro ao redirecionar. Por favor, acesse menu.html manualmente.');
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('Formulário de login não encontrado!');
        alert('Formulário de login não encontrado!');
        return;
    }
    console.log('Formulário encontrado, adicionando evento de submit');
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Formulário enviado');
        
        const email = document.getElementById('email').value.trim().toLowerCase();
        const senha = document.getElementById('senha').value;
        const remember = document.getElementById('remember')?.checked;

        try {
            if (!email || !senha) {
                alert('Por favor, preencha todos os campos!');
                return;
            }
            if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                alert('Por favor, insira um e-mail válido!');
                return;
            }
            console.log('Tentando login com E-mail:', email);
            
            await firebase.auth().setPersistence(
                remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
            );
            
            await firebase.auth().signInWithEmailAndPassword(email, senha);
            console.log('Login bem-sucedido com E-mail:', email);
            redirectToMenu();
        } catch (error) {
            console.error('Erro no login:', error.code, error.message);
            handleLoginError(error);
        }
    });

    document.getElementById('togglePassword')?.addEventListener('click', function() {
        const senhaInput = document.getElementById('senha');
        if (senhaInput) {
            senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        }
    });

    document.getElementById('logoutButton')?.addEventListener('click', async function() {
        try {
            await firebase.auth().signOut();
            console.log('Usuário deslogado com sucesso');
            alert('Você foi desconectado!');
        } catch (error) {
            console.error('Erro ao deslogar:', error);
            alert('Erro ao deslogar: ' + error.message);
        }
    });
}

function handleLoginError(error) {
    console.error('Código do erro:', error.code, 'Mensagem:', error.message);
    let message = 'Erro no login. Tente novamente.';
    switch(error.code) {
        case 'auth/user-not-found':
            message = 'E-mail não cadastrado!';
            break;
        case 'auth/wrong-password':
            message = 'Senha incorreta!';
            break;
        case 'auth/invalid-email':
            message = 'Formato de e-mail inválido!';
            break;
        case 'auth/too-many-requests':
            message = 'Muitas tentativas. Tente mais tarde.';
            break;
    }
    alert(message);
}