// Inicialização do Firebase (Certifique-se de usar a versão correta do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDvMSEl-3Tj5IvC5cs09DY8xZuUve4NyOU",
  authDomain: "tccneuropsicopedagoga.firebaseapp.com",
  projectId: "tccneuropsicopedagoga",
  storageBucket: "tccneuropsicopedagoga.firebasestorage.app",
  messagingSenderId: "189432898003",
  appId: "1:189432898003:web:aab9ddd5eba744a6350f26",
  measurementId: "G-XR0LJT1KB8"
};

// Inicializando o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Espera o DOM ser carregado
document.addEventListener('DOMContentLoaded', () => {
  const loginOverlay = document.getElementById('login-overlay');
  const loginBtn = document.getElementById('login-btn');
  const closeBtn = document.querySelector('.close-overlay-btn');
  const loginForm = document.getElementById('login-form');
  const createAccountForm = document.getElementById('create-account-form');
  const authControlsLoggedOut = document.getElementById('auth-controls-logged-out');
  const authControlsLoggedIn = document.getElementById('auth-controls-logged-in');
  const userEmailDisplay = document.getElementById('user-email-display');

  const adminLink = document.getElementById('admin-link');

  const userProfileContainer = document.getElementById('user-profile-container');
  const userNameNav = document.getElementById('user-name-nav');
  const userPhoto = document.getElementById('user-photo');
  const profileDropdown = document.getElementById('profile-dropdown');


  // ----- NOVA LÓGICA: Dropdown do Perfil e Fechar ao Clicar Fora -----

  // Função para alternar o dropdown
  function toggleDropdown(e) {
    e.stopPropagation(); // Impede o clique de se propagar para o documento
    profileDropdown.classList.toggle('hidden');
  }

  // Evento de clique para alternar o dropdown
  if (userProfileContainer) {
    userProfileContainer.addEventListener('click', toggleDropdown);
  }

  // Evento de clique no documento para fechar o dropdown se estiver aberto
  document.addEventListener('click', (e) => {
    // Verifica se o clique não foi dentro do container do perfil
    if (profileDropdown && !profileDropdown.classList.contains('hidden') &&
      userProfileContainer && !userProfileContainer.contains(e.target)) {
      profileDropdown.classList.add('hidden');
    }
  });

  // ----- Funções para controlar a exibição do modal -----
  // Exibir o modal de login
  window.openOverlay = function () {
    loginOverlay.classList.remove('hidden');
    window.showLogin(); // Exibe o formulário de login quando o modal abre
  };

  // Fechar o modal de login
  window.closeLogin = function () {
    loginOverlay.classList.add('hidden');
  };

  // Exibir o formulário de criação de conta
  window.showCreate = function () {
    loginForm.classList.add('hidden');
    createAccountForm.classList.remove('hidden');
  };

  // Exibir o formulário de login
  window.showLogin = function () {
    createAccountForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  };

  // ----- Adicionando eventos de clique -----
  // Ao clicar no botão "Login", abrir o modal
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay();
    });
  }

  // Fechar o modal ao clicar no botão de fechar
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeLogin();
    });
  }

  // Alternar para o formulário de criar conta
  const createAccountBtn = document.getElementById('create-account-btn');
  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay();
      showCreate();
    });
  }

  // Alternar para o formulário de login
  const alreadyHaveAccountBtn = document.getElementById('already-have-account-btn');
  if (alreadyHaveAccountBtn) {
    alreadyHaveAccountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  // ----- Funções de autenticação -----

  // Função para criar conta com e-mail e senha
  window.signUpEmailPassword = async function () {
    const email = document.getElementById('user-email-signup').value;
    const password = document.getElementById('user-pass-signup').value;
    const passwordConfirm = document.getElementById('user-pass2-signup').value;
    const userName = document.getElementById('user-name').value || '';

    if (password !== passwordConfirm) {
      alert('As senhas não coincidem!');
      return;
    }

    const signUpButton = document.querySelector('#create-account-form button[type="submit"]');
    const originalButtonText = signUpButton ? signUpButton.textContent : 'Criar conta';

    // Desabilitar o botão enquanto está criando a conta
    if (signUpButton) {
      signUpButton.disabled = true;
      signUpButton.textContent = 'Criando...';
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      // Atualizar nome de usuário
      await userCredential.user.updateProfile({ displayName: userName });

      console.log('Usuário registrado:', userCredential.user.uid);
      window.closeLogin();
      alert('Conta criada com sucesso e você já está logado!');
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      let errorMessage = 'Ocorreu um erro desconhecido ao criar a conta.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'O formato do email é inválido.';
          break;
        case 'auth/weak-password':
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
          break;
        default:
          errorMessage = `Erro ao registrar: ${error.message}`;
          break;
      }
      alert(errorMessage);
    } finally {
      if (signUpButton) {
        signUpButton.disabled = false;
        signUpButton.textContent = originalButtonText;
      }
    }
  };

  // Função para login com e-mail e senha
  window.signInEmailPassword = async function () {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-pass').value;

    const signInButton = document.querySelector('#login-form button[onclick="signInEmailPassword()"]');
    const originalSignInText = signInButton ? signInButton.textContent : 'Entrar';

    if (signInButton) {
      signInButton.disabled = true;
      signInButton.textContent = 'Entrando...';
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      console.log('Usuário logado com e-mail/senha');
      window.closeLogin();
      alert('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      let errorMessage = 'Ocorreu um erro desconhecido ao fazer login.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email ou senha inválidos.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'O formato do email é inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desativada.';
          break;
        default:
          errorMessage = `Erro ao fazer login: ${error.message}`;
          break;
      }
      alert(errorMessage);
    } finally {
      if (signInButton) {
        signInButton.disabled = false;
        signInButton.textContent = originalSignInText;
      }
    }
  };

  // Função para login com Google
  window.signInWithGoogle = async function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    const googleSignInButton = document.querySelector('#login-form button[onclick="signInWithGoogle()"]');
    const originalGoogleText = googleSignInButton ? googleSignInButton.textContent : 'Entrar com Google';

    if (googleSignInButton) {
      googleSignInButton.disabled = true;
      googleSignInButton.textContent = 'Entrando com Google...';
    }

    try {
      await auth.signInWithPopup(provider);
      console.log('Logado com Google');
      window.closeLogin();
      alert('Login com Google realizado com sucesso!');
    } catch (error) {
      console.error('Erro Google:', error);
      let errorMessage = 'Ocorreu um erro ao fazer login com Google.';
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'O popup de login foi fechado antes da conclusão. Tente novamente.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Outra solicitação de autenticação foi iniciada. Por favor, tente novamente.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Já existe uma conta com este email, mas usando outro método de login.';
          break;
        default:
          errorMessage = `Erro ao fazer login com Google: ${error.message}`;
          break;
      }
      alert(errorMessage);
    } finally {
      if (googleSignInButton) {
        googleSignInButton.disabled = false;
        googleSignInButton.textContent = originalGoogleText;
      }
    }
  };

  // Função para logout
  window.logoutUser = async function () {
    try {
      await auth.signOut();
      console.log('Usuário deslogado');
      alert('Você foi desconectado com sucesso!');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
      alert('Erro ao fazer logout: ' + error.message);
    }
  };

  async function checkAdminStatus(uid) {
    if (!adminLink) return; // Sai se o link admin não existe

    try {
      // Tenta buscar o documento do usuário na coleção 'users'
      const userDoc = await db.collection('users').doc(uid).get();

      if (userDoc.exists && userDoc.data().isAdmin === true) {
        // Se o campo 'isAdmin' for verdadeiro, mostra o link
        adminLink.classList.remove('hidden');
      } else {
        // Caso contrário, garante que o link está oculto
        adminLink.classList.add('hidden');
      }
    } catch (error) {
      console.error('Erro ao buscar status de admin:', error);
      // Em caso de erro, por segurança, oculta o link
      adminLink.classList.add('hidden');
    }
  }

  // ----- Observador de estado de autenticação (ATUALIZADO) -----
  auth.onAuthStateChanged((user) => {
    if (user) {
      // LOGADO: Mostra Perfil, Oculta Login
      if (userProfileContainer) userProfileContainer.classList.remove('hidden');
      if (loginBtn) loginBtn.classList.add('hidden');

      // Atualiza nome e foto
      const displayName = user.displayName || 'Usuário';
      const photoURL = user.photoURL || 'Assets/Placeholder.jpg';

      if (userNameNav) userNameNav.textContent = displayName;
      if (userPhoto) userPhoto.src = photoURL;

      // Garante que o dropdown está fechado ao mudar de estado
      if (profileDropdown) profileDropdown.classList.add('hidden');

      // CHAMA A VERIFICAÇÃO DE ADMIN
      checkAdminStatus(user.uid);

      // Fecha o modal de login se o usuário já estiver logado
      window.closeLogin();
    } else {
      // DESLOGADO: Oculta Perfil, Mostra Login
      if (userProfileContainer) userProfileContainer.classList.add('hidden');
      if (loginBtn) loginBtn.classList.remove('hidden');

      // NOVO: OCULTA O LINK ADMIN AO DESLOGAR
      if (adminLink) adminLink.classList.add('hidden');

      // Atualiza o botão para "Login"
      if (loginBtn) {
        loginBtn.textContent = "Login"; // Texto do botão na navbar
        loginBtn.onclick = (e) => {
          e.preventDefault();
          window.openOverlay();
          window.showLogin();
        };
      }
    }

    // Assegura que o botão de "Agendar" continue funcional, caso seja manipulado
    const agendarBtn = document.querySelector('a[href="#contato"][data-scroll="#contato"]');
    if (agendarBtn) agendarBtn.classList.remove('hidden');
  });
});