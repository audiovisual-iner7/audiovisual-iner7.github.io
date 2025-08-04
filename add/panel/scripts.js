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
    var solicitudProceso = null;

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

    async function traerSolicitud(folioSolicitud) {       
        
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'solicitudFolio',
                    folio: folioSolicitud
                }),
                
            });

            const result = await response.json();

            if (result.result === 'success') {
                displayPendientes(result.pendientes);
            } else {
                console.error('Error al cargar solicitud:', result.message);
                showNoPendientes('Error al cargar la solicitud.');
            }
        } catch (error) {
            console.error('Error en loadPendientes:', error);
            showNoPendientes('Error de conexión al cargar la solicitud.');
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

        // Guardar para usar en el combo
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
        const folio = solicitud.folio;
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
            <td class="text-sm">${solicitud.comentarios}</td>
        `;

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
        if (e.key === 'Escape' && assignModal && !assignModal.classList.contains('hidden')) {
            closeAssignModal();
        }
    });

    // --- NUEVAS FUNCIONES PARA EL FORMULARIO ---

    // Elementos del DOM para el formulario
    const folioSolicitud = document.getElementById('folioSolicitud');
    const duplicadorDigital = document.getElementById('duplicadorDigital');
    const numeroMasters = document.getElementById('numeroMasters');
    const serviciosBusqueda = document.getElementById('serviciosBusqueda');
    const serviciosDropdown = document.getElementById('serviciosDropdown');
    const serviciosSeleccionados = document.getElementById('serviciosSeleccionados');
    const serviciosCartContainer = document.getElementById('serviciosCart');
    const nuevaSolicitudForm = document.getElementById('nuevaSolicitudForm');

    // --- FUNCIONES PARA SERVICIOS ---

    // Poblar el dropdown de servicios
    function populateServiciosDropdown(servicios = null) {
        const dropdown = document.getElementById('serviciosDropdown');
        if (!dropdown) return;
        
        const serviciosToShow = servicios || serviciosList;
        dropdown.innerHTML = '';
        
        if (serviciosToShow.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'px-3 py-2 text-gray-500 text-sm';
            noResults.textContent = 'No se encontraron servicios';
            dropdown.appendChild(noResults);
            dropdown.classList.remove('hidden');
            return;
        }
        
        serviciosToShow.forEach(servicio => {
            const item = document.createElement('div');
            item.className = 'service-dropdown-item px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0';
            item.textContent = servicio;
            item.addEventListener('click', () => selectServicio(servicio));
            dropdown.appendChild(item);
        });
        
        dropdown.classList.remove('hidden');
    }

    // Filtrar servicios
    function filterServicios(searchTerm) {
        if (!searchTerm || searchTerm.length === 0) {
            return serviciosList; // Mostrar todos si no hay búsqueda
        }
        
        return serviciosList.filter(servicio => 
            servicio.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Seleccionar servicio
    function selectServicio(servicio) {
        selectedServicio = servicio;
        document.getElementById('serviciosBusqueda').value = servicio;
        document.getElementById('serviciosDropdown').classList.add('hidden');
        document.getElementById('agregarServicioBtn').disabled = false;
        showServiceSpecificFields(servicio);
    }

    // Limpiar selección
    function clearServicioSelection() {
        selectedServicio = null;
        document.getElementById('agregarServicioBtn').disabled = true;
        hideAllSpecificFields();
    }

    // Mostrar campos específicos según el servicio
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

    function showDisenoFields() {
        const container = document.getElementById('disenoFields');
        if (container) container.classList.remove('hidden');
    }

    function showFotografiaFields() {
        const container = document.getElementById('fotografiaFields');
        if (container) container.classList.remove('hidden');
    }

    function showVideoFields() {
        const container = document.getElementById('videoFields');
        if (container) container.classList.remove('hidden');
    }

    function showDiscFields() {
        const container = document.getElementById('discFields');
        if (container) container.classList.remove('hidden');
    }

    // Validar campos específicos del servicio
    function validateServiceFields(servicio) {
        const servicioUpper = servicio.toUpperCase();
        
        if (servicioUpper.includes('IMPRESIONES')) {
            const tipoPapel = document.getElementById('tipoPapelImpresion')?.value;
            const numeroHojas = document.getElementById('numeroHojasImpresion')?.value;
            const numeroImpresiones = document.getElementById('numeroImpresiones')?.value;
            
            if (!tipoPapel || !numeroHojas || !numeroImpresiones) {
                alert('Por favor complete todos los campos requeridos para impresiones');
                return false;
            }
            
            const hojas = parseInt(numeroHojas);
            const impresiones = parseInt(numeroImpresiones);
            
            if (impresiones < hojas || impresiones > hojas * 2) {
                alert(`Las impresiones deben estar entre ${hojas} y ${hojas * 2}`);
                return false;
            }
        }
        else if (servicioUpper.includes('HOJAS')) {
            const tipoPapel = document.getElementById('tipoPapelHojas')?.value;
            const cantidadHojas = document.getElementById('cantidadHojas')?.value;
            
            if (!tipoPapel || !cantidadHojas) {
                alert('Por favor complete todos los campos requeridos para hojas');
                return false;
            }
        }
        else if (servicioUpper.includes('CENTÍMETROS PLOTTER')) {
            const tipoRollo = document.getElementById('tipoRolloPlotter')?.value;
            const centimetros = document.getElementById('centimetrosPlotter')?.value;
            
            if (!tipoRollo || !centimetros) {
                alert('Por favor complete todos los campos requeridos para plotter');
                return false;
            }
        }
        
        return true;
    }

    // Obtener datos específicos del servicio
    function getServiceSpecificData(servicio) {
        const servicioUpper = servicio.toUpperCase();
        const detalles = {};
        
        if (servicioUpper.includes('IMPRESIONES')) {
            detalles.tipoPapel = document.getElementById('tipoPapelImpresion')?.value || '';
            detalles.numeroHojas = document.getElementById('numeroHojasImpresion')?.value || '';
            detalles.numeroImpresiones = document.getElementById('numeroImpresiones')?.value || '';
        }
        else if (servicioUpper.includes('HOJAS')) {
            detalles.tipoPapel = document.getElementById('tipoPapelHojas')?.value || '';
            detalles.cantidadHojas = document.getElementById('cantidadHojas')?.value || '';
        }
        else if (servicioUpper.includes('CENTÍMETROS PLOTTER')) {
            detalles.tipoRollo = document.getElementById('tipoRolloPlotter')?.value || '';
            detalles.centimetros = document.getElementById('centimetrosPlotter')?.value || '';
        }
        
        return detalles;
    }

    // Agregar servicio al carrito
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
        
        // Validar campos requeridos antes de agregar
        if (!validateServiceFields(servicioToAdd)) {
            return;
        }
        
        // Recopilar datos específicos del servicio
        const servicioData = {
            nombre: servicioToAdd,
            cantidad: 1,
            detalles: getServiceSpecificData(servicioToAdd)
        };
        
        serviciosCart.push(servicioData);
        renderServiciosCart();
        document.getElementById('serviciosSeleccionados').classList.remove('hidden');
        
        // Limpiar selección y ocultar campos específicos
        document.getElementById('serviciosBusqueda').value = '';
        hideAllSpecificFields();
        selectedServicio = null;
        document.getElementById('agregarServicioBtn').disabled = true;
        document.getElementById('serviciosDropdown').classList.add('hidden');
    }

    // Renderizar el carrito de servicios
    function renderServiciosCart() {
        const cartContainer = document.getElementById('serviciosCart');
        
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
                    ${Object.keys(servicio.detalles).length > 0 ? 
                        `<div class="text-xs text-gray-600 mt-1">${JSON.stringify(servicio.detalles)}</div>` : ''}
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

    // Funciones globales para el manejo del carrito
    window.updateServicioCantidad = function(index, cantidad) {
        serviciosCart[index].cantidad = parseInt(cantidad) || 1;
        renderServiciosCart();
    };

    window.editServicio = function(index) {
        const servicio = serviciosCart[index];
        const nuevaCantidad = prompt(`Editar cantidad para "${servicio.nombre}":`, servicio.cantidad);
        
        if (nuevaCantidad !== null && nuevaCantidad > 0) {
            serviciosCart[index].cantidad = parseInt(nuevaCantidad);
            renderServiciosCart();
        }
    };

    window.removeServicioFromCart = function(index) {
        if (confirm('¿Está seguro de eliminar este servicio?')) {
            serviciosCart.splice(index, 1);
            renderServiciosCart();
        }
    };

    // --- FUNCIONES PARA EL FORMULARIO ---

    function populateFolioCombo(pendientes) {
        if (!folioSolicitud) return;
        
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
        var solicitudFol = traerSolicitud(pendiente.folio);
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

        if(solicitudFol) {
            const areaInput = document.getElementById('area');
            if (areaInput) areaInput.value = solicitudFol.area;
        }

        solicitudProceso = solicitudFol;
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

    // Validación para impresiones
    function validateImpresiones() {
        const hojasInput = document.getElementById('numeroHojasImpresion');
        const impresionesInput = document.getElementById('numeroImpresiones');
        
        if (!hojasInput || !impresionesInput) return;
        
        const hojas = parseInt(hojasInput.value) || 0;
        const impresiones = parseInt(impresionesInput.value) || 0;
        
        if (hojas > 0 && impresiones > 0) {
            const minImpresiones = hojas;
            const maxImpresiones = hojas * 2;
            
            if (impresiones < minImpresiones) {
                impresionesInput.setCustomValidity(`Mínimo ${minImpresiones} impresiones`);
                impresionesInput.title = `Las impresiones no pueden ser menores al número de hojas (${hojas})`;
            } else if (impresiones > maxImpresiones) {
                impresionesInput.setCustomValidity(`Máximo ${maxImpresiones} impresiones`);
                impresionesInput.title = `Las impresiones no pueden ser más del doble de hojas (${maxImpresiones})`;
            } else {
                impresionesInput.setCustomValidity('');
                impresionesInput.title = '';
            }
        }
    }

    // --- EVENT LISTENERS ---

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

    // Event listener para validar impresiones
    document.addEventListener('input', function(e) {
        if (e.target.id === 'numeroHojasImpresion' || e.target.id === 'numeroImpresiones') {
            validateImpresiones();
        }
    });

    // Event listener para el input de búsqueda
    if (serviciosBusqueda) {
        serviciosBusqueda.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();

            // Si el valor coincide exactamente con un servicio, seleccionarlo
            const exactMatch = serviciosList.find(servicio =>
                servicio.toLowerCase() === searchTerm.toLowerCase()
            );

            if (exactMatch) {
                selectedServicio = exactMatch;
                document.getElementById('agregarServicioBtn').disabled = false;
                showServiceSpecificFields(exactMatch);
            } else {
                // Si no hay coincidencia exacta, limpiar selección
                if (selectedServicio && selectedServicio.toLowerCase() !== searchTerm.toLowerCase()) {
                    clearServicioSelection();
                }
            }

            // Filtrar y mostrar opciones
            const filteredServicios = filterServicios(searchTerm);
            populateServiciosDropdown(filteredServicios);
        });

        // Event listener para mostrar dropdown al hacer focus en el input
        serviciosBusqueda.addEventListener('focus', function(e) {
            const searchTerm = e.target.value.trim();
            const filteredServicios = filterServicios(searchTerm);
            populateServiciosDropdown(filteredServicios);
        });

        // Event listener para navegación con teclado
        serviciosBusqueda.addEventListener('keydown', function(e) {
            const dropdown = document.getElementById('serviciosDropdown');
            const items = dropdown.querySelectorAll('.service-dropdown-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length > 0) {
                    const selected = dropdown.querySelector('.service-dropdown-item.selected');
                    if (selected) {
                        selected.classList.remove('selected', 'bg-blue-100');
                        const next = selected.nextElementSibling;
                        if (next && next.classList.contains('service-dropdown-item')) {
                            next.classList.add('selected', 'bg-blue-100');
                        } else {
                            items[0].classList.add('selected', 'bg-blue-100');
                        }
                    } else {
                        items[0].classList.add('selected', 'bg-blue-100');
                    }
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length > 0) {
                    const selected = dropdown.querySelector('.service-dropdown-item.selected');
                    if (selected) {
                        selected.classList.remove('selected', 'bg-blue-100');
                        const prev = selected.previousElementSibling;
                        if (prev && prev.classList.contains('service-dropdown-item')) {
                            prev.classList.add('selected', 'bg-blue-100');
                        } else {
                            items[items.length - 1].classList.add('selected', 'bg-blue-100');
                        }
                    } else {
                        items[items.length - 1].classList.add('selected', 'bg-blue-100');
                    }
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = dropdown.querySelector('.service-dropdown-item.selected');
                if (selected) {
                    selectServicio(selected.textContent);
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.add('hidden');
                this.blur();
            }
        });
    }

    // Event listener para mostrar/ocultar dropdown al hacer clic en la flecha
    const toggleDropdownBtn = document.getElementById('toggleDropdownBtn');
    if (toggleDropdownBtn) {
        toggleDropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const dropdown = document.getElementById('serviciosDropdown');
            const input = document.getElementById('serviciosBusqueda');

            if (dropdown.classList.contains('hidden')) {
                // Mostrar todos los servicios
                populateServiciosDropdown();
                input.focus();
            } else {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Event listener para el botón agregar
    const agregarServicioBtn = document.getElementById('agregarServicioBtn');
    if (agregarServicioBtn) {
        agregarServicioBtn.addEventListener('click', function() {
            addServicioToCart();
        });
    }

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        const container = document.querySelector('.service-search-container');
        if (container && !container.contains(e.target)) {
            const dropdown = document.getElementById('serviciosDropdown');
            if (dropdown) dropdown.classList.add('hidden');
        }
    });

    if (nuevaSolicitudForm) {
        nuevaSolicitudForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Recopilar datos del formulario
            const formData = new FormData(this);
            const solicitudData = Object.fromEntries(formData.entries());
            
            // Agregar servicios seleccionados
            solicitudData.servicios = serviciosCart;
            
            console.log('Datos de la solicitud:', solicitudData);
            
            // Aquí puedes enviar los datos a tu Google Apps Script
            // submitNuevaSolicitud(solicitudData);
            
            alert('Funcionalidad de envío pendiente de implementar');
        });
    }

    console.log('=== DEBUG ELEMENTOS ===');
    console.log('serviciosBusqueda:', document.getElementById('serviciosBusqueda'));
    console.log('agregarServicioBtn:', document.getElementById('agregarServicioBtn'));
    console.log('serviciosDropdown:', document.getElementById('serviciosDropdown'));
    console.log('serviciosCart:', document.getElementById('serviciosCart'));
    console.log('serviciosSeleccionados:', document.getElementById('serviciosSeleccionados'));
    console.log('folioSolicitud:', document.getElementById('folioSolicitud'));

});