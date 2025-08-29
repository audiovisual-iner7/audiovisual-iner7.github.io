document.addEventListener('DOMContentLoaded', function() {
    // URL ÚNICA de tu Google Apps Script
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';


    // --- ELEMENTOS DEL DOM ---
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
    const nuevaSolicitudForm = document.getElementById('nuevaSolicitudForm');
    const areaInput = document.getElementById('area');
    const areaDropdown = document.getElementById('areaDropdown');
    const serviciosBusqueda = document.getElementById('serviciosBusqueda');
    const serviciosDropdown = document.getElementById('serviciosDropdown');
    const serviciosSeleccionadosContainer = document.getElementById('serviciosSeleccionados');
    const serviciosCart = document.getElementById('serviciosCart');
    const duplicadorDigital = document.getElementById('duplicadorDigital');
    const numeroMastersContainer = document.getElementById('numeroMasters');
    const cantidadMastersInput = document.getElementById('cantidadMasters');
    const claveInput = document.getElementById('clave');
    const clearFormBtn = document.getElementById('clearForm');
    const detailsModal = document.getElementById('detailsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalContent = document.getElementById('modalContent');

    // --- ESTADO Y DATOS ---
    let currentUser = null;
    let pendientesList = [];
    let serviciosAgregados = [];

    // --- LISTAS DE DATOS ---
    const papelOptions = ['BOND', 'OPALINA PAPEL', 'OPALINA CARTULINA', 'NACARADO', 'ALBANENE', 'ADHERIBLE', 'OTROS'];
    const rolloOptions = ['ROLLO BOND', 'ROLLO ADHERIBLE PAPEL', 'ROLLO ADHERIBLE VINIL', 'ROLLO FOTOGRÁFICO MATE', 'ROLLO FOTOGRÁFICO BRILLANTE'];
    
    // NUEVA LISTA: Opciones para el menú de audiograbaciones
    const comiteOptions = [
        'COMITÉ DE INER-GESTIÓN HOSPITALARIA', 'CONSEJO TÉCNICO', 'COMITÉ DE MORBIMORTALIDAD', 
        'JUNTA DE JEFES DE SERVICIO', 'DIRECCIÓN DE PLANEACIÓN ESTRATÉGICA', 'CODECIN', 
        'COCODI', 'COMERI', 'JUNTA DE GOBIERNO', 'TRANSPLANTE PULMONAR', 'ENTREVISTAS', 'OTROS'
    ];

    const areasList = [
        'Clínica Asma e Inmunoalergia', 'Clínica Enfermedad Pulmonar Obstructiva Crónica y Bronquiectasias y Tabaquismo ​',
        'Clínica Enfermedades Intersticiales del Pulmón ​', 'Clínica Fibrosis Quística ​', 'Clínica Implante Coclear',
        'Clínica Inmunocompromiso por Enfermedades Infecciosas ​', 'Clínica Intolerancia a la Aspirina, Poliposis y Asma (IAPA) ​',
        'Clínica Investigación Traslacional en Envejecimiento y Enfermedades Fibrosantes ​', 'Clínica Laringología, Fonocirugía y Cirugía de Cabeza y Cuello ​',
        'Clínica Pleura', 'Clínica Tuberculosis', 'Clínica Vasculitis Sistémicas Primarias', 'Coordinación Administración Clínica de Enfermería ​',
        'Coordinación Administración de Recursos Humanos de Enfermería', 'Coordinación Admisión Hospitalaria y Registros Médicos',
        'Coordinación Ambulancias', 'Coordinación Arte y Cultura', 'Coordinación Atención Médica Ambulatoria',
        'Coordinación Atención Médica de Hospitalización', 'Coordinación Camillería', 'Coordinación Cardiología y ecocardiografía ​',
        'Coordinación Centro de Simulación Clínica en Medicina Respiratoria', 'Coordinación Clínicas', 'Coordinación Desarrollo Tecnológico',
        'Coordinación Donación de Órganos y Tejidos', 'Coordinación Enseñanza de Enfermería ​', 'Coordinación Enseñanza y Capacitación',
        'Coordinación Epidemiología y Estadística', 'Coordinación Geriatría y Cuidados Paliativos', 'Coordinación Gestión de Tecnología Médica',
        'Coordinación Gestión del Cuidado y Calidad de Enfermería', 'Coordinación Hemodinamia', 'Coordinación Hipertensión Pulmonar',
        'Coordinación Infectología', 'Coordinación Ingeniería en Servicio', 'Coordinación Investigación de Enfermería ​',
        'Coordinación Investigación Educativa en Medicina Basada en Evidencia', 'Coordinación Medicina Interna', 'Coordinación Nefrología',
        'Coordinación Oncología Torácica', 'Coordinación Salud Mental', 'Coordinación Salud Ocupacional y Preventiva ​',
        'Coordinación Síndrome metabólico', 'Coordinación Supervisión de Trabajo Social', 'Coordinación Trasplante',
        'Coordinación Vigilancia Epidemiológica', 'Departamento Adquisiciones', 'Departamento Apoyo Técnico',
        'Departamento Apoyo Técnico en Administración', 'Departamento Apoyo Técnico en Enseñanza', 'Departamento Áreas Críticas',
        'Departamento Asuntos Jurídicos y Unidad de Transparencia', 'Departamento Biomedicina Molecular e Investigación Traslacional',
        'Departamento Calidad', 'Departamento Centro de Investigación en Enfermedades Infecciosas', 'Departamento Control de Bienes',
        'Departamento Coordinación Técnica', 'Departamento Educación Continua', 'Departamento Empleo y Capacitación',
        'Departamento Enfermería', 'Departamento Enlace Administrativo', 'Departamento Epidemiología Hospitalaria e Infectología',
        'Departamento Farmacia Hospitalaria', 'Departamento Fisiología Respiratoria', 'Departamento Formación de Posgrado',
        'Departamento Formación de Pregrado', 'Departamento Imagenología', 'Departamento Ingeniería Biomédica',
        'Departamento Investigación en Cirugía Experimental', 'Departamento Investigación en Enfermedades Crónico-Degenerativas',
        'Departamento Investigación en Fibrosis Pulmonar', 'Departamento Investigación en Hiperreactividad Bronquial',
        'Departamento Investigación en Inmunogenética y Alergia', 'Departamento Investigación en Microbiología ​',
        'Departamento Investigación en Tabaquismo y EPOC ​', 'Departamento Investigación en Toxicología y Medicina Ambiental',
        'Departamento Investigación en Virología y Micología', 'Departamento Laboratorio Clínico', 'Departamento Nutrición Clínica',
        'Departamento Otorrinolaringología y Cirugía de Cabeza y Cuello', 'Departamento Rehabilitación Pulmonar',
        'Departamento Relaciones Laborales', 'Departamento Relaciones Públicas y Comunicación', 'Departamento Remuneraciones',
        'Departamento Tecnologías de la Información y Comunicaciones', 'Departamento Trabajo Social', 'Departamento Unidad de Igualdad, Género e Inclusión',
        'Dirección Enseñanza', 'Dirección General', 'Dirección Investigación', 'Dirección Médica', 'Laboratorio Biología Celular',
        'Laboratorio Biología Computacional', 'Laboratorio Biología Molecular', 'Laboratorio Biología Molecular de Enfermedades Emergentes y EPOC',
        'Laboratorio Biopatología Pulmonar INER-Ciencias, UNAM', 'Laboratorio Cáncer Pulmonar', 'Laboratorio Farmacología Clínica y Experimental',
        'Laboratorio Inmunobiología de la Tuberculosis', 'Laboratorio Inmunobiología y Genética', 'Laboratorio Inmunofarmacología',
        'Laboratorio Inmunología Integrativa', 'Laboratorio Investigación en Enfermedades Reumáticas', 'Laboratorio Investigación en Epidemiología e Infectología ​',
        'Laboratorio LACBio', 'Laboratorio Morfología', 'Laboratorio Nacional Conahcyt de Investigación y Diagnóstico por Inmunocitofluorometría (LANCIDI) ​',
        'Laboratorio Neumogenómica', 'Laboratorio Onco-Inmunobiología', 'Laboratorio Secuenciación y Biología Molecular',
        'Laboratorio Transcriptómica e Inmunología Molecular', 'Laboratorio Transducción de Señales', 'Laboratorio Trasplante Pulmonar Experimental',
        'Oficina Apoyo Técnico de la Dirección Médica ​', 'Oficina Audiovisual', 'Oficina Biblioteca y Editorial', 'Oficina Bioterio',
        'Oficina Capacitación y Desarrollo', 'Oficina Coordinación de Protección Civil Institucional y Gestión Ambiental ​',
        'Oficina Escuela de Enfermería', 'Oficina Escuela Superior de Terapia Respiratoria', 'Oficina Movimientos de Personal',
        'Oficina Seguridad Radiológica', 'Programa Apoyo a Pacientes y Familiares (PAPyF) ​', 'Servicio Anatomía Patológica',
        'Servicio Anestesia y Clínica del Dolor', 'Servicio Banco de Sangre', 'Servicio Broncoscopía y Endoscopía', 'Servicio Cardiología',
        'Servicio Cirugía de Tórax', 'Servicio Cirugía Maxilo Facial y Estomatología', 'Servicio Clínico 1', 'Servicio Clínico 2',
        'Servicio Clínico 3', 'Servicio Clínico 4', 'Servicio Clínico 7', 'Servicio Clínico 8', 'Servicio Consulta Externa',
        'Servicio Cuidados Intensivos Respiratorios', 'Servicio Hospital de Día', 'Servicio Medicina del Sueño',
        'Servicio Medicina Nuclear e Imagen Molecular', 'Servicio Microbiología Clínica', 'Servicio Oncología Médica',
        'Servicio Terapia Intermedia', 'Servicio Terapia Postquirúrgica', 'Servicio Terapia Respiratoria', 'Servicio Urgencias Respiratorias',
        'Sindicato Sindicato', 'Subdirección Atención Médica de Neumología', 'Subdirección Cirugía', 'Subdirección Enseñanza',
        'Subdirección Investigación Biomédica', 'Subdirección Recursos Humanos y Organización', 'Subdirección Recursos Materiales',
        'Subdirección Servicios Auxiliares de Diagnóstico y Paramédicos', 'Transportes', 'Trasplante', 'Trasplante Pulmonar Experimental',
        'Tuberculosis', 'Unidad de Administración y Finanzas', 'Unidad de Igualdad, Género e Inclusión', 'Urgencias Respiratorias',
        'Vasculitis Sistémicas Primarias', 'Vigilancia Epidemiológica', 'OTRO'
    ];
    const serviciosList = [
        'ANIMACIÓN', 'APOYO ADMINISTRATIVO', 'APOYO AUDIOVISUAL', 'APOYO TÉCNICO INFORMÁTICO', 'APOYO TÉCNICO', 'AUDIOGRABACIÓN',
        'CD: GRABADO O EN BLANCO', 'CENTÍMETROS PLOTTER', 'DIBUJO E ILUSTRACIÓN', 'DISEÑO IMPRESIÓN MONTAJE Y CORTE', 'DISEÑO',
        'DVD: GRABADO O EN BLANCO', 'EDICIÓN DE FOTOGRAFÍA DIGITAL', 'ENGARGOLADOS', 'ESCANEOS', 'FOTOGRAFÍAS BANCO DE IMÁGEN',
        'FOTOGRAFÍAS COMPARTIDAS', 'HOJAS CARTA', 'HOJAS DE REUSO', 'HOJAS OFICIO', 'HOJAS PAPEL ESPECIAL', 'HOJAS TABLOIDE',
        'IMPRESIÓN PAPEL REUSO', 'IMPRESIONES CARTA', 'IMPRESIONES OFICIO', 'IMPRESIONES PAPEL ESPECIAL', 'IMPRESIONES TABLOIDE', 'IMPRESIONES SIN HOJAS',
        'PLACA DE BATERÍA', 'PLACA DE FOAMBOARD', 'PRESTAMO DE EQUIPO', 'PRODUCCIÓN AUDIOVISUAL', 'VIDEO BANCO DE IMÁGEN',
        'VIDEOS COMPARTIDOS', 'VIDEOS EDITADOS'
    ];

    // --- MANEJO DE SESIÓN Y LÓGICA DE LOGIN ---
    // (Esta sección no cambia)
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAdminPanel();
        loadPendientes();
        setupDynamicMenu()
    }
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

        // --- INICIO DE LA CORRECCIÓN ---
        // 1. Empaquetar los datos en un objeto, como siempre.
        const dataToSend = {
            action: 'login',
            username: username,
            password: password
        };

        // 2. Crear un objeto FormData y meter nuestro objeto de datos dentro,
        //    bajo la clave 'data', que es lo que el backend espera.
        const formData = new FormData();
        formData.append('data', JSON.stringify(dataToSend));
        // --- FIN DE LA CORRECCIÓN ---

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData // Ahora enviamos el FormData, no el texto crudo.
            });

            const result = await response.json();

            if (result.success) {
                currentUser = {
                    username: username,
                    name: result.name || username
                };
                localStorage.setItem('adminUser', JSON.stringify(currentUser));
                showAdminPanel();
                loadPendientes();
                setupDynamicMenu()
            } else {
                showLoginError(result.message || 'Credenciales incorrectas.');
            }
        } catch (error) {
            console.error('Error en login:', error);
            showLoginError('Error de conexión o en la respuesta del servidor. Revisa la consola.');
        } finally {
            setLoginLoading(false);
        }
    });
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminUser');
        currentUser = null;
        loginContainer.style.display = 'block';
        adminPanel.style.display = 'none';
        userInfo.classList.add('hidden');
        loginForm.reset();
    });

    // --- LÓGICA DEL PANEL DE ADMINISTRACIÓN ---
    // (Esta sección no cambia)
    refreshBtn.addEventListener('click', loadPendientes);
    async function loadPendientes() {
        showLoadingPendientes();
        
        try {
            // --- INICIO DE LA CORRECCIÓN ---
            // 1. Crear el objeto de datos que se enviará.
            const dataToSend = {
                action: 'getPendientesUsuario',
                nombre: currentUser.username
            };

            // 2. Empaquetarlo en FormData.
            const formData = new FormData();
            formData.append('data', JSON.stringify(dataToSend));
            // --- FIN DE LA CORRECCIÓN ---

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData // Ahora se envía el FormData.
            });

            const result = await response.json();

            if (result.result === 'success') {
                pendientesList = result.pendientes || [];
                displayPendientes(pendientesList);
                populateFolioCombo(pendientesList);
            } else {
                console.error('Error al cargar pendientes:', result.message);
                showNoPendientes('Error al cargar las solicitudes pendientes.');
            }
        } catch (error) {
            console.error('Error en loadPendientes:', error);
            showNoPendientes('Error de conexión al cargar las solicitudes.');
        }
    }
    function displayPendientes(pendientes) {
        loadingPendientes.classList.add('hidden');
        if (!pendientes || pendientes.length === 0) {
            showNoPendientes();
            return;
        }
        pendientesContainer.classList.remove('hidden');
        pendientesTableBody.innerHTML = '';
        pendientes.forEach(solicitud => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            const fecha = new Date(solicitud.fecha).toLocaleDateString('es-MX');
            const descripcionCorta = solicitud.descripcion?.substring(0, 100) + (solicitud.descripcion?.length > 100 ? '...' : '');
            row.innerHTML = `
            <td class="text-sm p-2">${solicitud.folio}</td>
            <td class="text-sm p-2">${new Date(solicitud.fecha).toLocaleDateString('es-MX')}</td>
            <td class="font-medium p-2">${solicitud.solicitante}</td>
            <td class="text-sm p-2">${solicitud.area || ''}</td>
            <td class="text-sm p-2" title="${solicitud.descripcion}">${solicitud.descripcion.substring(0,50)}...</td>
            <td class="text-sm p-2">
                <button data-folio="${solicitud.folio}" class="ver-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs">Ver</button>
            </td>
        `;
        pendientesTableBody.appendChild(row);
        });
    }

    function openModal() {
        detailsModal.classList.remove('hidden');
        detailsModal.classList.add('flex');
    }

    function closeModal() {
        detailsModal.classList.add('hidden');
        detailsModal.classList.remove('flex');
    }
    
    closeModalBtn.addEventListener('click', closeModal);
    // Cerrar si se hace clic fuera del contenido del modal
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            closeModal();
        }
    });

    pendientesTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('ver-btn')) {
            const folio = e.target.dataset.folio;
            openModal();
            modalContent.innerHTML = '<div class="text-center text-gray-500">Cargando...</div>';

            try {
                const formData = new FormData();
                formData.append('data', JSON.stringify({ action: 'getSolicitudDetails', folio: folio }));
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
                const result = await response.json();

                if (result.success) {
                    populateModal(result.data);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                modalContent.innerHTML = `<div class="text-center text-red-500">Error al cargar los detalles: ${error.message}</div>`;
            }
        }
    });

    function populateModal(data) {
        const fieldsToShow = ['Folio', 'Timestamp', 'Email', 'Nombre', 'Area', 'Telefono', 'Descripcion', 'Items', 'Archivos Adjuntos', 'COMENTARIOS'];
        let html = '<dl class="space-y-4">';
        fieldsToShow.forEach(field => {
            if (data[field]) {
                html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-500">${field}</dt>
                        <dd class="mt-1 text-md text-gray-900 whitespace-pre-wrap">${data[field]}</dd>
                    </div>
                `;
            }
        });
        html += '</dl>';
        modalContent.innerHTML = html;
    }

    function populateFolioCombo(pendientes) {
        const folioSelect = document.getElementById('folioSolicitud');
        folioSelect.innerHTML = '';
        const nuevaOpcion = document.createElement('option');
        nuevaOpcion.value = 'NUEVO';
        nuevaOpcion.textContent = '--- Crear Nueva Solicitud ---';
        folioSelect.appendChild(nuevaOpcion);
        pendientes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.folio;
            option.textContent = `${p.folio} - ${p.solicitante}`;
            option.dataset.pendiente = JSON.stringify(p);
            folioSelect.appendChild(option);
        });
    }
    document.getElementById('folioSolicitud').addEventListener('change', function() {
        const selectedValue = this.value;

        if (selectedValue === 'NUEVO') {
            // Si es una nueva solicitud, simplemente limpiar el formulario
            nuevaSolicitudForm.reset();
            document.getElementById('folioSolicitud').value = 'NUEVO'; // Mantener la selección
            serviciosAgregados = [];
            renderServicesCart();
            document.getElementById('fechaSolicitud').valueAsDate = new Date(); // Poner fecha actual por defecto

        } else {
            // Si es un folio existente, solo autocompletar los datos
            const selectedOption = this.options[this.selectedIndex];
            const pendiente = JSON.parse(selectedOption.dataset.pendiente);
            
            document.getElementById('fechaSolicitud').value = new Date(pendiente.fecha).toISOString().split('T')[0];
            document.getElementById('nombreSolicitante').value = pendiente.solicitante;
            document.getElementById('descripcionTrabajo').value = pendiente.descripcion;
            areaInput.value = pendiente.area || '';
            document.getElementById('emailSolicitante').value = pendiente.email || ''; 
            
            // Se eliminó la línea que ponía los campos en "readOnly = true"
        }
    });

    // --- LÓGICA DE COMBOBOX (genérica) ---
    // (Esta sección no cambia)
    function createDropdown(inputElement, dropdownElement, items, onSelect) {
        dropdownElement.innerHTML = '';
        if (items.length === 0) {
            dropdownElement.classList.add('hidden');
            return;
        }
        items.forEach(item => {
            const optionEl = document.createElement('div');
            optionEl.className = 'combobox-option';
            optionEl.textContent = item;
            optionEl.addEventListener('click', () => {
                inputElement.value = item;
                dropdownElement.classList.add('hidden');
                if (onSelect) onSelect(item);
            });
            dropdownElement.appendChild(optionEl);
        });
        dropdownElement.classList.remove('hidden');
    }
    areaInput.addEventListener('focus', () => createDropdown(areaInput, areaDropdown, areasList));
    areaInput.addEventListener('input', () => {
        const filtered = areasList.filter(a => a.toLowerCase().includes(areaInput.value.toLowerCase()));
        createDropdown(areaInput, areaDropdown, filtered);
    });

    // --- LÓGICA DEL CARRITO DE SERVICIOS ---
     serviciosBusqueda.addEventListener('focus', () => {
        const currentServiceList = duplicadorDigital.checked ? ['COPIAS'] : serviciosList;
        createDropdown(serviciosBusqueda, serviciosDropdown, currentServiceList, onServiceSelect);
    });
    serviciosBusqueda.addEventListener('input', () => {
        const searchTerm = serviciosBusqueda.value.toLowerCase();
        const currentServiceList = duplicadorDigital.checked ? ['COPIAS'] : serviciosList;
        const filtered = currentServiceList.filter(s => s.toLowerCase().includes(searchTerm));
        createDropdown(serviciosBusqueda, serviciosDropdown, filtered, onServiceSelect);
    });
    function onServiceSelect(serviceName) {
        addServiceToCart(serviceName);
        serviciosBusqueda.value = '';
    }

    // MODIFICADO: addServiceToCart para incluir lógica de 'comite'
      function addServiceToCart(serviceName) {
        if (duplicadorDigital.checked && serviceName.toUpperCase() !== 'COPIAS') {
            alert("Con 'Duplicador Digital' activado, solo puedes agregar servicios de 'COPIAS'.");
            return;
        }

        const serviceNameUpper = serviceName.toUpperCase();
        let newService = { name: serviceName, quantity: 1, specifications: '' };

        if (serviceNameUpper === 'IMPRESIONES SIN HOJAS') {
            newService.tamaño = 'CARTA'; // Se añade la propiedad de tamaño
        } 
        // El caso más general ('IMPRESION') va después.
        else if (serviceNameUpper.includes('IMPRESION') || serviceNameUpper.includes('HOJAS')) {
            newService.tipoPapel = 'BOND';
            if (serviceNameUpper.includes('IMPRESION')) {
                newService.numHojas = 1;
            }
        } 
        if (serviceNameUpper.includes('PLOTTER')) newService.tipoRollo = 'ROLLO BOND';
        if (serviceNameUpper === 'AUDIOGRABACIÓN') newService.comite = comiteOptions[0];
        if (serviceNameUpper === 'COPIAS') {
            newService.tamaño = 'CARTA';
            newService.ambasCaras = false;
            newService.numHojas = newService.quantity;
        }

        serviciosAgregados.push(newService);
        renderServicesCart();
    }

    // MODIFICADO: renderServicesCart para mostrar el select de comités
function renderServicesCart() {
        serviciosCart.innerHTML = '';
        
        const hasNonCopiasService = serviciosAgregados.some(s => s.name.toUpperCase() !== 'COPIAS');
        duplicadorDigital.disabled = hasNonCopiasService;

        if (duplicadorDigital.disabled && duplicadorDigital.checked) {
            duplicadorDigital.checked = false;
            duplicadorDigital.dispatchEvent(new Event('change'));
        }
        
        serviciosSeleccionadosContainer.style.display = serviciosAgregados.length > 0 ? 'block' : 'none';

        if (serviciosAgregados.length > 0) {
            serviciosAgregados.forEach((service, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item bg-gray-50 border rounded-lg mb-2 p-3 space-y-3';
                const mainRowHTML = `
                    <div class="flex items-center justify-between gap-4">
                        <span class="font-medium text-gray-800 flex-grow">${service.name}</span>
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-medium">${service.name.toUpperCase().includes('PLOTTER') ? 'Cm:' : 'Cant:'}</label>
                            <input type="number" min="1" value="${service.quantity}" class="w-20 p-1 border rounded text-center" data-index="${index}" data-field="quantity">
                        </div>
                        <button type="button" class="text-red-500 hover:text-red-700 font-bold text-xl p-1" data-index="${index}" data-action="delete" title="Eliminar servicio">&times;</button>
                    </div>`;

                let dynamicFieldsHTML = '';
                
                if (service.hasOwnProperty('tipoPapel')) {
                    const optionsHTML = papelOptions.map(opt => `<option value="${opt}" ${service.tipoPapel === opt ? 'selected' : ''}>${opt}</option>`).join('');
                    dynamicFieldsHTML += `<div class="flex items-center gap-2"><label class="text-sm font-medium w-28">Tipo de Papel:</label><select class="flex-grow p-1 border rounded" data-index="${index}" data-field="tipoPapel">${optionsHTML}</select></div>`;
                }
                if (service.hasOwnProperty('tipoRollo')) {
                    const optionsHTML = rolloOptions.map(opt => `<option value="${opt}" ${service.tipoRollo === opt ? 'selected' : ''}>${opt}</option>`).join('');
                    dynamicFieldsHTML += `<div class="flex items-center gap-2"><label class="text-sm font-medium w-28">Tipo de Rollo:</label><select class="flex-grow p-1 border rounded" data-index="${index}" data-field="tipoRollo">${optionsHTML}</select></div>`;
                }
                if (service.hasOwnProperty('numHojas') && service.name.toUpperCase() !== 'COPIAS') {
                    dynamicFieldsHTML += `<div class="flex items-center gap-2"><label class="text-sm font-medium w-28">Hojas Utilizadas:</label><div class="flex-grow"><input type="number" min="1" value="${service.numHojas}" class="w-24 p-1 border rounded text-center" data-index="${index}" data-field="numHojas"><div id="error-hojas-${index}" class="text-red-600 text-xs mt-1"></div></div></div>`;
                }
                if (service.hasOwnProperty('comite')) {
                    const optionsHTML = comiteOptions.map(opt => `<option value="${opt}" ${service.comite === opt ? 'selected' : ''}>${opt}</option>`).join('');
                    dynamicFieldsHTML += `<div class="flex items-center gap-2"><label class="text-sm font-medium w-28">Comité/Junta:</label><select class="flex-grow p-1 border rounded" data-index="${index}" data-field="comite">${optionsHTML}</select></div>`;
                }
                if (service.name.toUpperCase() === 'COPIAS') {
                    const tamañoOptions = ['CARTA', 'OFICIO', 'TABLOIDE'].map(opt => `<option value="${opt}" ${service.tamaño === opt ? 'selected' : ''}>${opt}</option>`).join('');
                    dynamicFieldsHTML += `
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-medium w-28">Tamaño:</label>
                            <select class="flex-grow p-1 border rounded" data-index="${index}" data-field="tamaño">${tamañoOptions}</select>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="ambasCaras-${index}" class="h-4 w-4 rounded" data-index="${index}" data-field="ambasCaras" ${service.ambasCaras ? 'checked' : ''}>
                            <label for="ambasCaras-${index}" class="text-sm font-medium">Ambas Caras</label>
                        </div>`;
                }
                if (service.name.toUpperCase() === 'IMPRESIONES SIN HOJAS') {
                    const tamañoOptions = ['CARTA', 'OFICIO', 'TABLOIDE']
                        .map(opt => `<option value="${opt}" ${service.tamaño === opt ? 'selected' : ''}>${opt}</option>`).join('');
                    
                    dynamicFieldsHTML += `
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-medium w-28">Tamaño:</label>
                            <select class="flex-grow p-1 border rounded" data-index="${index}" data-field="tamaño">${tamañoOptions}</select>
                        </div>
                    `;
                }
                
                const specificationsHTML = `<div><input type="text" placeholder="Especificaciones adicionales..." value="${service.specifications}" class="w-full p-1 border rounded text-sm" data-index="${index}" data-field="specifications"></div>`;
                itemEl.innerHTML = mainRowHTML + (dynamicFieldsHTML ? `<div class="pl-4 border-l-2 border-gray-200 space-y-2">${dynamicFieldsHTML}</div>` : '') + specificationsHTML;
                serviciosCart.appendChild(itemEl);
            });
        }
        validateAllCartItems();
    }

    serviciosCart.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('button[data-action="delete"]');
        if (deleteButton) {
            const index = deleteButton.dataset.index;
            serviciosAgregados.splice(index, 1);
            renderServicesCart(); // Re-renderizar el carrito para actualizar la vista
        }
    });

    // --- LÓGICA DE VALIDACIÓN Y EVENTOS ---
    // (Esta sección no cambia)
    function validateImpresionItem(service, index) {
        const quantityInput = document.querySelector(`input[data-index="${index}"][data-field="quantity"]`);
        const numHojasInput = document.querySelector(`input[data-index="${index}"][data-field="numHojas"]`);
        const errorContainer = document.getElementById(`error-hojas-${index}`);
        if (!errorContainer || !numHojasInput || !quantityInput) return true;
        const quantity = parseInt(service.quantity, 10);
        const numHojas = parseInt(service.numHojas, 10);
        let isValid = true;
        if (quantity < numHojas || quantity > (numHojas * 2)) {
            errorContainer.textContent = `Con ${numHojas} hoja(s), la Cantidad debe estar entre ${numHojas} y ${numHojas * 2}.`;
            quantityInput.classList.add('border-red-500', 'focus:border-red-500');
            numHojasInput.classList.add('border-red-500', 'focus:border-red-500');
            isValid = false;
        } else {
            errorContainer.textContent = '';
            quantityInput.classList.remove('border-red-500', 'focus:border-red-500');
            numHojasInput.classList.remove('border-red-500', 'focus:border-red-500');
        }
        return isValid;
    }
    function validateAllCartItems() {
        let allItemsAreValid = true;
        serviciosAgregados.forEach((service, index) => {
            if (service.name.toUpperCase().includes('IMPRESION')) {
                if (!validateImpresionItem(service, index)) {
                    allItemsAreValid = false;
                }
            }
        });
        return allItemsAreValid;
    }
    serviciosCart.addEventListener('change', (e) => {
        if (e.target.matches('input, select')) {
            
            const index = e.target.dataset.index;
            const field = e.target.dataset.field;
            if (index === undefined || field === undefined) return;

            const service = serviciosAgregados[index];
            const value = e.target.type === 'checkbox' ? e.target.checked : (e.target.type === 'number' ? parseInt(e.target.value) || 1 : e.target.value);
            service[field] = value;

            // --- NUEVA LÓGICA DE CÁLCULO ---
            if (service.name.toUpperCase() === 'COPIAS' && (field === 'quantity' || field === 'ambasCaras')) {
                if (service.ambasCaras) {
                    service.numHojas = Math.ceil(service.quantity / 2);
                } else {
                    service.numHojas = service.quantity;
                }
            }
            // --- FIN DE NUEVA LÓGICA ---

            if (service.name.toUpperCase().includes('IMPRESION') && (field === 'quantity' || field === 'numHojas')) {
                validateImpresionItem(service, index);
            }
        }
    });


    serviciosCart.addEventListener('change', (e) => {
        if (!e.target.matches('input, select')) return;
        const index = e.target.dataset.index;
        const field = e.target.dataset.field;
        if (index === undefined || field === undefined) return;
        
        const service = serviciosAgregados[index];
        service[field] = e.target.type === 'checkbox' ? e.target.checked : (e.target.type === 'number' ? parseInt(e.target.value) || 1 : e.target.value);

        if (service.name.toUpperCase() === 'COPIAS' && (field === 'quantity' || field === 'ambasCaras')) {
            service.numHojas = service.ambasCaras ? Math.ceil(service.quantity / 2) : service.quantity;
        }
        if (service.name.toUpperCase().includes('IMPRESION')) {
            validateImpresionItem(service, index);
        }
    });

    nuevaSolicitudForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (serviciosAgregados.length === 0) {
            alert('🛑 Debe agregar al menos un servicio para poder registrar la solicitud.');
            return; // Detiene la ejecución y evita el envío del formulario.
        }

        if (!validateAllCartItems()) {
            alert('Por favor, corrija los errores en el carrito de servicios antes de continuar.');
            return;
        }

        const submitButton = e.submitter || nuevaSolicitudForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        // --- INICIO DE LA CORRECCIÓN: Recolección manual de datos ---
        // Construimos el objeto de datos manualmente para asegurar su estructura.
        const dataToSend = {
            folio: document.getElementById('folioSolicitud').value,
            fechaSolicitud: document.getElementById('fechaSolicitud').value,
            fechaEntrega: document.getElementById('fechaEntrega').value,
            nombreSolicitante: document.getElementById('nombreSolicitante').value,
            email: document.getElementById('emailSolicitante').value,
            area: document.getElementById('area').value,
            vale: document.getElementById('vale').value,
            elaboro: document.getElementById('elaboro').value,
            tipoTrabajo: document.getElementById('tipoTrabajo').value,
            clave: document.getElementById('clave').value,
            duplicadorDigital: document.getElementById('duplicadorDigital').checked, // Usamos .checked para booleano
            cantidadMasters: document.getElementById('cantidadMasters').value,
            descripcion: document.getElementById('descripcionTrabajo').value,
            servicios: serviciosAgregados, // Añadimos el carrito de servicios
            asignadoPor: currentUser.name,
            action: "crearSolicitudAdmin"
        };
        // --- FIN DE LA CORRECCIÓN ---
        
        console.log("Datos listos para REGISTRAR (método manual):", dataToSend);

        const formDataForPost = new FormData();
        formDataForPost.append('data', JSON.stringify(dataToSend));

        fetch(SCRIPT_URL, {
            method: 'POST',
            body: formDataForPost
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(result.message + (result.folio ? ` Folio procesado: ${result.folio}` : ''));
                nuevaSolicitudForm.reset();
                serviciosAgregados = [];
                renderServicesCart();
                
                // Ocultar y resetear manualmente los campos del duplicador
                numeroMastersContainer.classList.add('hidden');
                cantidadMastersInput.required = false;
                claveInput.required = false;
                
                loadPendientes();  
            } else {
                throw new Error(result.message || 'Error desconocido del servidor.');
            }
        })
        .catch(error => {
            console.error('Error en el envío:', error);
            alert('Hubo un error al registrar la solicitud: ' + error.message);
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Registrar Solicitud';
        });
    });

    if (duplicadorDigital) {
      duplicadorDigital.addEventListener('change', function() {
        const isChecked = this.checked;

        numeroMastersContainer.classList.toggle('hidden', !isChecked);
        cantidadMastersInput.required = isChecked;
        claveInput.required = isChecked;

        if (isChecked) {
          if (serviciosAgregados.some(s => s.name.toUpperCase() !== 'COPIAS')) {
            alert("Para usar 'Duplicador Digital', primero elimina del carrito los servicios que no sean 'COPIAS'.");
            this.checked = false;
            numeroMastersContainer.classList.add('hidden');
            cantidadMastersInput.required = false;
            claveInput.required = false;
            return;
          }
        } else {
          cantidadMastersInput.value = '';
        }
        
        // Actualizar la búsqueda de servicios
        serviciosBusqueda.value = '';
        const currentServiceList = isChecked ? ['COPIAS'] : serviciosList;
        createDropdown(serviciosBusqueda, serviciosDropdown, currentServiceList, onServiceSelect);
      });
    }




    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', function() {
            nuevaSolicitudForm.reset(); // Limpia los valores de los campos
            
            // Forzamos el estado visual correcto después de limpiar
            duplicadorDigital.checked = false;
            numeroMastersContainer.classList.add('hidden');
            cantidadMastersInput.required = false;
            cantidadMastersInput.value = '';
            claveInput.required = false;

            // También limpiar el carrito de servicios
            serviciosAgregados = [];
            renderServicesCart();
        });
    }

    // --- FUNCIONES AUXILIARES DE UI Y EVENTOS GLOBALES ---
    // (Esta sección no cambia)
    function showLoginError(message) { loginError.textContent = message; loginError.classList.remove('hidden'); }
    function hideLoginError() { loginError.classList.add('hidden'); }
    function setLoginLoading(loading) { loginBtn.disabled = loading; loginBtnText.textContent = loading ? 'Iniciando...' : 'Iniciar Sesión'; loginSpinner.classList.toggle('hidden', !loading); }
    function showAdminPanel() { loginContainer.style.display = 'none'; adminPanel.style.display = 'block'; userInfo.classList.remove('hidden'); welcomeUser.textContent = `Bienvenido, ${currentUser.name}`; }
    function showNoPendientes(message = "No hay solicitudes pendientes por asignar.") { loadingPendientes.classList.add('hidden'); pendientesContainer.classList.add('hidden'); noPendientes.classList.remove('hidden'); noPendientes.querySelector('p:last-child').textContent = message; }
    document.addEventListener('click', (e) => { if (!e.target.closest('.combobox-container')) { areaDropdown.classList.add('hidden'); serviciosDropdown.classList.add('hidden'); } });
     
    function showLoadingPendientes() {
        loadingPendientes.classList.remove('hidden');
        pendientesContainer.classList.add('hidden');
        noPendientes.classList.add('hidden');
    }

    function showNoPendientes(message = "No hay solicitudes pendientes por asignar.") {
        loadingPendientes.classList.add('hidden');
        pendientesContainer.classList.add('hidden');
        noPendientes.classList.remove('hidden');
        noPendientes.querySelector('p:last-child').textContent = message;
    }


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