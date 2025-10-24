/*
 * =================================================================
 * ARCHIVO JAVASCRIPT FUSIONADO (eventos.js)
 * Contiene:
 * 1. Lógica de Sesión y Autenticación (de scripts.js)
 * 2. Lógica del Menú de Navegación (de scripts.js)
 * 3. Lógica del Formulario de Registro (de eventos.js original)
 * =================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. CONFIGURACIÓN GLOBAL Y URL ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

    // --- 2. ELEMENTOS DEL DOM (FUSIÓN) ---
    
    // Elementos de Login y Sesión
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
    
    // Elementos del Menú
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // Elementos del Formulario de Eventos (del eventos.js original)
    const eventosForm = document.getElementById('eventosForm');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');

    // --- 3. ESTADO GLOBAL ---
    let currentUser = null;

    // --- 4. LÓGICA DE SESIÓN Y AUTENTICACIÓN ---

    // Comprobar la sesión al cargar la página
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAdminPanel(); // Función simple para esta página
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
                    showAdminPanel(); // Muestra el formulario de registro
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
            if(loginForm) loginForm.reset();
        });
    }

    // Funciones auxiliares de UI de Login
    function showLoginError(message) { if(loginError) { loginError.textContent = message; loginError.classList.remove('hidden'); } }
    function hideLoginError() { if(loginError) loginError.classList.add('hidden'); }
    function setLoginLoading(loading) { 
        if(loginBtn) loginBtn.disabled = loading;
        if(loginBtnText) loginBtnText.textContent = loading ? 'Iniciando...' : 'Iniciar Sesión';
        if(loginSpinner) loginSpinner.classList.toggle('hidden', !loading);
    }

    /**
     * Muestra el panel de administración (en esta página, el formulario de registro)
     */
    function showAdminPanel() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (adminPanel) {
            adminPanel.style.display = 'block';
            adminPanel.classList.add('fade-in');
        }
        if (userInfo) userInfo.classList.remove('hidden');
        if (welcomeUser) welcomeUser.textContent = `Bienvenido, ${currentUser.name}`;
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

    /**
     * Configura el menú dinámicamente
     */
    function setupDynamicMenu() {
        const menuItemsContainer = document.querySelector('#dropdownMenu .py-1');
        if (!menuItemsContainer) return;

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
                eventOption.id = 'menu-item-event';
                eventOption.textContent = 'Crear Eventos';
                menuItemsContainer.appendChild(eventOption);
            }

            if (!existingDashboardOption) {
                const dashOption = document.createElement('a');
                dashOption.href = '../dashboard/';
                dashOption.className = 'text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-brand';
                dashOption.role = 'menuitem';
                dashOption.tabindex = '-1';
                dashOption.id = 'menu-item-dash';
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

    // --- 6. LÓGICA DEL FORMULARIO DE EVENTOS (Tu código original) ---
    // (Esta lógica ahora está protegida, ya que el formulario
    // solo es visible si el usuario ha iniciado sesión)

    if (eventosForm) {
        eventosForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registrando...';
            }

            const checkboxesSeleccionados = document.querySelectorAll('.service-checkbox:checked');
            const serviciosSeleccionados = [];
            
            checkboxesSeleccionados.forEach(cb => {
                if (cb.value) {
                    serviciosSeleccionados.push(cb.value);
                }
            });
            
            const serviciosString = serviciosSeleccionados.join(' ');

            const dataToSend = {
                action: 'registrarEvento',
                asignadoA: document.getElementById('asignadoA').value,
                fechaInicio: document.getElementById('fechaInicio').value,
                fechaFin: document.getElementById('fechaFin').value,
                tipoEvento: document.getElementById('tipoEvento').value,
                nombreEvento: document.getElementById('nombreEvento').value,
                sede: document.getElementById('sede').value,
                servicios: serviciosString,
                comentarios: document.getElementById('comentarios').value 
            };
            
            console.log('Enviando datos:', dataToSend);

            const formData = new FormData();
            formData.append('data', JSON.stringify(dataToSend));

            fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ ¡Evento registrado con éxito!');
                    eventosForm.reset();
                    // Disparamos un evento 'change' para que la UI se reinicie
                    document.getElementById('tipoEvento').dispatchEvent(new Event('change'));
                } else {
                    throw new Error(result.message || 'Error desconocido del servidor.');
                }
            })
            .catch(error => {
                console.error('Error al registrar el evento:', error);
                alert(`❌ Hubo un error: ${error.message}`);
            })
            .finally(() => {
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Registrar Evento';
                }
            });
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(eventosForm) eventosForm.reset();
            // Disparamos un evento 'change' para que la UI se reinicie también al limpiar
            document.getElementById('tipoEvento').dispatchEvent(new Event('change'));
        });
    }
});