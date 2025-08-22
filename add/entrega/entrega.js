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
    
    let folioToDeliver = null;
    
    // Crear y configurar los nuevos campos del formulario
    deliveryDateInput.type = 'date';
    deliveryDateInput.required = true;
    deliveryDateInput.className = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md';
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Fecha de Entrega';
    dateLabel.className = 'block text-sm font-medium text-gray-700';
    
    deliveredToInput.type = 'text';
    deliveredToInput.placeholder = 'Nombre de la persona que recibe...';
    deliveredToInput.required = true;
    deliveredToInput.className = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Entregado a (Nombre Completo)';
    nameLabel.className = 'block text-sm font-medium text-gray-700 mt-4';

    // Limpiar el contenido estático y añadir los nuevos campos
    deliverTaskDetails.innerHTML = '';
    deliverTaskDetails.appendChild(dateLabel);
    deliverTaskDetails.appendChild(deliveryDateInput);
    deliverTaskDetails.appendChild(nameLabel);
    deliverTaskDetails.appendChild(deliveredToInput);
   
    
    function openDeliverModal(folio) {
        folioToDeliver = folio;
        deliveryDateInput.value = new Date().toISOString().split('T')[0]; // Fecha de hoy
        deliveredToInput.value = '';
        deliverModal.classList.remove('hidden');
    }

    function closeDeliverModal() {
        deliverModal.classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', closeDeliverModal);
    cancelDeliverBtn.addEventListener('click', closeDeliverModal);


    pendientesTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('entregar-btn')) {
            openDeliverModal(e.target.dataset.folio);
        }
    });


    // Event listeners del modal
    confirmDeliverBtn.addEventListener('click', async () => {
        if (!deliveredToInput.value.trim() || !deliveryDateInput.value) {
            alert("Ambos campos, fecha y nombre, son obligatorios.");
            return;
        }

        confirmDeliverBtn.disabled = true;
        confirmDeliverBtn.textContent = 'Registrando...';
        
        try {
            const dataToSend = {
                action: 'deliverTask',
                folio: folioToDeliver,
                recibe: deliveredToInput.value.trim(),
                fechaEntrega: deliveryDateInput.value,
                deliveredBy: currentUser.name // Quién está realizando la acción
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
            alert(`Error: ${error.message}`);
        } finally {
            confirmDeliverBtn.disabled = false;
            confirmDeliverBtn.textContent = 'Sí, confirmar entrega';
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