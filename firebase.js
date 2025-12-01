// Inicialização do Firebase
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
firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth();
window.db = firebase.firestore();

// const storage = firebase.storage(); comentado para n quebrar o firebase.storage

document.addEventListener('DOMContentLoaded', () => {
  const loginOverlay = document.getElementById('login-overlay');
  const loginBtn = document.getElementById('login-btn');
  const closeBtn = document.querySelector('.close-overlay-btn');
  const loginForm = document.getElementById('login-form');
  const createAccountForm = document.getElementById('create-account-form');
  const adminLink = document.getElementById('admin-link');

  const userProfileContainer = document.getElementById('user-profile-container');
  const userNameNav = document.getElementById('user-name-nav');
  const userPhoto = document.getElementById('user-photo');
  const profileDropdown = document.getElementById('profile-dropdown');

  // Dropdown de perfil
  function toggleDropdown(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  }
  if (userProfileContainer) {
    userProfileContainer.addEventListener('click', toggleDropdown);
  }
  document.addEventListener('click', (e) => {
    if (profileDropdown && !profileDropdown.classList.contains('hidden') &&
      userProfileContainer && !userProfileContainer.contains(e.target)) {
      profileDropdown.classList.add('hidden');
    }
  });

  // Controle de modal login
  window.openOverlay = function () {
    loginOverlay.classList.remove('hidden');
    window.showLogin();
  };
  window.closeLogin = () => {
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const createAccountForm = document.getElementById('create-account-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form'); // NOVO

    if (loginOverlay) { // <---- Verificação de página
        loginOverlay.classList.add('hidden');
        loginForm.classList.add('hidden');
        createAccountForm.classList.add('hidden');
        if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden'); // NOVO
    }
};

window.showCreate = function () {
    const loginForm = document.getElementById('login-form');
    const createAccountForm = document.getElementById('create-account-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form'); // NOVO

    loginForm.classList.add('hidden');
    if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden'); // NOVO
    createAccountForm.classList.remove('hidden');
};

window.showLogin = function () {
    const loginForm = document.getElementById('login-form');
    const createAccountForm = document.getElementById('create-account-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form'); // NOVO

    createAccountForm.classList.add('hidden');
    if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden'); // NOVO
    loginForm.classList.remove('hidden');
};

  window.showForgotPassword = function () {
    const loginForm = document.getElementById('login-form');
    const createAccountForm = document.getElementById('create-account-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');

    loginForm.classList.add('hidden');
    createAccountForm.classList.add('hidden');
    forgotPasswordForm.classList.remove('hidden');
    document.getElementById('forgot-msg').textContent = ''; // Limpa a mensagem anterior
};

window.sendPasswordReset = async function () {
    const emailInput = document.getElementById('forgot-email');
    const email = emailInput.value;
    const msgEl = document.getElementById('forgot-msg');
    const btn = document.querySelector('#forgot-password-form button[onclick="sendPasswordReset()"]');
    const originalText = btn ? btn.textContent : 'Enviar link';

    if (!email) {
        msgEl.textContent = 'Por favor, insira seu email.';
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        msgEl.textContent = '';
    }

    try {
        await auth.sendPasswordResetEmail(email);

        msgEl.textContent = `✅ Link de redefinição enviado para ${email}. Verifique sua caixa de entrada!`;
        msgEl.style.color = '#198754'; // Cor verde para sucesso
        emailInput.value = ''; // Limpa o campo de email

    } catch (error) {
        console.error('Erro sendPasswordReset:', error);
        
        let errorMessage = 'Erro ao enviar o email. Tente novamente.';
        // Códigos de erro comuns do Firebase para redefinição
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Não há usuário registrado com este email.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'O formato do email é inválido.';
        }

        msgEl.textContent = `❌ ${errorMessage}`;
        msgEl.style.color = '#dc3545'; // Cor vermelha para erro

    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
};

  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeLogin();
    });
  }
  const createAccountBtn = document.getElementById('create-account-btn');
  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay();
      showCreate();
    });
  }
  const alreadyHaveAccountBtn = document.getElementById('already-have-account-btn');
  if (alreadyHaveAccountBtn) {
    alreadyHaveAccountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  // 🔥 Garante documento do usuário no Firestore
  async function ensureUserDoc(user) {
    if (!user) return;
    try {
      const userRef = db.collection("users").doc(user.uid);
      const docSnap = await userRef.get();

      if (!docSnap.exists) {
        await userRef.set({
          name: user.displayName || "Usuário",
          email: user.email || "",
          isAdmin: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Novo documento em users:", user.uid);
      }
    } catch (err) {
      console.error("Erro ensureUserDoc:", err);
    }
  }

  async function uploadUserPhoto(uid, file) {
    const storageRef = storage.ref(`users/${uid}/profile.jpg`);
    const snapshot = await storageRef.put(file);
    const photoURL = await snapshot.ref.getDownloadURL();
    return photoURL;
  }

  // ============================
  // CADASTRO COM EMAIL E SENHA
  // ============================
  window.signUpEmailPassword = async function () {
    const email = document.getElementById('user-email-signup').value;
    const password = document.getElementById('user-pass-signup').value;
    const passwordConfirm = document.getElementById('user-pass2-signup').value;
    const userName = document.getElementById('user-name').value || '';

    // VERIFICAÇÃO DE FORÇA (segurança extra)
    const isStrong = /[A-Z]/.test(password) && 
                     /[a-z]/.test(password) && 
                     /[0-9]/.test(password) && 
                     password.length >= 6;

    if (!isStrong) {
        alert('A senha é muito fraca. Por favor, inclua letra maiúscula, minúscula e número.');
        return;
    }
    // FIM DA VERIFICAÇÃO DE FORÇA

    if (password !== passwordConfirm) {
      alert('As senhas não coincidem!');
      return;
    }

    if (password !== passwordConfirm) {
      alert('As senhas não coincidem!');
      return;
    }

    const btn = document.querySelector('#create-account-form button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Criar conta';

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Criando...';
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName: userName });
      await ensureUserDoc(userCredential.user);

      window.closeLogin();
      alert('Conta criada com sucesso!');
    } catch (error) {
      console.error('Erro signup:', error);
      alert('Erro ao registrar: ' + error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  };

  // ============================
  // LOGIN COM EMAIL E SENHA
  // ============================
  window.signInEmailPassword = async function () {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-pass').value;

    const btn = document.querySelector('#login-form button[onclick="signInEmailPassword()"]');
    const originalText = btn ? btn.textContent : 'Entrar';

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Entrando...';
    }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      await ensureUserDoc(userCredential.user);

      window.closeLogin();
      alert('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro login:', error);
      alert('Erro: ' + error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  };

  // ============================
  // LOGIN COM GOOGLE
  // ============================
  window.signInWithGoogle = async function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    const btn = document.querySelector('#login-form button[onclick="signInWithGoogle()"]');
    const originalText = btn ? btn.textContent : 'Entrar com Google';

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Entrando...';
    }

    try {
      const result = await auth.signInWithPopup(provider);
      await ensureUserDoc(result.user);

      window.closeLogin();
      alert('Login com Google realizado!');
    } catch (error) {
      console.error('Erro Google:', error);
      alert('Erro: ' + error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  };

  // ============================
  // LOGOUT
  // ============================
  window.logoutUser = async function () {
    try {
      await auth.signOut();
      alert('Você foi desconectado!');
    } catch (error) {
      console.error('Erro logout:', error);
    }
  };

  // ============================
  // CHECK ADMIN
  // ============================
  async function checkAdminStatus(uid) {
    if (!adminLink) return;
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data().isAdmin === true) {
        adminLink.classList.remove('hidden');
      } else {
        adminLink.classList.add('hidden');
      }
    } catch (error) {
      console.error('Erro checkAdminStatus:', error);
      adminLink.classList.add('hidden');
    }
  }

  window.checkAdminAccess = function (redirectPath = 'index.html') {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        unsubscribe();
        if (!user) {
          window.location.href = redirectPath;
          return reject('Not logged in');
        }
        try {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists && userDoc.data().isAdmin === true) {
            resolve(user);
          } else {
            window.location.href = redirectPath;
            return reject('Not an admin');
          }
        } catch (error) {
          window.location.href = redirectPath;
          return reject(error);
        }
      });
    });
  };

  
  // ============================
  // VALIDAÇÃO DE FORÇA DA SENHA (PARA CRIAR CONTA)
  // ============================
  const passInputSignup = document.getElementById('user-pass-signup');
  // Seletor Específico: botão de submit DENTRO do formulário de criação de conta
  const createAccountBtnSubmit = document.querySelector('#create-account-form button[type="submit"]');

  // Elementos da lista de critérios
  const ruleLength = document.getElementById('rule-length');
  const ruleUpper = document.getElementById('rule-upper');
  const ruleLower = document.getElementById('rule-lower');
  const ruleNumber = document.getElementById('rule-number');

  if (passInputSignup && createAccountBtnSubmit) {
    // Bloqueia o botão de criação de conta inicialmente
    createAccountBtnSubmit.disabled = true;

    // Função que verifica a senha e atualiza o estado
    function checkPasswordStrength() {
      const val = passInputSignup.value;

      // Regex de validação
      const hasLength = val.length >= 8;
      const hasUpper = /[A-Z]/.test(val);
      const hasLower = /[a-z]/.test(val);
      const hasNumber = /[0-9]/.test(val);

      // Função auxiliar para atualizar visual
      function updateClass(element, isValid) {
        if (element) {
          if (isValid) {
            element.classList.add('valid');
          } else {
            element.classList.remove('valid');
          }
        }
      }

      // Atualiza a UI
      updateClass(ruleLength, hasLength);
      updateClass(ruleUpper, hasUpper);
      updateClass(ruleLower, hasLower);
      updateClass(ruleNumber, hasNumber);

      // Bloqueia ou libera o botão de envio
      const isStrong = hasLength && hasUpper && hasLower && hasNumber;
      createAccountBtnSubmit.disabled = !isStrong;
      
      return isStrong; // Retorna o status de força
    }

    // Ouve o que o usuário digita
    passInputSignup.addEventListener('input', checkPasswordStrength);

    // Adiciona uma chamada à verificação ao mostrar o formulário de criação
    const originalShowCreate = window.showCreate;
    window.showCreate = function () {
      originalShowCreate();
      // Re-avalia a força da senha ao mostrar o formulário
      setTimeout(checkPasswordStrength, 0); 
    };
  }

  // ============================
  // OBSERVADOR DE AUTENTICAÇÃO
  // ============================
  auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuário logado
        if (userProfileContainer) userProfileContainer.classList.remove('hidden');
        if (loginBtn) loginBtn.classList.add('hidden');

        // NOVO: Puxa o documento do Firestore para ter as informações completas, incluindo a foto
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userNameNav) userNameNav.textContent = userData.name || user.displayName || 'Usuário';
                if (userPhoto) userPhoto.src = userData.photoURL || user.photoURL || 'Assets/Placeholder.jpg';
            } else {
                // Se o documento não existir, usa os dados do objeto de autenticação como fallback
                if (userNameNav) userNameNav.textContent = user.displayName || 'Usuário';
                if (userPhoto) userPhoto.src = user.photoURL || 'Assets/Placeholder.jpg';
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário no Firestore:', error);
            // Em caso de erro, usa os dados do objeto de autenticação como fallback
            if (userNameNav) userNameNav.textContent = user.displayName || 'Usuário';
            if (userPhoto) userPhoto.src = user.photoURL || 'Assets/Placeholder.jpg';
        }

        if (profileDropdown) profileDropdown.classList.add('hidden');
        checkAdminStatus(user.uid);
        window.closeLogin();
    } else {
        // Usuário não está logado
        if (userProfileContainer) userProfileContainer.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (adminLink) adminLink.classList.add('hidden');

        if (loginBtn) {
            loginBtn.textContent = "Login";
            loginBtn.onclick = (e) => {
                e.preventDefault();
                window.openOverlay();
                window.showLogin();
            };
        }
    }
  })
});
