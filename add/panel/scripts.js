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

    let pendientesList = []; // Para almacenar los pendientes y usarlos en el combo
    let selectedServices = []; // Para almacenar los servicios seleccionados
    let selectedServicio = null;
    let serviciosCart = [];

    // Lista de servicios
    const serviciosList = [
        'ANIMACIÓN',
        'APOYO ADMINISTRATIVO',
        'APOYO AUDIOVISUAL',
        'APOYO TÉCNICO INFORMÁTICO',
        'APOYO TÉCNICO',
        'AUDIOGRABACIÓN',
        'CD: GRABADO O EN BLANCO',
        'CENTÍMETROS PLOTTER',
        'DIBUJO E ILUSTRACIÓN',
        'DISEÑO IMPRESIÓN MONTAJE Y CORTE',
        'DISEÑO',
        'DVD: GRABADO O EN BLANCO',
        'EDICIÓN DE FOTOGRAFÍA DIGITAL',
        'ENGARGOLADOS',
        'ESCANEOS',
        'FOTOGRAFÍAS BANCO DE IMÁGEN',
        'FOTOGRAFÍAS COMPARTIDAS',
        'HOJAS CARTA',
        'HOJAS DE REUSO',
        'HOJAS OFICIO',
        'HOJAS PAPEL ESPECIAL',
        'HOJAS TABLOIDE',
        'IMPRESIÓN PAPEL REUSO',
        'IMPRESIONES CARTA',
        'IMPRESIONES OFICIO',
        'IMPRESIONES PAPEL ESPECIAL',
        'IMPRESIONES TABLOIDE',
        'PLACA DE BATERÍA',
        'PLACA DE FOAMBOARD',
        'PRESTAMO DE EQUIPO',
        'PRODUCCIÓN AUDIOVISUAL',
        'VIDEO BANCO DE IMÁGEN',
        'VIDEOS COMPARTIDOS',
        'VIDEOS EDITADOS'
    ];
    
    // Modal elements
    const assignModal = document.getElementById('assignModal');


    let currentUser = null;


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

        // Guardar para usar en el combo - MOVER ESTAS LÍNEAS AQUÍ
        pendientesList = pendientes;
        populateFolioCombo(pendientes);

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


    // --- NUEVAS FUNCIONES PARA EL FORMULARIO ---

        // Elementos del DOM para el formulario (agregar al inicio con los otros elementos)
        const folioSolicitud = document.getElementById('folioSolicitud');
        const duplicadorDigital = document.getElementById('duplicadorDigital');
        const numeroMasters = document.getElementById('numeroMasters');
        const serviciosBusqueda = document.getElementById('serviciosBusqueda');
        const serviciosDropdown = document.getElementById('serviciosDropdown');
        const serviciosSeleccionados = document.getElementById('serviciosSeleccionados');
        const serviciosCartContainer = document.getElementById('serviciosCart');
        const nuevaSolicitudForm = document.getElementById('nuevaSolicitudForm');

        function populateFolioCombo(pendientes) {
            if (!folioSolicitud) return; // Si no existe el elemento, no hacer nada
            
            // Limpiar opciones existentes excepto la primera
            folioSolicitud.innerHTML = '<option value="">Seleccionar folio...</option>';
            
            // Agregar folios de pendientes
            pendientes.forEach(pendiente => {
                const option = document.createElement('option');
                option.value = pendiente.folio;
                option.textContent = `${pendiente.folio} - ${pendiente.solicitante}`;
                option.dataset.pendiente = JSON.stringify(pendiente);
                folioSolicitud.appendChild(option);
            });
        }

        function autoFillFormData(pendiente) {
            // Llenar campos que coincidan
            if (pendiente.fecha) {
                const fechaInput = document.getElementById('fechaSolicitud');
                if (fechaInput) fechaInput.value = formatDateForInput(pendiente.fecha);
            }
            if (pendiente.solicitante) {
                const solicitanteInput = document.getElementById('nombreSolicitante');
                if (solicitanteInput) solicitanteInput.value = pendiente.solicitante;
            }
            if (pendiente.descripcion) {
                const descripcionInput = document.getElementById('descripcionTrabajo');
                if (descripcionInput) descripcionInput.value = pendiente.descripcion;
            }
        }

        function clearFormData() {
            // Limpiar campos autocompletables
            const fechaInput = document.getElementById('fechaSolicitud');
            const solicitanteInput = document.getElementById('nombreSolicitante');
            const descripcionInput = document.getElementById('descripcionTrabajo');
            
            if (fechaInput) fechaInput.value = '';
            if (solicitanteInput) solicitanteInput.value = '';
            if (descripcionInput) descripcionInput.value = '';
        }

        function formatDateForInput(dateString) {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        }

        function displayServiceDropdown(services) {
            if (!serviciosDropdown) return;
            
            serviciosDropdown.innerHTML = '';
            
            if (services.length === 0) {
                serviciosDropdown.classList.add('hidden');
                return;
            }

            services.forEach(service => {
                const item = document.createElement('div');
                item.className = 'service-dropdown-item';
                item.textContent = service;
                item.addEventListener('click', () => addServiceToCart(service));
                serviciosDropdown.appendChild(item);
            });

            serviciosDropdown.classList.remove('hidden');
        }

        function addServiceToCart(serviceName) {
            // Verificar si el servicio ya está en el carrito
            if (selectedServices.find(s => s.name === serviceName)) {
                alert('Este servicio ya está agregado');
                return;
            }

            const service = {
                name: serviceName,
                quantity: 1,
                specifications: ''
            };

            selectedServices.push(service);
            updateServicesCart();
            
            // Limpiar búsqueda
            if (serviciosBusqueda) serviciosBusqueda.value = '';
            if (serviciosDropdown) serviciosDropdown.classList.add('hidden');
        }

        function updateServicesCart() {
            if (!serviciosSeleccionados || !serviciosCartContainer) return; // ← Cambiar aquí
            
            if (selectedServices.length === 0) {
                serviciosSeleccionados.classList.add('hidden');
                return;
            }

            serviciosSeleccionados.classList.remove('hidden');
            serviciosCartContainer.innerHTML = ''; // ← Cambiar aquí

            selectedServices.forEach((service, index) => {
                const cartItem = createCartItem(service, index);
                serviciosCartContainer.appendChild(cartItem); // ← Cambiar aquí
            });
        }

        function createCartItem(service, index) {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium text-gray-900">${service.name}</h4>
                    <button type="button" onclick="removeService(${index})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Cantidad</label>
                        <input type="number" min="1" value="${service.quantity}" 
                            onchange="updateServiceQuantity(${index}, this.value)"
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Especificaciones</label>
                        <input type="text" value="${service.specifications}" 
                            onchange="updateServiceSpecifications(${index}, this.value)"
                            placeholder="Detalles adicionales..."
                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
            `;
            return div;
        }

        // Funciones globales para el manejo del carrito
        window.removeService = function(index) {
            selectedServices.splice(index, 1);
            updateServicesCart();
        };

        window.updateServiceQuantity = function(index, quantity) {
            selectedServices[index].quantity = parseInt(quantity) || 1;
        };

        window.updateServiceSpecifications = function(index, specifications) {
            selectedServices[index].specifications = specifications;
        };

        // Event listeners para el formulario
        if (folioSolicitud) {
            folioSolicitud.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                if (selectedOption.dataset.pendiente) {
                    const pendiente = JSON.parse(selectedOption.dataset.pendiente);
                    autoFillFormData(pendiente);
                } else {
                    clearFormData();
                }
            });
        }

        if (duplicadorDigital) {
            duplicadorDigital.addEventListener('change', function() {
                if (this.checked) {
                    if (numeroMasters) numeroMasters.classList.remove('hidden');
                    const cantidadInput = document.getElementById('cantidadMasters');
                    if (cantidadInput) cantidadInput.required = true;
                } else {
                    if (numeroMasters) numeroMasters.classList.add('hidden');
                    const cantidadInput = document.getElementById('cantidadMasters');
                    if (cantidadInput) {
                        cantidadInput.required = false;
                        cantidadInput.value = '';
                    }
                }
            });
        }

        if (serviciosBusqueda) {
            serviciosBusqueda.addEventListener('input', function() {
                const query = this.value.toLowerCase().trim();
                
                if (query.length === 0) {
                    if (serviciosDropdown) serviciosDropdown.classList.add('hidden');
                    return;
                }

                const filteredServices = serviciosList.filter(service => 
                    service.toLowerCase().includes(query)
                );

                displayServiceDropdown(filteredServices);
            });
        }

        if (nuevaSolicitudForm) {
            nuevaSolicitudForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Recopilar datos del formulario
                const formData = new FormData(this);
                const solicitudData = Object.fromEntries(formData.entries());
                
                // Agregar servicios seleccionados
                solicitudData.servicios = selectedServices;
                
                console.log('Datos de la solicitud:', solicitudData);
                
                // Aquí puedes enviar los datos a tu Google Apps Script
                // submitNuevaSolicitud(solicitudData);
                
                alert('Funcionalidad de envío pendiente de implementar');
            });
        }

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (serviciosBusqueda && serviciosDropdown) {
                if (!serviciosBusqueda.contains(e.target) && !serviciosDropdown.contains(e.target)) {
                    serviciosDropdown.classList.add('hidden');
                }
            }
        });


        // Función para filtrar servicios
        function filterServicios(searchTerm) {
            if (!searchTerm || searchTerm.length < 2) {
                return [];
            }
            
            return serviciosList.filter(servicio => 
                servicio.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10); // Limitar a 10 resultados
        }

        // Función para mostrar dropdown de servicios
        function showServiciosDropdown(servicios) {
            const dropdown = document.getElementById('serviciosDropdown');
            
            if (servicios.length === 0) {
                dropdown.classList.add('hidden');
                selectedServicio = null;
                document.getElementById('agregarServicioBtn').disabled = true;
                return;
            }
            
            dropdown.innerHTML = '';
            servicios.forEach(servicio => {
                const item = document.createElement('div');
                item.className = 'service-dropdown-item';
                item.textContent = servicio;
                item.addEventListener('click', () => {
                    selectServicio(servicio);
                });
                dropdown.appendChild(item);
            });
            
            dropdown.classList.remove('hidden');
        }

        // NUEVA función para seleccionar servicio
        function selectServicio(servicio) {
            selectedServicio = servicio;
            document.getElementById('serviciosBusqueda').value = servicio;
            document.getElementById('serviciosDropdown').classList.add('hidden');
            document.getElementById('agregarServicioBtn').disabled = false;
        }


        // Función para agregar servicio al carrito
        // Función para agregar servicio al carrito (ACTUALIZADA)
        function addServicioToCart(servicio = null) {
            const servicioToAdd = servicio || selectedServicio;
            
            if (!servicioToAdd) {
                alert('Seleccione un servicio primero');
                return;
            }
            
            if (serviciosCart.some(item => item.nombre === servicioToAdd)) {
                alert('Este servicio ya está agregado');
                return;
            }
            
            serviciosCart.push({
                nombre: servicioToAdd,
                cantidad: 1
            });
            
            renderServiciosCart();
            
            // Limpiar búsqueda
            const busquedaInput = document.getElementById('serviciosBusqueda');
            const agregarBtn = document.getElementById('agregarServicioBtn');
            
            if (busquedaInput) busquedaInput.value = '';
            if (agregarBtn) agregarBtn.disabled = true;
            selectedServicio = null;
        }


        // Función para renderizar el carrito de servicios (ACTUALIZADA)
        function renderServiciosCart() {
            const cartContainer = document.getElementById('serviciosCart');
            
            // VERIFICAR que el elemento existe
            if (!cartContainer) {
                console.error('Elemento serviciosCart no encontrado en el HTML');
                return;
            }
            
            cartContainer.innerHTML = '';
            
            serviciosCart.forEach((servicio, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item flex justify-between items-center p-3 bg-gray-50 border rounded-lg mb-2';
                cartItem.innerHTML = `
                    <div class="flex-1">
                        <span class="font-medium text-gray-800">${servicio.nombre}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1">
                            <label class="text-sm text-gray-600">Cant:</label>
                            <input type="number" min="1" value="${servicio.cantidad}" 
                                class="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                onchange="updateServicioCantidad(${index}, this.value)">
                        </div>
                        <button type="button" onclick="editServicio(${index})" 
                                class="px-2 py-1 text-blue-600 hover:text-blue-800 text-sm border border-blue-300 rounded hover:bg-blue-50 transition-colors">
                            Editar
                        </button>
                        <button type="button" onclick="removeServicioFromCart(${index})" 
                                class="px-2 py-1 text-red-600 hover:text-red-800 text-sm border border-red-300 rounded hover:bg-red-50 transition-colors">
                            Eliminar
                        </button>
                    </div>
                `;
                cartContainer.appendChild(cartItem);
            });
            
            const serviciosSeleccionados = document.getElementById('serviciosSeleccionados');
            if (serviciosSeleccionados) {
                if (serviciosCart.length === 0) {
                    serviciosSeleccionados.classList.add('hidden');
                } else {
                    serviciosSeleccionados.classList.remove('hidden');
                }
            }
        }

        // NUEVA función para editar servicio
        function editServicio(index) {
            const servicio = serviciosCart[index];
            const nuevaCantidad = prompt(`Editar cantidad para "${servicio.nombre}":`, servicio.cantidad);
            
            if (nuevaCantidad !== null && nuevaCantidad > 0) {
                serviciosCart[index].cantidad = parseInt(nuevaCantidad);
                renderServiciosCart();
            }
        }

        // Función para eliminar servicio del carrito (SIN CAMBIOS)
        function removeServicioFromCart(index) {
            if (confirm('¿Está seguro de eliminar este servicio?')) {
                serviciosCart.splice(index, 1);
                renderServiciosCart();
            }
        }

        // Event listener para el buscador de servicios
    document.getElementById('serviciosBusqueda').addEventListener('input', function(e) {
        const searchTerm = e.target.value;
        const filteredServicios = filterServicios(searchTerm);
        showServiciosDropdown(filteredServicios);
        
        // Resetear selección si el usuario está escribiendo
        if (selectedServicio && !searchTerm.includes(selectedServicio)) {
            selectedServicio = null;
            document.getElementById('agregarServicioBtn').disabled = true;
        }
    });

            // Event listener para el botón agregar
            document.getElementById('agregarServicioBtn').addEventListener('click', function() {
                addServicioToCart();
            });

            // Ocultar dropdown al hacer click fuera
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.service-search-container')) {
                    document.getElementById('serviciosDropdown').classList.add('hidden');
                }
            });
            

        function showServiceSpecificFields(servicio) {
            // Ocultar todos los campos específicos primero
            hideAllSpecificFields();
            
            const servicioUpper = servicio.toUpperCase();
            
            // Campos para impresiones
            if (servicioUpper.includes('IMPRESIONES')) {
                showImpresionFields();
            }
            
            // Campos para hojas (pero no impresiones)
            else if (servicioUpper.includes('HOJAS')) {
                showHojasFields();
            }
            
            // Campos para plotter
            else if (servicioUpper.includes('CENTÍMETROS PLOTTER')) {
                showPlotterFields();
            }
            
            // Campos para diseño
            else if (servicioUpper.includes('DISEÑO')) {
                showDisenoFields();
            }
            
            // Campos para fotografía
            else if (servicioUpper.includes('FOTOGRAFÍAS') || servicioUpper.includes('EDICIÓN DE FOTOGRAFÍA')) {
                showFotografiaFields();
            }
            
            // Campos para video
            else if (servicioUpper.includes('VIDEO') || servicioUpper.includes('PRODUCCIÓN AUDIOVISUAL')) {
                showVideoFields();
            }
            
            // Campos para CD/DVD
            else if (servicioUpper.includes('CD:') || servicioUpper.includes('DVD:')) {
                showDiscFields();
            }
        }

        function hideAllSpecificFields() {
            const containers = [
                'impresionFields',
                'hojasFields',
                'plotterFields',
                'disenoFields', 
                'fotografiaFields',
                'videoFields',
                'discFields'
            ];
            
            containers.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.classList.add('hidden');
            });
        }

        function showImpresionFields() {
            const container = document.getElementById('impresionFields');
            if (container) container.classList.remove('hidden');
        }

        function showHojasFields() {
            const container = document.getElementById('hojasFields');
            if (container) container.classList.remove('hidden');
        }

        function showPlotterFields() {
            const container = document.getElementById('plotterFields');
            if (container) container.classList.remove('hidden');
        }

        console.log('=== DEBUG ELEMENTOS ===');
        console.log('serviciosBusqueda:', document.getElementById('serviciosBusqueda'));
        console.log('agregarServicioBtn:', document.getElementById('agregarServicioBtn'));
        console.log('serviciosDropdown:', document.getElementById('serviciosDropdown'));
        console.log('serviciosCart:', document.getElementById('serviciosCart'));
        console.log('serviciosSeleccionados:', document.getElementById('serviciosSeleccionados'));
        console.log('folioSolicitud:', document.getElementById('folioSolicitud'));

});