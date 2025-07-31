document.addEventListener('DOMContentLoaded', function() {
    // URL ÚNICA de tu Google Apps Script (CAMBIA por la tuya)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8I9ZV5R8k3-Td1BnMgO1omTf-hHFs95DUyDPDip_Y_99-uFd09wNE2NeN7r0fZVpHHA/exec';

    // Elementos del DOM
    const loginContainer = document.getElementById('loginContainer');
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');
    const userInfo = document.getElementById('userInfo');
    const welcomeUser = document.getElementById('welcomeUser');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const loadingPendientes = document.getElementById('loadingPendientes');
    const pendientesContainer = document.getElementById('pendientesContainer');
    const pendientesTableBody = document.getElementById('pendientesTableBody');
    const noPendientes = document.getElementById('noPendientes');
    
    // Modal elements
    const assignModal = document.getElementById('assignModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const assignTaskDetails = document.getElementById('assignTaskDetails');
    const assignTo = document.getElementById('assignTo');
    const assignComments = document.getElementById('assignComments');
    const confirmAssignBtn = document.getElementById('confirmAssignBtn');
    const cancelAssignBtn = document.getElementById('cancelAssignBtn');
    const assignBtnText = document.getElementById('assignBtnText');
    const assignSpinner = document.getElementById('assignSpinner');

    let currentUser = null;
    let currentTaskToAssign = null;

    // --- 1. MANEJO DE AUTENTICACIÓN ---
    
    // Verificar si ya hay una sesión activa
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAdminPanel();
        loadPendientes();
    }

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) {
            showLoginError('Por favor, complete todos los campos.');
            return;
        }

        setLoginLoading(true);
        hideLoginError();

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                }),
                
            });

            const result = await response.json();

            if (result.success) {
                currentUser = {
                    username: username,
                    name: result.name || username
                };
                
                // Guardar sesión
                localStorage.setItem('adminUser', JSON.stringify(currentUser));
                
                // Mostrar panel
                showAdminPanel();
                loadPendientes();
            } else {
                showLoginError(result.message || 'Credenciales incorrectas.');
            }
        } catch (error) {
            console.error('Error en login:', error);
            showLoginError('Error de conexión. Intente nuevamente.');
        } finally {
            setLoginLoading(false);
        }
    });

    // Logout
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('adminUser');
        currentUser = null;
        showLoginContainer();
        loginForm.reset();
    });

    // --- 2. FUNCIONES DE UI ---
    
    function showLoginContainer() {
        loginContainer.style.display = 'block';
        adminPanel.style.display = 'none';
        userInfo.classList.add('hidden');
    }

    function showAdminPanel() {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        adminPanel.classList.add('fade-in');
        userInfo.classList.remove('hidden');
        welcomeUser.textContent = `Bienvenido, ${currentUser.name}`;
    }

    function setLoginLoading(loading) {
        loginBtn.disabled = loading;
        if (loading) {
            loginBtnText.textContent = 'Iniciando sesión...';
            loginSpinner.classList.remove('hidden');
        } else {
            loginBtnText.textContent = 'Iniciar Sesión';
            loginSpinner.classList.add('hidden');
        }
    }

    function showLoginError(message) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
    }

    function hideLoginError() {
        loginError.classList.add('hidden');
    }

    // --- 3. CARGAR PENDIENTES ---
    
    refreshBtn.addEventListener('click', loadPendientes);

    async function loadPendientes() {
        showLoadingPendientes();
        
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'getPendientesUsuario',
                    nombre: currentUser.username
                }),
                
            });

            const result = await response.json();

            if (result.result === 'success') {
                displayPendientes(result.pendientes);
            } else {
                console.error('Error al cargar pendientes:', result.message);
                showNoPendientes('Error al cargar las solicitudes pendientes.');
            }
        } catch (error) {
            console.error('Error en loadPendientes:', error);
            showNoPendientes('Error de conexión al cargar las solicitudes.');
        }
    }

    function showLoadingPendientes() {
        loadingPendientes.classList.remove('hidden');
        pendientesContainer.classList.add('hidden');
    }

    function displayPendientes(pendientes) {
        loadingPendientes.classList.add('hidden');
        
        if (!pendientes || pendientes.length === 0) {
            showNoPendientes();
            return;
        }

        pendientesContainer.classList.remove('hidden');
        noPendientes.classList.add('hidden');
        
        pendientesTableBody.innerHTML = '';

        pendientes.forEach((solicitud, index) => {
            const row = createPendienteRow(solicitud, index);
            pendientesTableBody.appendChild(row);
        });
    }

    function showNoPendientes(message = null) {
        loadingPendientes.classList.add('hidden');
        pendientesContainer.classList.add('hidden');
        noPendientes.classList.remove('hidden');
        
        if (message) {
            noPendientes.querySelector('p:last-child').textContent = message;
        }
    }

    function createPendienteRow(solicitud, index) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        const folio = solicitud.folio ;
        // Formatear fecha
        const fecha = new Date(solicitud.fecha).toLocaleDateString('es-MX');
        
        // Truncar textos largos
        const descripcionCorta = truncateText(solicitud.descripcion, 100);
        const articulosCortos = truncateText(solicitud.articulos, 80);
        
        // Determinar color del badge de estatus
        const statusClass = getStatusClass(solicitud.estatus);
        
        row.innerHTML = `
            <td class="text-sm">${folio}</td>
            <td class="text-sm">${fecha}</td>
            <td class="font-medium">${solicitud.solicitante}</td>
            <td class="text-sm" title="${solicitud.descripcion}">${descripcionCorta}</td>
            <td class="text-sm" ">${solicitud.comentarios}</td>

        `;

        // Agregar event listener al botón de asignar
       

        return row;
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function getStatusClass(estatus) {
        switch (estatus?.toLowerCase()) {
            case 'pendiente':
                return 'status-pendiente';
            case 'en proceso':
                return 'status-proceso';
            case 'en revisión':
                return 'status-revision';
            default:
                return 'status-pendiente';
        }
    }


    // --- 5. MANEJO DE TECLADO ---
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !assignModal.classList.contains('hidden')) {
            closeAssignModal();
        }
    });
});