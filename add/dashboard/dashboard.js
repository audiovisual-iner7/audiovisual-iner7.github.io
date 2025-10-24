document.addEventListener('DOMContentLoaded', () => {
    // URL de tu Google Apps Script (la misma que usas en tu otro panel)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

     // Elementos de Login y Sesión (de scripts.js)
    const loginContainer = document.getElementById('loginContainer');
    const adminPanel = document.getElementById('adminPanel'); // Este es ahora el contenedor del dashboard
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');
    const userInfo = document.getElementById('userInfo');
    const welcomeUser = document.getElementById('welcomeUser');
    const logoutBtn = document.getElementById('logoutBtn');

    let currentUser = null; // Para la sesión (de scripts.js)
    
    // Elementos del Menú (de scripts.js)
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // --- ELEMENTOS DEL DOM ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const dashboardContainer = document.getElementById('dashboard-container');
    const noPendientesMsg = document.getElementById('no-pendientes');
    const sortSelect = document.getElementById('sort-select');

    // --- ESTADO DE LA APLICACIÓN ---
    let originalData = {}; // Almacenará los datos originales agrupados por persona

     // Comprobar la sesión al cargar la página
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAdminPanelAndLoadEvents(); // Función modificada para arrancar el dashboard
        setupDynamicMenu();
    }

    // Manejador del formulario de login
    if (loginForm) {
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

            const dataToSend = {
                action: 'login',
                username: username,
                password: password
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(dataToSend));

            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    currentUser = {
                        username: result.name || username, // Corregido: Tomar el nombre de la respuesta
                        name: result.name || username
                    };
                    localStorage.setItem('adminUser', JSON.stringify(currentUser));
                    showAdminPanelAndLoadEvents(); // Arranca el dashboard al loguearse
                    setupDynamicMenu();
                } else {
                    showLoginError(result.message || 'Credenciales incorrectas.');
                }
            } catch (error) {
                console.error('Error en login:', error);
                showLoginError('Error de conexión o en la respuesta del servidor.');
            } finally {
                setLoginLoading(false);
            }
        });
    }

    // Manejador del botón de Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminUser');
            currentUser = null;
            if (loginContainer) loginContainer.style.display = 'block';
            if (adminPanel) {
                adminPanel.style.display = 'none';
                adminPanel.classList.remove('fade-in');
            }
            if (userInfo) userInfo.classList.add('hidden');
            if (loginForm) loginForm.reset();
        });
    }

    // Funciones auxiliares de UI de Login (de scripts.js)
    function showLoginError(message) { if(loginError) { loginError.textContent = message; loginError.classList.remove('hidden'); } }
    function hideLoginError() { if(loginError) loginError.classList.add('hidden'); }
    function setLoginLoading(loading) { 
        if(loginBtn) loginBtn.disabled = loading;
        if(loginBtnText) loginBtnText.textContent = loading ? 'Iniciando...' : 'Iniciar Sesión';
        if(loginSpinner) loginSpinner.classList.toggle('hidden', !loading);
    }

    /**
     * FUNCIÓN CORREGIDA
     * Muestra el panel y, además, inicia la carga de datos de ESTE dashboard.
     */
    function showAdminPanelAndLoadEvents() {
        if(loginContainer) loginContainer.style.display = 'none';
        if(adminPanel) {
            adminPanel.style.display = 'block';
            adminPanel.classList.add('fade-in'); // Añade la animación
        }
        if(userInfo) userInfo.classList.remove('hidden');
        if(welcomeUser) welcomeUser.textContent = `Bienvenido, ${currentUser.name}`;

        // ✅ ¡CORRECCIÓN! ✅
        // Esta es la función correcta para cargar los datos de este panel
        initDashboard();
    }

    // --- 5. LÓGICA DEL MENÚ DE NAVEGACIÓN (de scripts.js) ---
    
    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', function(event) {
            dropdownMenu.classList.toggle('hidden');
            event.stopPropagation(); 
        });

        window.addEventListener('click', function(event) {
            if (!dropdownMenu.classList.contains('hidden')) {
                dropdownMenu.classList.add('hidden');
            }
        });
    }

    /**
     * Configura el menú dinámicamente (de scripts.js)
     * NOTA: La lógica de adminUsers se copia tal cual.
     */
    function setupDynamicMenu() {
        const menuItemsContainer = document.querySelector('#dropdownMenu .py-1');
        if (!menuItemsContainer) return;

        // Esta lista de usuarios admin se trae de scripts.js
        const adminUsers = ['DIANA', 'HILDING', 'GIOVANNY'];
        const existingAssignOption = document.getElementById('menu-item-assign');
        const existingCreateEventOption =  document.getElementById('menu-item-event');
        const existingDashboardOption =  document.getElementById('menu-item-dashboard');

        if (!currentUser) {
            if (existingAssignOption) existingAssignOption.remove();
            if (existingCreateEventOption) existingCreateEventOption.remove();
            if (existingDashboardOption) existingDashboardOption.remove();
            return;
        }
        
        const isAdmin = adminUsers.includes(currentUser.username.toUpperCase());
        console.log(`Comprobando permisos para '${currentUser.username}'. ¿Es admin? ${isAdmin}`);

        if (isAdmin) {
            if (!existingAssignOption) {
                const assignOption = document.createElement('a');
                assignOption.href = '../admin/';
                assignOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
                assignOption.role = 'menuitem';
                assignOption.tabindex = '-1';
                assignOption.id = 'menu-item-assign'; // ID único 1
                assignOption.textContent = 'Asignar';
                menuItemsContainer.appendChild(assignOption);
            }
            if (!existingCreateEventOption) {
                const eventOption = document.createElement('a');
                eventOption.href = '../eventos/';
                eventOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
                eventOption.role = 'menuitem';
                eventOption.tabindex = '-1';
                eventOption.id = 'menu-item-event'; // ✅ ID único 2 (Corregido)
                eventOption.textContent = 'Crear Eventos';
                menuItemsContainer.appendChild(eventOption);
            }

            if (!existingDashboardOption) {
                const dashOption = document.createElement('a');
                dashOption.href = '../dashboard/';
                dashOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
                dashOption.role = 'menuitem';
                dashOption.tabindex = '-1';
                dashOption.id = 'menu-item-dashboard'; // ✅ ID único 3 (Corregido)
                dashOption.textContent = 'Registros Pendientes';
                menuItemsContainer.appendChild(dashOption);
            }       
            
        } else {
            if (existingAssignOption) existingAssignOption.remove();
            if (existingCreateEventOption) existingCreateEventOption.remove();
            if (existingDashboardOption) existingDashboardOption.remove();
        }
    }

    /**
     * Función principal que se ejecuta al cargar la página para obtener los datos.
     */
    async function initDashboard() {
        // Asegurarse de que los elementos del dashboard existan
        if (!dashboardContainer || !loadingIndicator) {
            console.error("No se encontraron los elementos del dashboard. Revisa tu HTML.");
            return;
        }
        showLoading(true);
        try {
            const formData = new FormData();
            formData.append('data', JSON.stringify({ action: 'getAllPendientes' }));

            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                originalData = result.data;
                // Renderizar la vista inicial agrupada por persona (o lo que dicte el sort-select)
                handleSortChange();
            } else {
                throw new Error(result.message || 'Error desconocido al cargar los datos.');
            }

        } catch (error) {
            console.error('Error al inicializar el dashboard:', error);
            dashboardContainer.innerHTML = `<p class="text-center text-red-500 font-semibold">No se pudieron cargar los datos. Error: ${error.message}</p>`;
        } finally {
            showLoading(false);
        }
    }

    /**
     * Renderiza los pendientes agrupados por persona.
     * @param {object} data - Los datos agrupados por persona.
     */
    function renderByPerson(data) {
        dashboardContainer.innerHTML = '';
        const people = Object.keys(data).sort(); // Ordenar nombres alfabéticamente

        if (people.length === 0) {
            if(noPendientesMsg) noPendientesMsg.classList.remove('hidden');
            return;
        }
        if(noPendientesMsg) noPendientesMsg.classList.add('hidden');

        people.forEach(person => {
            const tasks = data[person];
            const personSection = document.createElement('div');
            personSection.innerHTML = `
                <div class="flex items-center gap-3 mb-4">
                    <h2 class="text-2xl font-bold text-brand">${person}</h2>
                    <span class="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">${tasks.length} pendiente(s)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${tasks.map(task => createTaskCard(task)).join('')}
                </div>
            `;
            dashboardContainer.appendChild(personSection);
        });
    }

    /**
     * Renderiza todos los pendientes en una sola lista, ordenada por fecha.
     * @param {object} data - Los datos originales agrupados.
     * @param {'asc' | 'desc'} order - El orden ('asc' para antiguos, 'desc' para recientes).
     */
    function renderByDate(data, order = 'asc') {
        dashboardContainer.innerHTML = '';
        
        let allTasks = [];
        for (const person in data) {
            data[person].forEach(task => {
                allTasks.push({ ...task, asignadoA: person }); // Añadir a quién está asignada
            });
        }
        
        if (allTasks.length === 0) {
            if(noPendientesMsg) noPendientesMsg.classList.remove('hidden');
            return;
        }
        if(noPendientesMsg) noPendientesMsg.classList.add('hidden');

        allTasks.sort((a, b) => {
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });

        const listContainer = document.createElement('div');
        listContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
        listContainer.innerHTML = allTasks.map(task => createTaskCard(task, true)).join('');
        dashboardContainer.appendChild(listContainer);
    }
    
    /**
     * Crea el HTML para una tarjeta de tarea individual.
     * @param {object} task - El objeto de la tarea.
     * @param {boolean} showOwner - Si es true, muestra a quién está asignada la tarea.
     * @returns {string} El string HTML de la tarjeta.
     */
    function createTaskCard(task, showOwner = false) {
        const fecha = new Date(task.fecha);
        const diasPasados = Math.floor((new Date() - fecha) / (1000 * 60 * 60 * 24));
        
        let borderColorClass = 'border-gray-300';
        if (diasPasados > 7) borderColorClass = 'border-red-500';
        else if (diasPasados > 3) borderColorClass = 'border-yellow-500';

        // Fallback por si la descripción es nula o indefinida
        const descripcion = task.descripcion || "Sin descripción";

        return `
            <div class="task-card bg-white rounded-lg shadow-md p-4 ${borderColorClass}">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-gray-800">${task.folio}</p>
                        <p class="text-sm text-gray-500">${task.solicitante}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-semibold text-gray-600">${fecha.toLocaleDateString('es-MX')}</p>
                        <p class="text-xs text-gray-500">Hace ${diasPasados} días</p>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-3 break-words">${descripcion.substring(0, 100)}${descripcion.length > 100 ? '...' : ''}</p>
                ${showOwner ? `<p class="text-xs font-semibold text-brand mt-3 pt-2 border-t">Asignado a: ${task.asignadoA}</p>` : ''}
            </div>
        `;
    }

    /**
     * Muestra u oculta el indicador de carga.
     * @param {boolean} isLoading - True para mostrar, false para ocultar.
     */
    function showLoading(isLoading) {
        if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !isLoading);
        if (dashboardContainer) dashboardContainer.classList.toggle('hidden', isLoading);
    }

    /**
     * Nueva función para manejar el cambio de orden
     */
    function handleSortChange() {
        if (!sortSelect) return;
        const selectedValue = sortSelect.value;
        switch (selectedValue) {
            case 'persona':
                renderByPerson(originalData);
                break;
            case 'antiguo':
                renderByDate(originalData, 'asc');
                break;
            case 'reciente':
                renderByDate(originalData, 'desc');
                break;
        }
    }

    // --- EVENT LISTENERS ---
    if(sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }

    // --- ELIMINADA LA LLAMADA A initDashboard() DE AQUÍ ---
    // La lógica de sesión se encarga de llamarlo.
});