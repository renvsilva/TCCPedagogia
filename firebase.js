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

const storage = firebase.storage();

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

    if (loginOverlay) { // <---- Verificação de página
      loginOverlay.classList.add('hidden');
      loginForm.classList.add('hidden');
      createAccountForm.classList.add('hidden');
    }
  };
  window.showCreate = function () {
    loginForm.classList.add('hidden');
    createAccountForm.classList.remove('hidden');
  };
  window.showLogin = function () {
    createAccountForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
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
