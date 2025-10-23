/*
 * =================================================================
 * ARCHIVO JAVASCRIPT FUSIONADO (dashboard.js)
 * Contiene:
 * 1. Lógica de Sesión y Autenticación (de scripts.js)
 * 2. Lógica del Menú de Navegación (de scripts.js)
 * 3. Lógica del Dashboard de Eventos (de dashboard.js original)
 * =================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. CONFIGURACIÓN GLOBAL Y URL ---
    
    // URL ÚNICA (la misma para ambas aplicaciones)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

    // Mapa de Servicios (del dashboard.js original)
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

    // --- 2. ELEMENTOS DEL DOM (FUSIÓN) ---

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
    
    // Elementos del Menú (de scripts.js)
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // Elementos del Dashboard (de dashboard.js original)
    const mesSelect = document.getElementById('filtroMes');
    const anioSelect = document.getElementById('filtroAnio');
    const tipoSelect = document.getElementById('filtroTipo');
    const asignadoSelect = document.getElementById('filtroAsignado');
    const sedeSelect = document.getElementById('filtroSede');
    const estadoSelect = document.getElementById('filtroEstado');
    const container = document.getElementById('eventosContainer');
    const loading = document.getElementById('loadingState');

    // --- 3. ESTADO GLOBAL (FUSIÓN) ---
    
    let currentUser = null; // Para la sesión (de scripts.js)
    let allEventosDelMes = []; // Para el dashboard (de dashboard.js original)

    // --- 4. LÓGICA DE SESIÓN Y AUTENTICACIÓN (de scripts.js) ---
    
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
                        username: username,
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
            loginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
            adminPanel.classList.remove('fade-in');
            userInfo.classList.add('hidden');
            loginForm.reset();
        });
    }

    // Funciones auxiliares de UI de Login (de scripts.js)
    function showLoginError(message) { loginError.textContent = message; loginError.classList.remove('hidden'); }
    function hideLoginError() { loginError.classList.add('hidden'); }
    function setLoginLoading(loading) { loginBtn.disabled = loading; loginBtnText.textContent = loading ? 'Iniciando...' : 'Iniciar Sesión'; loginSpinner.classList.toggle('hidden', !loading); }

    /**
     * NUEVA FUNCIÓN FUSIONADA
     * Reemplaza a 'showAdminPanel' de scripts.js.
     * Muestra el panel y, además, inicia la carga de eventos del dashboard.
     */
    function showAdminPanelAndLoadEvents() {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        adminPanel.classList.add('fade-in'); // Añade la animación
        userInfo.classList.remove('hidden');
        welcomeUser.textContent = `Bienvenido, ${currentUser.name}`;

        // Ahora que el panel es visible, inicializamos la lógica del dashboard
        populateFilters(); // (de dashboard.js)
        loadEvents(); // (de dashboard.js)
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
            if (existingAssignOption) {
                existingAssignOption.remove();
                existingCreateEventOption.remove();
                existingDashboardOption.remove();
            }
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
                assignOption.id = 'menu-item-assign';
                assignOption.textContent = 'Asignar';
                menuItemsContainer.appendChild(assignOption);
            }
            if (!existingCreateEventOption) {
                const eventOption = document.createElement('a');
                eventOption.href = '../eventos/';
                eventOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
                eventOption.role = 'menuitem';
                eventOption.tabindex = '-1';
                eventOption.id = 'menu-item-assign';
                eventOption.textContent = 'Crear Eventos';
                menuItemsContainer.appendChild(eventOption);
            }

            if (!existingDashboardOption) {
                const dashOption = document.createElement('a');
                dashOption.href = '../dashboard/';
                dashOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
                dashOption.role = 'menuitem';
                dashOption.tabindex = '-1';
                dashOption.id = 'menu-item-assign';
                dashOption.textContent = 'Registros Pendientes';
                menuItemsContainer.appendChild(dashOption);
            }       
            
        } else {
            if (existingAssignOption) {

                existingAssignOption.remove();
                existingCreateEventOption.remove();
                existingDashboardOption.remove();
            }
        }
    }

    // --- 6. LÓGICA DEL DASHBOARD DE EVENTOS (del dashboard.js original) ---
    // (Toda esta sección se pega sin cambios, ya que está contenida
    // y solo se ejecuta si el usuario está logueado)

    /**
     * Función para llamar a Google Apps Script
     */
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

    /**
     * Popula los filtros estáticos (Mes y Año)
     */
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

    /**
     * Carga eventos del servidor
     */
    function loadEvents() {
        // Asegurarse de que los elementos existan antes de usarlos
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

    /**
     * Popula los filtros dinámicos (Tipo, Asignado, Sede)
     */
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
            if (selectEl.selectedIndex === -1) {
                selectEl.value = 'todos'; 
            }
        };
        
        populateSelect(tipoSelect, tipos);
        populateSelect(asignadoSelect, asignados);
        populateSelect(sedeSelect, sedes);
    }
    
    /**
     * Resetea los filtros dinámicos
     */
    function resetDynamicFilters() {
        if (!tipoSelect || !asignadoSelect || !sedeSelect || !estadoSelect) return;
        tipoSelect.innerHTML = '<option value="todos">Todos</option>';
        asignadoSelect.innerHTML = '<option value="todos">Todos</option>';
        sedeSelect.innerHTML = '<option value="todos">Todos</option>';
        estadoSelect.value = 'todos'; 
    }

    /**
     * Aplica TODOS los filtros (los nuevos) a la lista
     */
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
     * Renderiza los eventos.
     */
    function renderEvents(eventos) {
        if (!container) return;
        container.innerHTML = ''; 

        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-full text-center">No hay eventos que coincidan con los filtros seleccionados.</p>';
            return;
        }
        eventos.forEach(evento => {
            const card = createEventCard(evento);
            container.appendChild(card);
        });
    }

    /**
     * Función para crear la tarjeta de evento
     */
    function createEventCard(evento) {
        const progreso = evento.totalServicios > 0 ? (evento.serviciosEntregados / evento.totalServicios) * 100 : 100;
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg flex flex-col';
        card.innerHTML = `
            <div class="p-5 cursor-pointer card-header">
                <p class="text-sm text-gray-500">${evento.tipo}</p>
                <h3 class="font-bold text-lg text-gray-800">${evento.nombre}</h3>
                <p class="text-sm text-gray-600 mt-1">${new Date(evento.fechaInicio).toLocaleDateString()} - ${new Date(evento.fechaFin).toLocaleDateString()}</p>
                <p class="text-sm font-medium text-brand mt-1">${evento.sede} / Asignado a: ${evento.asignadoA}</p>
                
                <div class="mt-4">
                    <div class="flex justify-between items-center text-sm mb-1">
                        <span class="font-medium">Progreso</span>
                        <span class="font-bold">${evento.serviciosEntregados} / ${evento.totalServicios}</span>
                    </div>
                    <div class="w-full progress-bar-bg rounded-full h-2.5">
                        <div class="progress-bar-fill h-2.5 rounded-full" style="width: ${progreso}%"></div>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-200 card-details">
                <div class="p-5 space-y-3">
                    <h4 class="font-semibold">Servicios Requeridos</h4>
                    ${evento.servicios && evento.servicios.length > 0 ? evento.servicios.map(s => {
                        const nombreServicio = SERVICIOS_MAPA[s.codigo] || s.codigo;
                        return `
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-medium text-gray-600">${nombreServicio}</label>
                                <div class="flex items-center gap-2" data-service-code="${s.codigo}">
                                    <input type="text" value="${s.link || ''}" ${s.link ? 'disabled' : ''} placeholder="Pegar link de entrega..." class="flex-grow border-gray-300 rounded-md text-sm">
                                    <button class="entregar-btn px-3 py-1 text-sm rounded-md ${s.link ? 'bg-green-500 text-white' : 'bg-brand text-white hover:bg-brand-light'}">
                                        ${s.link ? '✓ Entregado' : 'Entregar'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('') : '<p class="text-sm text-gray-500">No se solicitaron servicios.</p>'}
                </div>
            </div>
        `;

        card.querySelector('.card-header').addEventListener('click', () => {
            const details = card.querySelector('.card-details');
            if (details.style.maxHeight) {
                details.style.maxHeight = null;
            } else {
                details.style.maxHeight = details.scrollHeight + "px";
            }
        });
        
        card.querySelectorAll('.entregar-btn').forEach(btn => {
            if(btn.textContent.includes('Entregado')) return;

            btn.addEventListener('click', () => {
                const serviceDiv = btn.closest('[data-service-code]');
                const codigoServicio = serviceDiv.dataset.serviceCode;
                const input = serviceDiv.querySelector('input[type="text"]');
                const link = input.value.trim();

                if(!link) {
                    alert('Por favor, pega un link antes de entregar.');
                    return;
                }

                btn.disabled = true;
                btn.textContent = '...';

                callGAS('entregarServicio', { idEvento: evento.idEvento, codigoServicio, link })
                    .then(response => {
                        if(response.success){
                           input.disabled = true;
                           btn.textContent = '✓ Entregado';
                           btn.classList.remove('bg-brand', 'hover:bg-brand-light');
                           btn.classList.add('bg-green-500');
                        } else {
                            throw new Error(response.message);
                        }
                    })
                    .catch(error => {
                        alert('Error al entregar: ' + error.message);
                        btn.disabled = false;
                        btn.textContent = 'Entregar';
                    });
            });
        });

        return card;
    }

    // --- 7. EVENT LISTENERS DEL DASHBOARD ---
    // (Estos se inicializan, pero solo se usarán cuando el panel sea visible)
    
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