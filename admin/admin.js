// admin.js

// Criando variáveis locais (atalhos) para o código a seguir
// Estes apontam para as variáveis globais que definimos em firebase.js (window.auth/db)
const auth = window.auth;
const db = window.db;

// ----------------------------------------------------------------------

function checkAdminAccess() {

    // Função auxiliar para forçar o redirecionamento para index.html
    const forceRedirect = () => {
        let newUrl = window.location.href;

        // 🛑 CORREÇÃO FINAL: GARANTE A REMOÇÃO DO DIRETÓRIO /ADMIN/
        // 1. Substitui o nome do arquivo atual por 'index.html'.
        newUrl = newUrl.replace('dashboard.html', 'index.html');
        newUrl = newUrl.replace('consultas.html', 'index.html');
        newUrl = newUrl.replace('pacientes.html', 'index.html');

        // 2. Remove a pasta 'admin/' para garantir que o resultado seja a raiz.
        // Isto transforma, por exemplo, '.../admin/index.html' em '.../index.html'.
        newUrl = newUrl.replace('/admin/', '/'); 
        
        window.location.replace(newUrl);
    };
    
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); 

            if (!user) {
                alert('Acesso Negado: Você precisa estar logado para acessar esta página.');
                // Redirecionamento forçado
                forceRedirect();
                return reject('Not logged in');
            }

            try {
                // Checagem do Firestore: Obtém o documento do usuário
                const userDoc = await db.collection('users').doc(user.uid).get();

                if (userDoc.exists && userDoc.data().isAdmin === true) {
                    resolve(user); 
                } else {
                    alert('Acesso Negado: Sua conta não possui permissão de administrador.');
                    // Redirecionamento forçado
                    forceRedirect();
                    return reject('Not an admin');
                }
            } catch (error) {
                alert('Erro de comunicação: Não foi possível verificar suas permissões.');
                // Em caso de erro, também redireciona por segurança
                forceRedirect();
                return reject(error);
            }
        });
    });
}

// Inicia a checagem de acesso e exibe o corpo da página se for bem-sucedida
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess()
        .then(() => {
            // Se o acesso for concedido, remove a classe 'hidden' e exibe a página.
            document.body.classList.remove('hidden');
        })
        .catch(() => {
            // O redirecionamento já é tratado dentro de checkAdminAccess
        });
});