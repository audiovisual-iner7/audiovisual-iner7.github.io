/*
 * =================================================================
 * ARCHIVO JAVASCRIPT FUSIONADO (dashboard.js)
 * Contiene:
 * 1. Lógica de Sesión y Autenticación
 * 2. Lógica del Menú de Navegación
 * 3. Lógica del Dashboard de Eventos
 * 4. NUEVO: Lógica de Administrador para modificar/eliminar entregas
 * =================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. CONFIGURACIÓN GLOBAL Y URL ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';
    const SERVICIOS_MAPA = {
        'S1': 'COORTINILLA ANIMADA GENERAL', 'S2': 'CORTINILLA ASISTENCIA SESIÓN GENERAL Y ENF',
        'S3': 'CORTINILLA INSCRIPCIÓN', 'S4': 'CORTINILLA ASISTENCIA',
        'S5': 'CORTINILLA EVALUACIÓN DE CALIDAD', 'S6': 'CORTINILLA GENERAL',
        'S7': 'CORTINILLA GRADUADOS', 'S8': 'CORTINILLA RECESOS',
        'S9': 'BANNER VERTICAL PODIUM', 'S10': 'CARTEL IMPRESIÓN',
        'S11': 'CARTEL REVISTA', 'S12': 'ENCABEZADO DE ZOOM',
        'S13': 'ENCABEZADO FORMULARIOS', 'S14': 'FLECHAS',
        'S15': 'FONDOS DE PANTALLA, VIRTUAL Y OBS', 'S16': 'GAFETES',
        'S17': 'MAPA DE DISTRIBUCIÓN DE TALLERES', 'S18': 'MOSCA',
        'S19': 'PLANTILLA DE PRESENTACIONES', 'S20': 'POSTAL DE DIFUSIÓN',
        'S21': 'PROGRAMA PANTALLA LOBBY AUDITORIO RÉBORA', 'S22': 'PROGRAMA: PORTADA E INTERIOR',
        'S23': 'SEÑALÉTICA Y QR PARA TALLERES', 'S24': 'APOYO TÉCNICO',
        'S25': 'DOCUMENTO DE PREGUNTAS Y COMENTARIOS', 'S26': 'FORMATO TRABAJO LIBRES',
        'S27': 'MANUAL EXPOSITORES', 'S28': 'SUPERS',
        'S29': 'SUPERS ORDEN DEL DIA INAUGURACIÓN Y CLAUSURA', 'S30': 'SUPERS PROGRAMA',
        'S31': 'SUPERS SESIÓN GENERAL Y ENFERMERIA', 'S32': 'QR ASISTENCIA',
        'S33': 'QR BANDERÍN', 'S34': 'QR EVALUACION DE CALIDAD',
        'S35': 'QR INSCRIPCIÓN', 'S36': 'QR SESIÓN',
        'S37': 'PROGRAMACIÓN ZOOM', 'S38': 'REEL DE VIDEO DEL EVENTO (SESIÓN, CURSO, JORNADA, ETC)',
        'S39': 'TRANSMITIR INSTAGRAM Y FACEBOOK', 'S40': 'TRANSMISION EN YOUTUBE',
        'S41': 'TRANSMISION ZOOM', 'S42': 'VIDEO CUENTA REGRESIVA',
        'S43': 'VIDEO INTRO DE PROTECCIÓN CIVIL', 'S44': 'VIDEOS SALA DE ESPERA'
    };
    // Lista de usuarios admin (la misma de setupDynamicMenu)
    const ADMIN_USERS_LIST = ['DIANA', 'HILDING', 'GIOVANNY'];

    // --- 2. ELEMENTOS DEL DOM (FUSIÓN) ---
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
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const mesSelect = document.getElementById('filtroMes');
    const anioSelect = document.getElementById('filtroAnio');
    const tipoSelect = document.getElementById('filtroTipo');
    const asignadoSelect = document.getElementById('filtroAsignado');
    const sedeSelect = document.getElementById('filtroSede');
    const estadoSelect = document.getElementById('filtroEstado');
    const container = document.getElementById('eventosContainer');
    const loading = document.getElementById('loadingState');

    // --- 3. ESTADO GLOBAL (FUSIÓN) ---
    let currentUser = null; 
    let allEventosDelMes = [];
    let isAdmin = false; // <-- NUEVO: Flag global de Admin

    // --- 4. LÓGICA DE SESIÓN Y AUTENTICACIÓN ---
    
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        // --- MODIFICADO: Establecer flag de admin ---
        isAdmin = ADMIN_USERS_LIST.includes(currentUser.username.toUpperCase());
        showAdminPanelAndLoadEvents();
        setupDynamicMenu();
    }

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

            const dataToSend = { action: 'login', username: username, password: password };
            const formData = new FormData();
            formData.append('data', JSON.stringify(dataToSend));

            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    currentUser = { username: username, name: result.name || username };
                    // --- MODIFICADO: Establecer flag de admin ---
                    isAdmin = ADMIN_USERS_LIST.includes(currentUser.username.toUpperCase());
                    localStorage.setItem('adminUser', JSON.stringify(currentUser));
                    showAdminPanelAndLoadEvents(); 
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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminUser');
            currentUser = null;
            isAdmin = false; // <-- MODIFICADO: Resetear flag
            loginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
            adminPanel.classList.remove('fade-in');
            userInfo.classList.add('hidden');
            loginForm.reset();
        });
    }

    function showLoginError(message) { loginError.textContent = message; loginError.classList.remove('hidden'); }
    function hideLoginError() { loginError.classList.add('hidden'); }
    function setLoginLoading(loading) { loginBtn.disabled = loading; loginBtnText.textContent = loading ? 'Iniciando...' : 'Iniciar Sesión'; loginSpinner.classList.toggle('hidden', !loading); }

    function showAdminPanelAndLoadEvents() {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        adminPanel.classList.add('fade-in'); 
        userInfo.classList.remove('hidden');
        welcomeUser.textContent = `Bienvenido, ${currentUser.name}`;
        populateFilters(); 
        loadEvents(); 

        checkForUrgentEvents();
    }

    // --- 5. LÓGICA DEL MENÚ DE NAVEGACIÓN ---
    
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

    function setupDynamicMenu() {
        const menuItemsContainer = document.querySelector('#dropdownMenu .py-1');
        if (!menuItemsContainer) return;

        // Usamos la variable global que ya definimos
        const adminUsers = ADMIN_USERS_LIST;
        const existingAssignOption = document.getElementById('menu-item-assign');
        const existingCreateEventOption =  document.getElementById('menu-item-event');
        const existingDashboardOption =  document.getElementById('menu-item-dashboard');

        // La variable global 'isAdmin' ya está seteada
        console.log(`Comprobando permisos para '${currentUser.username}'. ¿Es admin? ${isAdmin}`);

        // Limpiar opciones de admin
        if (existingAssignOption) existingAssignOption.remove();
        if (existingCreateEventOption) existingCreateEventOption.remove();
        if (existingDashboardOption) existingDashboardOption.remove();

        if (isAdmin) {
            // Añadir 'Asignar'
            const assignOption = document.createElement('a');
            assignOption.href = '../admin/';
            assignOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
            assignOption.role = 'menuitem';
            assignOption.tabindex = '-1';
            assignOption.id = 'menu-item-assign';
            assignOption.textContent = 'Asignar';
            menuItemsContainer.appendChild(assignOption);

            // Añadir 'Crear Eventos'
            const eventOption = document.createElement('a');
            eventOption.href = '../eventos/';
            eventOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
            eventOption.role = 'menuitem';
            eventOption.tabindex = '-1';
            eventOption.id = 'menu-item-event';
            eventOption.textContent = 'Crear Eventos';
            menuItemsContainer.appendChild(eventOption);
            
            // Añadir 'Registros Pendientes'
            const dashOption = document.createElement('a');
            dashOption.href = '../dashboard/';
            dashOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
            dashOption.role = 'menuitem';
            dashOption.tabindex = '-1';
            dashOption.id = 'menu-item-dashboard'; // Corregido el ID
            dashOption.textContent = 'Registros Pendientes';
            menuItemsContainer.appendChild(dashOption);
        }
    }


    // --- 6. LÓGICA DEL DASHBOARD DE EVENTOS (MODIFICADA) ---

    function callGAS(action, data) {
        const formData = new FormData();
        const payload = { action, ...data };
        formData.append('data', JSON.stringify(payload));

        return fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json());
    }

    function populateFilters() {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        meses.forEach((mes, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = mes;
            mesSelect.appendChild(option);
        });
        const anioActual = new Date().getFullYear();
        for (let i = anioActual + 1; i >= anioActual - 2; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            anioSelect.appendChild(option);
        }
        mesSelect.value = new Date().getMonth() + 1;
        anioSelect.value = anioActual;
    }

    function loadEvents() {
        if (!mesSelect || !anioSelect || !container || !loading) return;
        const mes = parseInt(mesSelect.value);
        const anio = parseInt(anioSelect.value);
        
        container.innerHTML = '';
        loading.classList.remove('hidden');
        resetDynamicFilters(); 

        callGAS('getEventosDelMes', { mes, anio })
            .then(response => {
                if (response.success) {
                    allEventosDelMes = response.data || []; 
                    populateDynamicFilters(allEventosDelMes); 
                    applyFiltersAndRender(); 
                } else {
                    throw new Error(response.message || 'Error desconocido.');
                }
            })
            .catch(error => {
                allEventosDelMes = []; 
                container.innerHTML = `<p class="text-red-500 col-span-full text-center">Error al cargar eventos: ${error.message}</p>`;
            })
            .finally(() => {
                loading.classList.add('hidden');
            });
    }

    function populateDynamicFilters(eventos) {
        if (!tipoSelect || !asignadoSelect || !sedeSelect) return;
        const tipos = [...new Set(eventos.map(e => e.tipo))].sort();
        const asignados = [...new Set(eventos.map(e => e.asignadoA))].sort();
        const sedes = [...new Set(eventos.map(e => e.sede))].sort();

        const populateSelect = (selectEl, items) => {
            const currentValue = selectEl.value; 
            selectEl.innerHTML = '<option value="todos">Todos</option>'; 
            items.forEach(item => {
                if (item) { 
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    selectEl.appendChild(option);
                }
            });
            selectEl.value = currentValue; 
            if (selectEl.selectedIndex === -1) selectEl.value = 'todos'; 
        };
        populateSelect(tipoSelect, tipos);
        populateSelect(asignadoSelect, asignados);
        populateSelect(sedeSelect, sedes);
    }
    
    function resetDynamicFilters() {
        if (!tipoSelect || !asignadoSelect || !sedeSelect || !estadoSelect) return;
        tipoSelect.innerHTML = '<option value="todos">Todos</option>';
        asignadoSelect.innerHTML = '<option value="todos">Todos</option>';
        sedeSelect.innerHTML = '<option value="todos">Todos</option>';
        estadoSelect.value = 'todos'; 
    }

    function applyFiltersAndRender() {
        if (!tipoSelect || !asignadoSelect || !sedeSelect || !estadoSelect) return;
        const tipo = tipoSelect.value;
        const asignado = asignadoSelect.value;
        const sede = sedeSelect.value;
        const estado = estadoSelect.value;

        const filteredEventos = allEventosDelMes.filter(evento => {
            if (tipo !== 'todos' && evento.tipo !== tipo) return false;
            if (asignado !== 'todos' && evento.asignadoA !== asignado) return false;
            if (sede !== 'todos' && evento.sede !== sede) return false;
            if (estado !== 'todos') {
                const progreso = evento.totalServicios > 0 ? (evento.serviciosEntregados / evento.totalServicios) : 1;
                if (estado === 'completados' && progreso < 1) return false;
                if (estado === 'pendientes' && progreso === 1) return false;
            }
            return true; 
        });
        renderEvents(filteredEventos); 
    }

    /**
     * MODIFICADO: Renderiza los eventos
     * Ahora pasa el flag 'isAdmin' a createEventCard
     */
    function renderEvents(eventos) {
        if (!container) return;
        container.innerHTML = ''; 

        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-full text-center">No hay eventos que coincidan con los filtros seleccionados.</p>';
            return;
        }
        eventos.forEach(evento => {
            // --- MODIFICADO: Pasamos el flag global 'isAdmin' ---
            const card = createEventCard(evento, isAdmin);
            container.appendChild(card);
        });
    }

    /**
     * =============================================================
     * FUNCIÓN HELPER MODIFICADA: renderServiciosList
     * - Añadido botón para ELIMINAR SERVICIO (basurero)
     * =============================================================
     */
    function renderServiciosList(serviciosContainer, evento, isEditing, isCanceled) {
        const servicios = evento.servicios || [];
        serviciosContainer.innerHTML = '';

        if (servicios.length === 0) {
            serviciosContainer.innerHTML = '<p class="text-sm text-gray-500">No se solicitaron servicios.</p>';
            return;
        }
        
        servicios.forEach(s => {
            const nombreServicio = SERVICIOS_MAPA[s.codigo] || s.codigo;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex flex-col gap-1.5';
            
            let htmlInterno = '';
            
            if (isCanceled) {
                // --- VISTA CANCELADA (NUEVO) ---
                // Muestra todo deshabilitado en gris
                htmlInterno = `
                    <label class="text-sm font-medium text-gray-400 line-through">${nombreServicio}</label>
                    <div class="flex items-center gap-2" data-service-code="${s.codigo}">
                        ${s.link
                            ? `<a href="#" onclick="return false;" class="flex-grow border border-gray-200 bg-gray-100 rounded-md text-sm text-gray-500 px-3 py-1.5 truncate cursor-not-allowed" title="Cancelado: ${s.link}">${s.link}</a>`
                            : `<input type="text" value="" placeholder="Cancelado" class="flex-grow border-gray-200 bg-gray-100 rounded-md text-sm cursor-not-allowed" disabled>`
                        }
                        <button class="px-3 py-1 text-sm rounded-md bg-gray-300 text-white cursor-not-allowed" disabled>
                            ${s.link ? '✓' : '-'}
                        </button>
                    </div>
                `;
            } else if (isEditing) {
                // --- VISTA DE EDICIÓN (ADMIN) ---
                htmlInterno = `
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-600">${nombreServicio}</label>
                        <button class="admin-delete-service-btn text-gray-400 hover:text-red-600" 
                                title="Eliminar este servicio del evento"
                                data-service-code-only="${s.codigo}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center gap-2" data-service-code="${s.codigo}">
                        <input type="text" value="${s.link || ''}" placeholder="${s.link ? '' : 'Pegar link de entrega...'}" 
                               class="flex-grow border-gray-300 rounded-md text-sm admin-link-input ${s.link ? '' : 'pending-delivery-input'}">
                        
                        ${s.link
                            ? // Si hay link, mostrar botones de Actualizar y Eliminar (Entrega)
                              `
                              <button class="admin-update-btn px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                      title="Actualizar Link">Actualizar</button>
                              <button class="admin-delete-btn px-2 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                                      title="Eliminar Entrega (X)">X</button>
                              `
                            : // Si no hay link (Pendiente), no mostrar botones extra
                              `
                              `
                        }
                    </div>
                `;
            } else {
                // --- VISTA NORMAL (LECTURA) ---
                // (Esta parte no cambia)
                htmlInterno = `
                    <label class="text-sm font-medium text-gray-600">${nombreServicio}</label>
                    <div class="flex items-center gap-2" data-service-code="${s.codigo}">
                        ${s.link
                            ? `<a href="${s.link}" target="_blank" rel="noopener noreferrer"
                                 class="flex-grow border border-gray-200 bg-gray-50 rounded-md text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-100 px-3 py-1.5 truncate transition-colors"
                                 title="Abrir enlace: ${s.link}">
                                  ${s.link}
                              </a>`
                            : `<input type="text" value="" placeholder="Pegar link de entrega..." 
                                     class="flex-grow border-gray-300 rounded-md text-sm">
                               <button class="entregar-btn px-3 py-1 text-sm rounded-md bg-brand text-white hover:bg-brand-light">Entregar</button>
                              `
                        }
                        ${s.link 
                            ? `<button class="entregar-btn px-3 py-1 text-sm rounded-md bg-green-500 text-white" disabled>✓ Entregado</button>`
                            : ''
                        }
                    </div>
                `;
            }
            
            itemDiv.innerHTML = htmlInterno;
            serviciosContainer.appendChild(itemDiv);
        });
    }


/**
     * =============================================================
     * FUNCIÓN HELPER (CORREGIDA): renderLinkCarpeta
     * Dibuja la UI para el link de la carpeta Drive.
     * Sigue la lógica de "entregar":
     * - Si está vacío, muestra INPUT + GUARDAR (para todos).
     * - Si está lleno, muestra un LINK <a>.
     * - Si es ADMIN y está en MODO EDICIÓN, permite editar o borrar.
     * =============================================================
     */
    function renderLinkCarpeta(container, evento, isEditing, isCanceled) {
        const linkCarpeta = evento.linkCarpeta || '';
        container.innerHTML = ''; // Limpiar

        let htmlInterno = '';

        if (isCanceled) {
            // --- 1. VISTA CANCELADA ---
            htmlInterno = `
                <div class="flex items-center gap-2">
                    <input type="text" value="${linkCarpeta}" placeholder="Cancelado" class="flex-grow border-gray-200 bg-gray-100 rounded-md text-sm cursor-not-allowed" disabled>
                </div>
            `;
        } else if (isEditing) {
            // --- 2. VISTA DE EDICIÓN (ADMIN) ---
            // El admin está editando activamente
            htmlInterno = `
                <div class="flex items-center gap-2">
                    <input type="text" value="${linkCarpeta}" placeholder="Pegar link de carpeta Drive..." 
                           class="flex-grow border-gray-300 rounded-md text-sm admin-link-carpeta-input">
                    <button class="admin-save-link-carpeta-btn px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            title="Actualizar Link Carpeta">
                        Actualizar
                    </button>
                    ${linkCarpeta // Solo mostrar "X" si hay un link que borrar
                        ? `<button class="admin-delete-link-carpeta-btn px-2 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                                  title="Eliminar Link Carpeta">X</button>`
                        : ''
                    }
                </div>
            `;
        } else {
            // --- 3. VISTA DE LECTURA (NORMAL) ---
            if (linkCarpeta) {
                // Link YA EXISTE, mostrar <a>
                htmlInterno = `
                    <div class="flex items-center gap-2">
                        <a href="${linkCarpeta}" target="_blank" rel="noopener noreferrer"
                           class="flex-grow border border-gray-200 bg-gray-50 rounded-md text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-100 px-3 py-1.5 truncate transition-colors"
                           title="Abrir carpeta: ${linkCarpeta}">
                            ${linkCarpeta}
                        </a>
                    </div>
                `;
            } else {
                // Link NO EXISTE, mostrar INPUT + GUARDAR (para todos)
                htmlInterno = `
                    <div class="flex items-center gap-2">
                        <input type="text" value="" placeholder="Pegar link de carpeta Drive..." 
                               class="flex-grow border-gray-300 rounded-md text-sm admin-link-carpeta-input">
                        <button class="admin-save-link-carpeta-btn px-3 py-1 text-sm rounded-md bg-brand text-white hover:bg-brand-light"
                                title="Guardar Link Carpeta">
                            Guardar
                        </button>
                    </div>
                `;
            }
        }
        
        container.innerHTML = htmlInterno;
    }

    /**
     * =============================================================
     * NUEVA FUNCIÓN: showCompletionAnimation
     * Dispara una animación de confeti.
     * =============================================================
     */
    function showCompletionAnimation() {
        // Asegurarse de que la función 'confetti' exista (cargada desde el HTML)
        if (typeof confetti !== 'function') {
            console.log('Confetti library not loaded.');
            return;
        }

        const duration = 1500; // 1.5 segundos
        const end = Date.now() + duration;

        (function frame() {
            // Lanzar confeti
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#003C7D', '#FFFFFF', '#0056b3'] // Colores de tu marca
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#003C7D', '#FFFFFF', '#0056b3'] // Colores de tu marca
            });

            // Seguir lanzando hasta que se acabe el tiempo
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }



    /**
     * =============================================================
     * FUNCIÓN MODIFICADA: createEventCard
     * - Añadido campo "Link Carpeta Drive"
     * =============================================================
     */
    function createEventCard(evento, isAdmin) {
        const isCanceled = evento.status === 'Cancelado';
        const progreso = evento.totalServicios > 0 ? (evento.serviciosEntregados / evento.totalServicios) * 100 : 100;
        const isCompleted = !isCanceled && ((progreso === 100) || (evento.status === 'Entregado'));
        let progressBarColorClass = ''; 
        if (isCanceled) {
            progressBarColorClass = 'bg-gray-400'; 
        } else if (isCompleted) {
            progressBarColorClass = 'bg-green-500'; 
        }
        const card = document.createElement('div');
        card.className = `bg-white rounded-xl shadow-lg flex flex-col ${isCanceled ? 'opacity-60 bg-gray-50 pointer-events-none' : ''}`;
        card.dataset.editMode = 'false'; 
        card.dataset.idEvento = evento.idEvento; 
        card.innerHTML = `
            <div class="p-5 ${isCanceled ? '' : 'cursor-pointer'} card-header">
                <div class="flex justify-between items-start gap-2">
                    <p class="text-sm text-gray-500">${evento.tipo}</p>
                    ${(isAdmin && !isCanceled) 
                        ? `<button class="admin-cancel-btn -mt-1 px-3 py-1 text-xs rounded-md bg-red-100 text-red-700 hover:bg-red-200">
                               Cancelar Evento
                           </button>` 
                        : (isCanceled ? '<span class="text-sm font-bold text-red-600">CANCELADO</span>' : (isCompleted ? '<span class="text-sm font-bold text-green-600">COMPLETADO</span>' : ''))
                    }
                </div>
                <h3 class="font-bold text-lg text-gray-800 ${isCanceled ? 'line-through' : ''}">${evento.nombre}</h3>
                <p class="text-sm text-gray-600 mt-1">${new Date(evento.fechaInicio).toLocaleDateString()} - ${new Date(evento.fechaFin).toLocaleDateString()}</p>
                <p class="text-sm font-medium text-brand mt-1">${evento.sede} / Asignado a: ${evento.asignadoA}</p>
                <div class="mt-4">
                    <div class="flex justify-between items-center text-sm mb-1">
                        <span class="font-medium">Progreso</span>
                        <span class="font-bold">${evento.serviciosEntregados} / ${evento.totalServicios}</span>
                    </div>
                    <div class="w-full progress-bar-bg rounded-full h-2.5">
                        <div class="progress-bar-fill h-2.5 rounded-full ${progressBarColorClass}" style="width: ${progreso}%"></div>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-200 card-details">
                <div class="p-5 space-y-3">
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-2">Link de Carpeta Drive</h4>
                        <div class="link-carpeta-container">
                            </div>
                    </div>
                    <hr class="my-4">
                    <div class="flex justify-between items-center">
                        <h4 class="font-semibold">Servicios Requeridos</h4>
                        ${(isAdmin && !isCanceled && !isCompleted) 
                            ? `<button class="admin-modify-btn px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
                                  Modificar
                              </button>` 
                            : ''
                        }
                    </div>
                    <div class="servicios-list-container space-y-3"></div>
                </div>
            </div>
        `;

        const serviciosContainer = card.querySelector('.servicios-list-container');
        const linkCarpetaContainer = card.querySelector('.link-carpeta-container'); 
        
        renderServiciosList(serviciosContainer, evento, false, isCanceled);
        renderLinkCarpeta(linkCarpetaContainer, evento, false, isCanceled); 

        const header = card.querySelector('.card-header');
        header.addEventListener('click', (e) => {
            if (e.target.closest('.admin-cancel-btn') || isCanceled) return; 
            const details = card.querySelector('.card-details');
            if (details.style.maxHeight) {
                details.style.maxHeight = null;
            } else {
                details.style.maxHeight = details.scrollHeight + "px";
            }
        });

        const cancelBtn = card.querySelector('.admin-cancel-btn');
        if (cancelBtn) {
            // (lógica de 'cancelarEvento' sin cambios)
            cancelBtn.addEventListener('click', () => {
                if (!confirm(`ADVERTENCIA:\n\n¿Estás seguro de que deseas CANCELAR el evento "${evento.nombre}"?`)) return;
                cancelBtn.disabled = true;
                cancelBtn.textContent = '...';
                callGAS('cancelarEvento', { idEvento: evento.idEvento })
                    .then(response => {
                        if (response.success) {
                            alert('Evento cancelado con éxito.');
                            loadEvents(); 
                        } else { throw new Error(response.message); }
                    })
                    .catch(error => {
                        alert('Error al cancelar: ' + error.message);
                        cancelBtn.disabled = false;
                        cancelBtn.textContent = 'Cancelar Evento';
                    });
            });
        }
        
        const detailsContainer = card.querySelector('.card-details');
        
        detailsContainer.addEventListener('click', (e) => {
            if (isCanceled || (isCompleted && !isAdmin)) return; 

            const target = e.target;
            const modifyBtn = target.closest('.admin-modify-btn');
            const deliverBtn = target.closest('.entregar-btn');
            const updateBtn = target.closest('.admin-update-btn');
            const deleteDeliveryBtn = target.closest('.admin-delete-btn');
            const deleteServiceBtn = target.closest('.admin-delete-service-btn');
            const saveLinkCarpetaBtn = target.closest('.admin-save-link-carpeta-btn');
            const deleteLinkCarpetaBtn = target.closest('.admin-delete-link-carpeta-btn'); // <-- NUEVO

            if (modifyBtn) {
                // (lógica de 'Modificar' sin cambios)
                const isEditing = card.dataset.editMode === 'true';
                const newEditMode = !isEditing;
                card.dataset.editMode = newEditMode;
                modifyBtn.textContent = newEditMode ? 'Finalizar' : 'Modificar';
                modifyBtn.classList.toggle('bg-blue-600', newEditMode);
                modifyBtn.classList.toggle('text-white', newEditMode);
                modifyBtn.classList.toggle('bg-gray-200', !newEditMode);
                modifyBtn.classList.toggle('text-gray-700', !newEditMode);
                renderServiciosList(serviciosContainer, evento, newEditMode, isCanceled);
                renderLinkCarpeta(linkCarpetaContainer, evento, newEditMode, isCanceled); 
                return;
            }
            
            if (saveLinkCarpetaBtn) {
                // (lógica de 'Guardar/Actualizar Link Carpeta' sin cambios)
                const input = card.querySelector('.admin-link-carpeta-input');
                const newLink = input.value.trim(); 
                saveLinkCarpetaBtn.disabled = true;
                saveLinkCarpetaBtn.textContent = '...';
                callGAS('actualizarLinkCarpeta', { idEvento: evento.idEvento, link: newLink })
                    .then(response => {
                        if (response.success) {
                            alert('Link de carpeta guardado.');
                            loadEvents(); 
                        } else { throw new Error(response.message); }
                    })
                    .catch(error => {
                        alert('Error al guardar el link: ' + error.message);
                    });
                return;
            }

            // --- ✅ NUEVO EVENT LISTENER: ELIMINAR LINK CARPETA ---
            if (deleteLinkCarpetaBtn) {
                if (!confirm('¿Estás seguro de que deseas ELIMINAR el link de la carpeta?')) {
                    return;
                }
                deleteLinkCarpetaBtn.disabled = true;
                deleteLinkCarpetaBtn.textContent = '...';

                // Llamamos a la misma función, pero con un link vacío
                callGAS('actualizarLinkCarpeta', { idEvento: evento.idEvento, link: "" })
                    .then(response => {
                        if (response.success) {
                            alert('Link de carpeta eliminado.');
                            loadEvents(); // Recargar todo
                        } else {
                            throw new Error(response.message);
                        }
                    })
                    .catch(error => {
                        alert('Error al eliminar el link: ' + error.message);
                    });
                return;
            }
            // --- FIN NUEVO EVENT LISTENER ---

            if (deliverBtn && !deliverBtn.textContent.includes('Entregado')) {
                // (lógica de 'Entregar' sin cambios)
                const serviceDiv = deliverBtn.closest('[data-service-code]');
                const codigoServicio = serviceDiv.dataset.serviceCode;
                const input = serviceDiv.querySelector('input[type="text"]');
                const link = input.value.trim();
                if(!link) return alert('Por favor, pega un link antes de entregar.');
                deliverBtn.disabled = true;
                deliverBtn.textContent = '...';
                callGAS('entregarServicio', { idEvento: evento.idEvento, codigoServicio: codigoServicio, link: link, entregadoPor: currentUser.username })
                    .then(response => {
                        if(response.success){
                           const totalServicios = evento.totalServicios;
                           const nuevosEntregados = evento.serviciosEntregados + 1; 
                           if (totalServicios > 0 && nuevosEntregados === totalServicios) {
                                showCompletionAnimation();
                                setTimeout(loadEvents, 1500);
                           } else {
                                loadEvents(); 
                           }
                        } else { throw new Error(response.message); }
                    })
                    .catch(error => {
                        alert('Error al entregar: ' + error.message);
                        deliverBtn.disabled = false;
                        deliverBtn.textContent = 'Entregar';
                    });
                return;
            }

            if (updateBtn) {
                // (lógica de 'Actualizar Servicio' sin cambios)
                const serviceDiv = updateBtn.closest('[data-service-code]');
                const codigoServicio = serviceDiv.dataset.serviceCode;
                const input = serviceDiv.querySelector('.admin-link-input');
                const newLink = input.value.trim();
                if (!newLink) return alert('El campo de link no puede estar vacío.');
                updateBtn.disabled = true;
                updateBtn.textContent = '...';
                callGAS('modificarEntrega', { idEvento: evento.idEvento, codigoServicio: codigoServicio, newLink: newLink })
                    .then(response => {
                        if(response.success){
                           alert('Link actualizado con éxito.');
                           loadEvents(); 
                        } else { throw new Error(response.message); }
                    })
                    .catch(error => {
                        alert('Error al actualizar: ' + error.message);
                        updateBtn.disabled = false;
                        updateBtn.textContent = 'Actualizar';
                    });
                return;
            }

            if (deleteDeliveryBtn) {
                // (lógica de 'Eliminar Entrega' sin cambios)
                if (!confirm('¿Estás seguro de que deseas ELIMINAR esta entrega?')) return;
                const serviceDiv = deleteDeliveryBtn.closest('[data-service-code]');
                const codigoServicio = serviceDiv.dataset.serviceCode;
                deleteDeliveryBtn.disabled = true;
                deleteDeliveryBtn.textContent = '...';
                callGAS('eliminarEntrega', { idEvento: evento.idEvento, codigoServicio })
                    .then(response => {
                        if(response.success){
                           alert('Entrega eliminada con éxito.');
                           loadEvents();
                        } else { throw new Error(response.message); }
                    })
                    .catch(error => {
                        alert('Error al eliminar: ' + error.message);
                        deleteDeliveryBtn.disabled = false;
                        deleteDeliveryBtn.textContent = 'X';
                    });
                return;
            }
            
            if (deleteServiceBtn) {
                // (lógica de 'Eliminar Servicio' sin cambios)
                const codigoServicio = deleteServiceBtn.dataset.serviceCodeOnly;
                const nombreServicio = SERVICIOS_MAPA[codigoServicio] || codigoServicio;
                if (!confirm(`ADVERTENCIA:\n\n¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE el servicio "${nombreServicio}"?`)) return;
                deleteServiceBtn.disabled = true;
                callGAS('eliminarServicioDeEvento', { idEvento: evento.idEvento, codigoServicio })
                    .then(response => {
                        if (response.success) {
                            alert(`Servicio "${nombreServicio}" eliminado permanentemente.`);
                            loadEvents();
                        } else { throw new Error(response.message); }
                    })
                    .catch(error => {
                        alert('Error al eliminar el servicio: ' + error.message);
                        deleteServiceBtn.disabled = false;
                    });
                return;
            }
        });

        return card;
    }

    /**
     * =============================================================
     * NUEVA FUNCIÓN: showToastNotification
     * Muestra una notificación flotante.
     * =============================================================
     */
    function showToastNotification(title, message) {
        // Crear el elemento
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<h4>${title}</h4><p>${message}</p>`;
        
        // Añadir al body
        document.body.appendChild(toast);

        // 1. Mostrar (después de un pequeño retardo)
        setTimeout(() => {
            toast.classList.add('show');
        }, 100); // 100ms de retardo

        // 2. Ocultar (después de 5 segundos)
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
        }, 5000); // 5000ms = 5 segundos

        // 3. Eliminar del DOM (después de que termine la animación de salida)
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 5300); // 5.3 segundos (5000 + 300ms de transición)
    }

    /**
     * =============================================================
     * NUEVA FUNCIÓN: checkForUrgentEvents
     * Llama al backend para buscar eventos urgentes
     * =============================================================
     */
    function checkForUrgentEvents() {
        // Solo ejecutar si hay un usuario logueado
        if (!currentUser || !currentUser.name) {
            return;
        }

        console.log('Buscando eventos urgentes para:', currentUser.name);
        
        // Usamos currentUser.name porque es el que coincide con la columna "Asignado A"
        callGAS('getMisEventosUrgentes', { nombreUsuario: currentUser.username })
            .then(response => {
                if (response.success && response.data && response.data.length > 0) {
                    const eventCount = response.data.length;
                    const eventNames = response.data.join(', ');
                    
                    showToastNotification(
                        `¡Tienes ${eventCount} evento(s) urgentes!`,
                        `Los siguientes eventos inician pronto: ${eventNames}`
                    );
                } else if (!response.success) {
                    // No mostrar un error al usuario, solo en consola.
                    console.error('Error al verificar eventos urgentes:', response.message);
                }
            })
            .catch(error => {
                console.error('Error de red al verificar eventos urgentes:', error);
            });
    }


    // --- 7. EVENT LISTENERS DEL DASHBOARD ---
    
    if (mesSelect && anioSelect) {
        mesSelect.addEventListener('change', loadEvents);
        anioSelect.addEventListener('change', loadEvents);
    }
    if (tipoSelect && asignadoSelect && sedeSelect && estadoSelect) {
        tipoSelect.addEventListener('change', applyFiltersAndRender);
        asignadoSelect.addEventListener('change', applyFiltersAndRender);
        sedeSelect.addEventListener('change', applyFiltersAndRender);
        estadoSelect.addEventListener('change', applyFiltersAndRender);
    }

}); // Fin de DOMContentLoaded