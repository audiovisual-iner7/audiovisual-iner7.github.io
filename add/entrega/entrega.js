document.addEventListener('DOMContentLoaded', function() {
    // URL ÚNICA de tu Google Apps Script (CAMBIA por la tuya)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

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
    
  const deliverModal = document.getElementById('deliverModal');
    const deliverForm = document.querySelector('#deliverModal form'); // Busca el form dentro del modal
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelDeliverBtn = document.getElementById('cancelDeliverBtn');
    const confirmDeliverBtn = document.getElementById('confirmDeliverBtn');
    const deliverBtnText = document.getElementById('deliverBtnText');
    const deliverSpinner = document.getElementById('deliverSpinner');
    
    // Estos elementos están DENTRO del modal en tu HTML
    const deliveryDateInput = document.getElementById('deliveryDate');
    const deliveredToInput = document.getElementById('deliveredTo');
    const deliverError = document.getElementById('deliverError');
    const deliveryObservationsInput = document.getElementById('deliveryObservations');

    let currentPendientes = []; 

    let currentTaskToDeliver = null;

    let currentUser = null;


    // --- 1. MANEJO DE AUTENTICACIÓN ---
    
    // Verificar si ya hay una sesión activa
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAdminPanel();
        loadPendientes();
        setupDynamicMenu();
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
            // USA LA NUEVA FUNCIÓN AUXILIAR
            const result = await postData({
                action: 'login',
                username: username,
                password: password
            });

            if (result.success) {
                currentUser = {
                    username: username,
                    name: result.name || username
                };
                localStorage.setItem('adminUser', JSON.stringify(currentUser));
                showAdminPanel();
                loadPendientes();
                setupDynamicMenu();
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

    // --- LÓGICA DE CARGA DE PENDIENTES ---
    refreshBtn.addEventListener('click', loadPendientes);

    async function loadPendientes() {
        showLoadingPendientes();
        try {
            const formData = new FormData();
            formData.append('data', JSON.stringify({ action: 'getRegPendientes' }));
            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.result === 'success') {
                displayPendientes(result.data);
            } else {
                throw new Error(result.error || 'Error al cargar los pendientes.');
            }
        } catch (error) {
            console.error('Error en loadPendientes:', error);
            showNoPendientes('Error de conexión o al cargar datos.');
        }
    }
    
    function displayPendientes(pendientes) {
        pendientesTableBody.innerHTML = '';
        loadingPendientes.classList.add('hidden');
        
        if (!pendientes || pendientes.length === 0) {
            noPendientes.classList.remove('hidden');
            pendientesContainer.classList.add('hidden');
            return;
        }
        
        noPendientes.classList.add('hidden');
        pendientesContainer.classList.remove('hidden');
        
        pendientes.forEach(solicitud => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // Lógica para darle estilo al badge de estatus
            const statusClass = getStatusClass(solicitud.estatus);

            row.innerHTML = `
                <td class="px-4 py-2 text-sm">${solicitud.folio}</td>
                <td class="px-4 py-2 text-sm">${new Date(solicitud.fecha).toLocaleDateString('es-MX')}</td>
                <td class="px-4 py-2 font-medium">${solicitud.nombre}</td>
                <td class="px-4 py-2 text-sm">${solicitud.area}</td>
                <td class="px-4 py-2 text-sm" title="${solicitud.descripcion}">${(solicitud.descripcion || '').substring(0, 30)}...</td>
                <td class="px-4 py-2 text-sm" title="${solicitud.articulos}">${(solicitud.articulos || '').substring(0, 40)}...</td>
                <td class="px-4 py-2 text-sm">
                    <span class="status-badge ${statusClass}">${solicitud.estatus}</span>
                </td>
                <td class="px-4 py-2 text-center">
                    <button data-folio="${solicitud.folio}" class="entregar-btn bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs font-semibold">Entregar</button>
                </td>
            `;
            pendientesTableBody.appendChild(row);
        });
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
            return 'bg-gray-200 text-gray-800'; // Un color por defecto
    }
}

    // --- LÓGICA PARA EL MODAL DE ENTREGA ---
    function openDeliverModal(folio) {
        folioToDeliver = folio;
        deliveryDateInput.value = new Date().toISOString().split('T')[0];
        deliveredToInput.value = '';
        deliveryObservationsInput.value = '';
        deliverError.classList.add('hidden');
        deliverModal.classList.remove('hidden');
        deliverModal.classList.add('flex');
    }

    function closeDeliverModal() {
        deliverModal.classList.add('hidden');
        deliverModal.classList.remove('flex');
    }

    closeModalBtn.addEventListener('click', closeDeliverModal);
    cancelDeliverBtn.addEventListener('click', closeDeliverModal);

    pendientesTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('entregar-btn')) {
            openDeliverModal(e.target.dataset.folio);
        }
    });
    
    deliverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const recibe = deliveredToInput.value.trim();
        const fechaEntrega = deliveryDateInput.value;
        const observaciones = deliveryObservationsInput.value.trim();

        if (!recibe || !fechaEntrega) {
            deliverError.textContent = "Ambos campos son obligatorios.";
            deliverError.classList.remove('hidden');
            return;
        }
        
        setDeliverLoading(true);
        
        try {
            const dataToSend = {
                action: 'deliverTask',
                folio: folioToDeliver,
                recibe: recibe,
                fechaEntrega: fechaEntrega,
                deliveredBy: currentUser.username,
                observaciones: observaciones
            };
            const formData = new FormData();
            formData.append('data', JSON.stringify(dataToSend));

            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                closeDeliverModal();
                alert('Entrega registrada con éxito.');
                loadPendientes();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            deliverError.textContent = `Error: ${error.message}`;
            deliverError.classList.remove('hidden');
        } finally {
            setDeliverLoading(false);
        }
    });
    
    function setDeliverLoading(loading) {
        confirmDeliverBtn.disabled = loading;
        if (loading) {
            deliverBtnText.textContent = 'Confirmando...';
            deliverSpinner.classList.remove('hidden');
        } else {
            deliverBtnText.textContent = 'Confirmar Entrega';
            deliverSpinner.classList.add('hidden');
        }
    }

    function showLoadingPendientes() {
        loadingPendientes.classList.remove('hidden');
        pendientesContainer.classList.add('hidden');
        noPendientes.classList.add('hidden');
    }

    function showNoPendientes(message = "No hay trabajos pendientes por entregar.") {
        loadingPendientes.classList.add('hidden');
        pendientesContainer.classList.add('hidden');
        noPendientes.classList.remove('hidden');
        noPendientes.querySelector('p:last-child').textContent = message;
    }

    // --- 5. MANEJO DE TECLADO ---
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !deliverModal.classList.contains('hidden')) {
            closeDeliverModal();
        }
    });


    // --- 6. MANEJO DEL MENÚ DE NAVEGACIÓN ---
    
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // Abre o cierra el menú al hacer clic en el botón
    menuBtn.addEventListener('click', function(event) {
        dropdownMenu.classList.toggle('hidden');
        // Detiene la propagación para que el listener de 'window' no lo cierre inmediatamente
        event.stopPropagation(); 
    });

    // Cierra el menú si se hace clic en cualquier otro lugar de la página
    window.addEventListener('click', function(event) {
        if (!dropdownMenu.classList.contains('hidden')) {
            dropdownMenu.classList.add('hidden');
        }
    });


    /**
     * Configura el menú de navegación dinámicamente basado en el usuario actual.
     * Es segura de llamar en cualquier página, ya que primero comprueba si el menú existe.
     */
    function setupDynamicMenu() {
        const menuItemsContainer = document.querySelector('#dropdownMenu .py-1');

        if (!menuItemsContainer) {
            return;
        }

        const adminUsers = ['DIANA', 'HILDING', 'GIOVANNY'];
        const existingAssignOption = document.getElementById('menu-item-assign');

        // Verificamos si hay un usuario logueado
        if (!currentUser) {
            // Si no hay usuario, nos aseguramos de que la opción de admin no esté
            if (existingAssignOption) {
                existingAssignOption.remove();
            }
            return;
        }
        
        // Comprobamos si el usuario actual es un administrador.
        const isAdmin = adminUsers.includes(currentUser.username.toUpperCase());

        // --- LÍNEA DE DEPURACIÓN ---
        // Imprimimos en la consola el resultado de la comprobación.
        console.log(`Comprobando permisos para '${currentUser.username}'. ¿Es admin? ${isAdmin}`);
        // --- FIN DE LÍNEA DE DEPURACIÓN ---

        if (isAdmin) {
            if (!existingAssignOption) {
                const assignOption = document.createElement('a');
                assignOption.href = '../admin/';
                assignOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
                assignOption.role = 'menuitem';
                assignOption.tabindex = '-1';
                assignOption.id = 'menu-item-assign';
                assignOption.textContent = 'Asignar';
                menuItemsContainer.appendChild(assignOption);
            }
        } else {
            if (existingAssignOption) {
                existingAssignOption.remove();
            }
        }
    }
});