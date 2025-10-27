/*
 * =================================================================
 * ARCHIVO JAVASCRIPT NUEVO (stats.js)
 * Contiene:
 * 1. Lógica de Sesión y Autenticación (copiada)
 * 2. Lógica del Menú de Navegación (copiada)
 * 3. NUEVO: Lógica de Estadísticas y Gráficas (con Chart.js)
 * =================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. CONFIGURACIÓN GLOBAL Y URL ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';
    const ADMIN_USERS_LIST = ['DIANA', 'HILDING', 'GIOVANNY'];
    // Mapa de Servicios (para la gráfica de servicios)
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
    // Login y Sesión
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
    
    // Filtros
    const mesSelect = document.getElementById('filtroMes');
    const anioSelect = document.getElementById('filtroAnio');
    const actualizarBtn = document.getElementById('actualizarBtn');
    const filtroTipoPeriodoSelect = document.getElementById('filtroTipoPeriodo'); // <-- AÑADIR
    
    // Contenedores de Stats
    const loadingState = document.getElementById('loadingState');
    const statsContainer = document.getElementById('statsContainer');

    // KPIs
    const kpiTotalEventos = document.getElementById('kpiTotalEventos');
    const kpiCompletados = document.getElementById('kpiCompletados');
    const kpiCancelados = document.getElementById('kpiCancelados');
    
    // --- 3. ESTADO GLOBAL ---
    let currentUser = null; 
    let isAdmin = false;
    // Variables para guardar las instancias de las gráficas (para destruirlas)
    let chartInstances = {};

    // --- 4. LÓGICA DE SESIÓN Y AUTENTICACIÓN (copiada) ---
    
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAdmin = ADMIN_USERS_LIST.includes(currentUser.username.toUpperCase());
        showAdminPanelAndLoadStats(); // <-- Función modificada
        setupDynamicMenu();
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // (Lógica de login sin cambios...)
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            if (!username || !password) { showLoginError('Por favor, complete todos los campos.'); return; }
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
                    isAdmin = ADMIN_USERS_LIST.includes(currentUser.username.toUpperCase());
                    localStorage.setItem('adminUser', JSON.stringify(currentUser));
                    showAdminPanelAndLoadStats(); // <-- Función modificada
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
        // (Lógica de logout sin cambios...)
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminUser');
            currentUser = null;
            isAdmin = false;
            loginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
            adminPanel.classList.remove('fade-in');
            userInfo.classList.add('hidden');
            loginForm.reset();
        });
    }

    // (Funciones auxiliares de login sin cambios)
    function showLoginError(message) { loginError.textContent = message; loginError.classList.remove('hidden'); }
    function hideLoginError() { loginError.classList.add('hidden'); }
    function setLoginLoading(loading) { loginBtn.disabled = loading; loginBtnText.textContent = loading ? 'Iniciando...' : 'Iniciar Sesión'; loginSpinner.classList.toggle('hidden', !loading); }

    // --- 5. LÓGICA DEL MENÚ DE NAVEGACIÓN (copiada) ---
    
    if (menuBtn && dropdownMenu) {
        // (Lógica de clic de menú sin cambios)
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
        // (Lógica de setupDynamicMenu sin cambios)
        // ... (Esta función es idéntica a la de tu dashboard.js)
        // ... (Asegúrate de copiarla aquí)
        const menuItemsContainer = document.querySelector('#dropdownMenu .py-1');
        if (!menuItemsContainer) return;

        // Limpiar menú
        menuItemsContainer.innerHTML = '';
        
        // Opciones para todos
        menuItemsContainer.innerHTML += `
            <a href="../calendario/" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">Eventos (Calendario)</a>
            <a href="#" class="font-bold text-brand block px-4 py-2 text-sm bg-gray-100" role="menuitem">Estadísticas</a>
        `;
        
        if (!currentUser) return;
        
        console.log(`Comprobando permisos para '${currentUser.username}'. ¿Es admin? ${isAdmin}`);

        if (isAdmin) {
             menuItemsContainer.innerHTML += `
                <a href="../admin/" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand" role="menuitem" id="menu-item-assign">Asignar</a>
                <a href="../eventos/" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand" role="menuitem" id="menu-item-event">Crear Eventos</a>
                <a href="../dashboard/" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand" role="menuitem" id="menu-item-dashboard">Registros Pendientes</a>
            `;
        }
    }
    
    // --- 6. LÓGICA DE FILTROS Y LLAMADAS ---

    function callGAS(action, data) {
        // (Función callGAS sin cambios)
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
        // (Función populateFilters sin cambios)
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
     * =============================================================
     * NUEVA FUNCIÓN DE INICIO: showAdminPanelAndLoadStats
     * =============================================================
     */
    function showAdminPanelAndLoadStats() {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        adminPanel.classList.add('fade-in'); 
        userInfo.classList.remove('hidden');
        welcomeUser.textContent = `Bienvenido, ${currentUser.name}`;

        populateFilters(); 
        loadStatistics(); // <-- Cargar estadísticas
    }

    /**
     * =============================================================
     * NUEVA FUNCIÓN PRINCIPAL: loadStatistics
     * =============================================================
     */
    function loadStatistics() {
        // --- MODIFICADO ---
        if (!filtroTipoPeriodoSelect || !mesSelect || !anioSelect) return;
        
        const tipoPeriodo = filtroTipoPeriodoSelect.value;
        const anio = parseInt(anioSelect.value);
        let mes = null; // Por defecto, filtramos por año completo

        if (tipoPeriodo === 'mes') {
            mes = parseInt(mesSelect.value); // Solo tomamos el mes si se seleccionó "Mes Específico"
        }
        // --- FIN MODIFICADO ---
        
        loadingState.classList.remove('hidden');
        statsContainer.classList.add('hidden');
        destroyAllCharts(); 

        // --- MODIFICADO: Enviar 'mes' (que puede ser null) y 'anio' ---
        callGAS('getEstadisticasEventos', { mes: mes, anio: anio })
            .then(response => {
                if (response.success) {
                    renderStatistics(response.data);
                } else {
                    throw new Error(response.message || 'Error desconocido.');
                }
            })
            .catch(error => {
                loadingState.innerHTML = `<p class="text-red-500 text-center">Error al cargar estadísticas: ${error.message}</p>`;
            })
            .finally(() => {
                loadingState.classList.add('hidden');
                statsContainer.classList.remove('hidden');
            });
    }

    // --- 7. LÓGICA DE RENDERIZADO DE ESTADÍSTICAS ---

    /**
     * =============================================================
     * NUEVA FUNCIÓN: renderStatistics (Función maestra de render)
     * =============================================================
     */
    function renderStatistics(stats) {
        // 1. Renderizar KPIs
        kpiTotalEventos.textContent = stats.totalEventos || 0;
        kpiCompletados.textContent = stats.totalCompletados || 0;
        kpiCancelados.textContent = stats.totalCancelados || 0;
        
        // 2. Renderizar Gráficas
        renderChart('chartEventosPorTipo', 'pie', stats.eventosPorTipo, 'Eventos por Tipo');
        renderChart('chartEventosPorAsignado', 'bar', stats.eventosPorAsignado, 'Eventos Asignados');
        renderChart('chartServiciosPorPersona', 'bar', stats.serviciosEntregadosPorPersona, 'Servicios Entregados');
        
        // Mapear códigos de servicios a nombres para la gráfica
        const serviciosRequeridosNombres = {};
        for (const [codigo, count] of Object.entries(stats.serviciosRequeridosPorTipo)) {
             const nombre = SERVICIOS_MAPA[codigo] || codigo;
             serviciosRequeridosNombres[nombre] = count;
        }
        renderChart('chartServiciosRequeridos', 'doughnut', serviciosRequeridosNombres, 'Servicios Requeridos');
    }

    /**
     * =============================================================
     * NUEVA FUNCIÓN HELPER: renderChart (para dibujar CUALQUIER gráfica)
     * =============================================================
     */
    function renderChart(canvasId, type, data, label) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        // Convertir data {key: value} a {labels: [], values: []}
        const sortedData = Object.entries(data).sort(([,a],[,b]) => b - a);
        const labels = sortedData.map(item => item[0]);
        const values = sortedData.map(item => item[1]);
        
        // Colores base
        const baseColors = [
            '#003C7D', '#0056b3', '#4a90e2', '#7badec', '#a8c6f0', 
            '#002a59', '#3b5998', '#8b9dc3', '#dfe3ee', '#f7f7f7'
        ];
        
        const chartConfig = {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    backgroundColor: baseColors,
                    borderColor: '#ffffff',
                    borderWidth: (type === 'pie' || type === 'doughnut') ? 2 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: (type === 'pie' || type === 'doughnut') ? 'bottom' : 'none',
                    }
                }
            }
        };
        
        // Opciones específicas para gráficas de barras
        if (type === 'bar') {
            chartConfig.options.scales = {
                y: { beginAtZero: true }
            };
        }

        // Crear y guardar la instancia
        chartInstances[canvasId] = new Chart(ctx, chartConfig);
    }
    
    /**
     * =============================================================
     * NUEVA FUNCIÓN HELPER: destroyAllCharts
     * =============================================================
     */
    function destroyAllCharts() {
        for (const id in chartInstances) {
            if (chartInstances[id]) {
                chartInstances[id].destroy();
                delete chartInstances[id];
            }
        }
    }

    // --- 8. EVENT LISTENERS ---
    actualizarBtn.addEventListener('click', loadStatistics);
    filtroTipoPeriodoSelect.addEventListener('change', () => {
        const tipoSeleccionado = filtroTipoPeriodoSelect.value;
        // Habilitar/deshabilitar el selector de mes
        mesSelect.disabled = (tipoSeleccionado === 'anio');
    });
    // Llamada inicial para asegurar el estado correcto
    mesSelect.disabled = (filtroTipoPeriodoSelect.value === 'anio');
    // --- FIN NUEVO EVENT LISTENER ---

}); // Fin de DOMContentLoaded