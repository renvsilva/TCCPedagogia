// admin.js

// Criando variáveis locais (atalhos)
const auth = window.auth;
const db = window.db;
const firebase = window.firebase; 

// ----------------------------------------------------------------------
// Lógica de Verificação de Acesso
// ----------------------------------------------------------------------

function checkAdminAccess() {

    const forceRedirect = () => {
        let newUrl = window.location.href;
        newUrl = newUrl.replace('dashboard.html', 'index.html');
        newUrl = newUrl.replace('consultas.html', 'index.html');
        newUrl = newUrl.replace('pacientes.html', 'index.html');
        newUrl = newUrl.replace('configs.html', 'index.html'); 
        newUrl = newUrl.replace('/admin/', '/');

        window.location.replace(newUrl);
    };

    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe();

            if (!user) {
                forceRedirect();
                return reject('Not logged in');
            }

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();

                if (userDoc.exists && userDoc.data().isAdmin === true) {
                    resolve(user);
                } else {
                    forceRedirect();
                    return reject('Not an admin');
                }
            } catch (error) {
                console.error('Erro ao verificar permissões:', error);
                forceRedirect();
                return reject(error);
            }
        });
    });
}


// ----------------------------------------------------------------------
// FUNÇÕES AUXILIARES DE DADOS
// ----------------------------------------------------------------------

/**
 * Calcula o total de pacientes (para o KPI "Novos Cadastros" funcionar com algum valor).
 */
async function getNewPatientsData() {
    try {
        const snapshot = await db.collection('pacientes').get();
        const count = snapshot.size;

        let lastPatientName = 'N/A';
        // Pega o último paciente registrado (ordenado por nome)
        const recentSnapshot = await db.collection('pacientes').orderBy('nome', 'desc').limit(1).get();
        if (recentSnapshot.size > 0) {
            lastPatientName = recentSnapshot.docs[0].data().nome || 'Paciente sem nome';
        }

        return {
            count: count,
            lastUser: lastPatientName
        };
    } catch (error) {
        console.error("Erro ao buscar Novos Cadastros/Total de Pacientes:", error);
        return { count: 0, lastUser: 'Erro na Busca' };
    }
}


/**
 * Busca o número total de pacientes ativos.
 */
async function getActivePatientsCount() {
    try {
        const snapshot = await db.collection('pacientes')
            .where('status', '==', 'Ativo')
            .get();
        return snapshot.size;
    } catch (error) {
        console.error("Erro ao buscar contagem de pacientes ativos:", error);
        return 'N/A';
    }
}

/**
 * Busca dados de consultas: total na semana e a próxima consulta.
 */
async function getAppointmentData() {
    const results = {
        totalWeek: 0,
        nextAppointment: 'Sem agendamentos',
        list: []
    };

    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // ----------------------------------------------------------------------
        // 1. Busca as próximas 5 consultas
        // ----------------------------------------------------------------------
        const upcomingSnapshot = await db.collection('consultas')
            .where('data', '>=', todayStr)
            .orderBy('data', 'asc') 
            .orderBy('hora', 'asc') 
            .limit(5)
            .get();

        results.list = upcomingSnapshot.docs.map(doc => {
            const data = doc.data();
            const [year, month, day] = data.data.split('-');
            const dateDisplay = `${day}/${month}/${year}`;
            const patientDisplay = data.patientName || data.paciente || 'Paciente sem nome';
            
            return {
                id: doc.id,
                ...data,
                dateStr: dateDisplay,
                timeStr: data.hora
            };
        });

        if (results.list.length > 0) {
            const next = results.list[0];
            results.nextAppointment = `${next.dateStr} • ${next.timeStr}`;
        }

        // ----------------------------------------------------------------------
        // 2. Calcula total de consultas na semana
        // ----------------------------------------------------------------------
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Início no domingo
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0]; 

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Fim no sábado
        const endOfWeekStr = endOfWeek.toISOString().split('T')[0]; 

        const weekSnapshot = await db.collection('consultas')
            .where('data', '>=', startOfWeekStr)
            .where('data', '<=', endOfWeekStr)
            .orderBy('data', 'asc') // CRUCIAL
            .get();

        results.totalWeek = weekSnapshot.size;

    } catch (error) {
        console.error("Falha na busca de Consultas da Semana. Verifique o console do navegador. Se o erro persistir, você DEVE criar um índice composto para o campo 'data' no Firestore.", error);
    }
    return results;
}

/**
 * Busca os últimos pacientes cadastrados para a tabela.
 */
async function getRecentPatients() {
    try {
        const snapshot = await db.collection('pacientes')
            .orderBy('nome', 'asc') 
            .limit(5)
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.nome,     
                age: data.idade,     
                phone: data.contato, 
                ...data
            };
        });
    } catch (error) {
        console.error("Erro ao buscar pacientes recentes:", error);
        return [];
    }
}


// ----------------------------------------------------------------------
// Lógica de Dashboard: Renderização do DOM (CORRIGIDA COM VERIFICAÇÕES NULL)
// ----------------------------------------------------------------------

async function updateDashboard() {
    // Busca todos os dados em paralelo
    const [patientsCount, appointmentData, newPatientsData, recentPatients] = await Promise.all([
        getActivePatientsCount(),
        getAppointmentData(),
        getNewPatientsData(), 
        getRecentPatients()
    ]);

    // === 1. Atualiza KPIs ===
    const kpis = document.querySelectorAll('#dashboard .grid-3 .kpi');

    // KPI 1: Pacientes ativos
    if (kpis[0]) {
        const b = kpis[0].querySelector('b');
        if (b) b.textContent = patientsCount;
    }

    // KPI 2: Consultas esta semana
    if (kpis[1]) {
        const b = kpis[1].querySelector('b');
        const thirdP = kpis[1].querySelector('p:nth-child(3)');
        if (b) b.textContent = appointmentData.totalWeek;
        if (thirdP) thirdP.textContent = `Próxima: ${appointmentData.nextAppointment}`;
    }

    // KPI 3: Novos Cadastros/Total de Pacientes
    // CORRIGIDO: Adicionadas verificações de null
    if (kpis[2]) {
        const b = kpis[2].querySelector('b');
        const h2 = kpis[2].querySelector('h2');
        const thirdP = kpis[2].querySelector('p:nth-child(3)');
        
        if (b) b.textContent = newPatientsData.count; 
        if (h2) h2.textContent = 'Total de Pacientes';
        if (thirdP) thirdP.textContent = `Último Cadastrado: ${newPatientsData.lastUser}`;
    }


    // === 2. Atualiza Tabela de Pacientes Recentes ===
    const tableBody = document.querySelector('#pacientes .table tbody');
    if (tableBody) {
        tableBody.innerHTML = ''; 

        if (recentPatients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">Nenhum paciente recente encontrado.</td></tr>';
        } else {
            recentPatients.forEach(p => {
                const row = tableBody.insertRow();
                row.insertCell().textContent = p.name || 'Sem Nome';
                row.insertCell().textContent = p.age || 'N/A';
                row.insertCell().textContent = p.phone || 'N/A';
                row.insertCell().innerHTML = `<td><a href="pacientes.html?id=${p.id}" class="btn btn-ghost">Ver</a></td>`;
            });
        }
    }


    // === 3. Atualiza Lista de Próximas Consultas ===
    const ul = document.querySelector('#consultas ul');
    if (ul) {
        ul.innerHTML = ''; 

        if (appointmentData.list.length === 0) {
            ul.innerHTML = '<li>Nenhuma consulta futura agendada.</li>';
        } else {
            appointmentData.list.forEach(a => {
                const li = document.createElement('li');
                const patientName = a.patientName || a.paciente || 'Paciente sem nome';
                li.textContent = `🗓️ ${a.dateStr} - ${a.timeStr} - ${patientName}`;
                ul.appendChild(li);
            });
        }
    }

    // === 4. Atualiza Configurações (Preenche os campos do Admin Logado) ===
    if (auth.currentUser) {
        const adminUser = await db.collection('users').doc(auth.currentUser.uid).get();
        const nomeInput = document.querySelector('#configuracoes input[type="text"][value="Dra. Raquel Maciel Reis"]');
        const emailInput = document.querySelector('#configuracoes input[type="email"][value="xzquel@gmail.com"]');
        
        if (adminUser.exists) {
            const adminData = adminUser.data();
            if(nomeInput) nomeInput.value = adminData.name || 'Dra. Raquel Maciel Reis';
            if(emailInput) emailInput.value = adminData.email || auth.currentUser.email || 'xzquel@gmail.com';
        } else {
             if(emailInput) emailInput.value = auth.currentUser.email || 'xzquel@gmail.com';
        }
    }
}


// ----------------------------------------------------------------------
// Execução Principal 
// ----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess()
        .then(() => {
            document.body.classList.remove('hidden');
            updateDashboard();
        })
        .catch(() => {
            // O redirecionamento já é tratado dentro de checkAdminAccess
        });
});