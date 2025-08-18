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
    
// Referencias a los nuevos elementos del modal
    const deliverModal = document.getElementById('deliverModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const deliverTaskDetails = document.getElementById('deliverTaskDetails');
    const confirmDeliverBtn = document.getElementById('confirmDeliverBtn');
    const cancelDeliverBtn = document.getElementById('cancelDeliverBtn');
    const deliverBtnText = document.getElementById('deliverBtnText');
    const deliverSpinner = document.getElementById('deliverSpinner');

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

    // --- 3. CARGAR PENDIENTES ---

     /**
     * Función auxiliar para enviar datos al backend en el formato que espera (e.parameter.data).
     * @param {object} payload El objeto de JavaScript que se enviará.
     * @returns {Promise<object>} La respuesta JSON del servidor.
     */
    async function postData(payload) {
        // 1. Prepara los datos en formato de formulario.
        const formData = new URLSearchParams();
        // 2. Empaqueta todo nuestro objeto JSON como un string dentro del campo 'data'.
        formData.append('data', JSON.stringify(payload));

        // 3. Realiza la petición fetch usando el nuevo formato en el body.
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error en la red: ${response.statusText}`);
        }

        return response.json();
    }
    
    refreshBtn.addEventListener('click', loadPendientes);

    async function loadPendientes() {
        showLoadingPendientes();
        
        try {
            // USA LA NUEVA FUNCIÓN AUXILIAR
            const result = await postData({
                action: 'getRegPendientes'
            });

            if (result.result === 'success') {
                displayPendientes(result.data);
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
            currentPendientes = []; // <-- Asegúrate de vaciarla si no hay datos
            return;
        }

        pendientesContainer.classList.remove('hidden');
        noPendientes.classList.add('hidden');
        
        currentPendientes = pendientes; // <-- GUARDA LOS DATOS AQUÍ
        
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
        
        const fechaValida = solicitud.fecha ? new Date(solicitud.fecha) : null;
        const fechaFormateada = fechaValida ? fechaValida.toLocaleDateString('es-MX') : 'Fecha inválida';
        
        // El resto de la función es igual...
        const descripcionCorta = truncateText(solicitud.descripcion, 100);
        const articulosCortos = truncateText(solicitud.articulos, 80);
        const statusClass = getStatusClass(solicitud.estatus);
        
        row.innerHTML = `
            <td class="text-sm">${solicitud.folio}</td>
            <td class="text-sm">${fechaFormateada}</td>
            <td class="font-medium">${solicitud.nombre}</td>
            <td class="text-sm">${solicitud.area}</td>
            <td class="text-sm">${solicitud.telefono}</td>
            <td class="text-sm" title="${solicitud.descripcion}">${descripcionCorta}</td>
            <td class="text-sm" title="${solicitud.articulos}">${articulosCortos}</td>
            <td>
                <span class="status-badge ${statusClass}">${solicitud.estatus}</span>
            </td>
            <td>
                <button class="deliver-btn bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors" 
                        data-index="${index}">
                    Entregar
                </button>
            </td>
        `;

        // YA NO HAY addEventListener AQUÍ. LO HEMOS QUITADO.
        
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

    // --- 4. MODAL DE ENTREGA ---
    
    

    // Cambiamos la función que crea la fila para que el botón diga "Entregar"
   
    
    function openDeliverModal(solicitud, index) {
    // Punto de Control 1: Verificamos qué datos llegan aquí.
        console.log('Paso 1: Abriendo modal para la solicitud:', solicitud);
        
        currentTaskToDeliver = { ...solicitud, index };
        
        deliverTaskDetails.innerHTML = `
            <p class="mb-2">Vas a marcar la solicitud con</p>
            <p class="font-bold text-xl text-brand">${solicitud.folio}</p>
            <p class="mt-2">como <strong>entregada</strong>. ¿Deseas continuar?</p>
        `;
        
        deliverModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeDeliverModal() {
        deliverModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        currentTaskToDeliver = null;
    }

    pendientesTableBody.addEventListener('click', function(e) {
        // Si el elemento clickeado tiene la clase 'deliver-btn'
        if (e.target && e.target.classList.contains('deliver-btn')) {
            // Obtenemos el índice guardado en el atributo 'data-index'
            const index = e.target.dataset.index;
            
            // Buscamos la solicitud correspondiente en nuestro almacén de datos
            const solicitud = currentPendientes[index];
            
            if (solicitud) {
                // Si la encontramos, abrimos el modal con los datos correctos
                openDeliverModal(solicitud, index);
            } else {
                console.error('No se pudo encontrar la solicitud para el índice:', index);
                alert('Error: No se pudieron cargar los datos de la fila. Por favor, recargue la página.');
            }
        }
    });


    // Event listeners del modal
    closeModalBtn.addEventListener('click', closeDeliverModal);
    cancelDeliverBtn.addEventListener('click', closeDeliverModal);
    
    deliverModal.addEventListener('click', function(e) {
        if (e.target === deliverModal) {
            closeDeliverModal();
        }
    });

    // Confirmar entrega
    confirmDeliverBtn.onclick = async function() {
        console.log('--- Iniciando confirmación (método onclick) ---');
        console.log('1. Valor de currentTaskToDeliver al entrar:', currentTaskToDeliver);
        console.log('2. Valor de currentUser al entrar:', currentUser);

        // Verificación robusta al inicio.
        if (!currentTaskToDeliver || !currentUser) {
            console.error('Error crítico: La información de la tarea o del usuario es nula. Abortando.');
            alert('Error: No se pudo obtener la información. Por favor, recargue la página e intente de nuevo.');
            return;
        }

        // "Aislamos" los valores en variables locales inmediatamente.
        const folioParaEnviar = currentTaskToDeliver.folio;
        const usuarioParaEnviar = currentUser.username;

        console.log('3. Datos aislados listos para enviar:', { folio: folioParaEnviar, usuario: usuarioParaEnviar });

        setDeliverLoading(true);

        try {
            const result = await postData({
                action: 'deliverTask',
                folio: folioParaEnviar,
                deliveredBy: usuarioParaEnviar
            });

            if (result.success) {
                // Guardamos el folio antes de que la variable global se anule
                const folioExitoso = currentTaskToDeliver.folio;
                closeDeliverModal();
                loadPendientes();

                showSuccessMessage(`Solicitud ${folioExitoso} marcada como entregada.`);
            } else {
                alert(result.message || 'Error al confirmar la entrega.');
            }
        } catch (error) {
            // En caso de un error de red, la variable global no se ha anulado
            const folioFallido = currentTaskToDeliver ? currentTaskToDeliver.folio : "desconocido";
            console.error(`Error al entregar tarea para el folio ${folioFallido}:`, error);
            alert('Error de conexión al confirmar la entrega.');
        } finally {
            setDeliverLoading(false);
        }
    };

    function setDeliverLoading(loading) {
        confirmDeliverBtn.disabled = loading;
        if (loading) {
            deliverBtnText.textContent = 'Confirmando...';
            deliverSpinner.classList.remove('hidden');
        } else {
            deliverBtnText.textContent = 'Sí, confirmar entrega';
            deliverSpinner.classList.add('hidden');
        }
    }

    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
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