document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Elementos del DOM ---
    // ❌ ELIMINADA: const startRequestBtn = document.getElementById('startRequestBtn');
    // ❌ ELIMINADA: const initialButtonContainer = document.getElementById('initialButtonContainer');
    const workRequestForm = document.getElementById('workRequestForm'); // ID del formulario
    const form = workRequestForm; // Alias para compatibilidad con lógica de envío

    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statusMessage = document.getElementById('statusMessage');

    // Campos condicionales
    const modalidadSelect = document.getElementById('modalidad');
    const recurrenciaSelect = document.getElementById('recurrencia');
    const zoomContainer = document.getElementById('zoomContainer');
    const recurrenciaContainer = document.getElementById('recurrenciaContainer');

    // --- 2. Listas de Opciones y Datos para Comboboxes ---

    // Lista de todas las áreas/departamentos
    const areas = [
        'Clínica Asma e Inmunoalergia',
        'Clínica Enfermedad Pulmonar Obstructiva Crónica y Bronquiectasias y Tabaquismo ​',
        'Clínica Enfermedades Intersticiales del Pulmón ​',
        'Clínica Fibrosis Quística ​',
        'Clínica Implante Coclear',
        'Clínica Inmunocompromiso por Enfermedades Infecciosas ​',
        'Clínica Intolerancia a la Aspirina, Poliposis y Asma (IAPA) ​',
        'Clínica Investigación Traslacional en Envejecimiento y Enfermedades Fibrosantes ​',
        'Clínica Laringología, Fonocirugía y Cirugía de Cabeza y Cuello ​',
        'Clínica Pleura',
        'Clínica Tuberculosis',
        'Clínica Vasculitis Sistémicas Primarias',
        'Coordinación Administración Clínica de Enfermería ​',
        'Coordinación Administración de Recursos Humanos de Enfermería',
        'Coordinación Admisión Hospitalaria y Registros Médicos',
        'Coordinación Ambulancias',
        'Coordinación Arte y Cultura',
        'Coordinación Atención Médica Ambulatoria',
        'Coordinación Atención Médica de Hospitalización',
        'Coordinación Camillería',
        'Coordinación Cardiología y ecocardiografía ​',
        'Coordinación Centro de Simulación Clínica en Medicina Respiratoria',
        'Coordinación Clínicas',
        'Coordinación Desarrollo Tecnológico',
        'Coordinación Donación de Órganos y Tejidos',
        'Coordinación Enseñanza de Enfermería ​',
        'Coordinación Enseñanza y Capacitación',
        'Coordinación Epidemiología y Estadística',
        'Coordinación Geriatría y Cuidados Paliativos',
        'Coordinación Gestión de Tecnología Médica',
        'Coordinación Gestión del Cuidado y Calidad de Enfermería',
        'Coordinación Hemodinamia',
        'Coordinación Hipertensión Pulmonar',
        'Coordinación Infectología',
        'Coordinación Ingeniería en Servicio',
        'Coordinación Investigación de Enfermería ​',
        'Coordinación Investigación Educativa en Medicina Basada en Evidencia',
        'Coordinación Medicina Interna',
        'Coordinación Nefrología',
        'Coordinación Oncología Torácica',
        'Coordinación Salud Mental',
        'Coordinación Salud Ocupacional y Preventiva ​',
        'Coordinación Síndrome metabólico',
        'Coordinación Supervisión de Trabajo Social',
        'Coordinación Trasplante',
        'Coordinación Vigilancia Epidemiológica',
        'Departamento Adquisiciones',
        'Departamento Apoyo Técnico',
        'Departamento Apoyo Técnico en Administración',
        'Departamento Apoyo Técnico en Enseñanza',
        'Departamento Áreas Críticas',
        'Departamento Asuntos Jurídicos y Unidad de Transparencia',
        'Departamento Biomedicina Molecular e Investigación Traslacional',
        'Departamento Calidad',
        'Departamento Centro de Investigación en Enfermedades Infecciosas',
        'Departamento Control de Bienes',
        'Departamento Coordinación Técnica',
        'Departamento Educación Continua',
        'Departamento Empleo y Capacitación',
        'Departamento Enfermería',
        'Departamento Enlace Administrativo',
        'Departamento Epidemiología Hospitalaria e Infectología',
        'Departamento Farmacia Hospitalaria',
        'Departamento Fisiología Respiratoria',
        'Departamento Formación de Posgrado',
        'Departamento Formación de Pregrado',
        'Departamento Imagenología',
        'Departamento Ingeniería Biomédica',
        'Departamento Investigación en Cirugía Experimental',
        'Departamento Investigación en Enfermedades Crónico-Degenerativas',
        'Departamento Investigación en Fibrosis Pulmonar',
        'Departamento Investigación en Hiperreactividad Bronquial',
        'Departamento Investigación en Inmunogenética y Alergia',
        'Departamento Investigación en Microbiología ​',
        'Departamento Investigación en Tabaquismo y EPOC ​',
        'Departamento Investigación en Toxicología y Medicina Ambiental',
        'Departamento Investigación en Virología y Micología',
        'Departamento Laboratorio Clínico',
        'Departamento Nutrición Clínica',
        'Departamento Otorrinolaringología y Cirugía de Cabeza y Cuello',
        'Departamento Rehabilitación Pulmonar',
        'Departamento Relaciones Laborales',
        'Departamento Relaciones Públicas y Comunicación',
        'Departamento Remuneraciones',
        'Departamento Tecnologías de la Información y Comunicaciones',
        'Departamento Trabajo Social',
        'Departamento Unidad de Igualdad, Género e Inclusión',
        'Dirección Enseñanza',
        'Dirección General',
        'Dirección Investigación',
        'Dirección Médica',
        'Laboratorio Biología Celular',
        'Laboratorio Biología Computacional',
        'Laboratorio Biología Molecular',
        'Laboratorio Biología Molecular de Enfermedades Emergentes y EPOC',
        'Laboratorio Biopatología Pulmonar INER-Ciencias, UNAM',
        'Laboratorio Cáncer Pulmonar',
        'Laboratorio Farmacología Clínica y Experimental',
        'Laboratorio Inmunobiología de la Tuberculosis',
        'Laboratorio Inmunobiología y Genética',
        'Laboratorio Inmunofarmacología',
        'Laboratorio Inmunología Integrativa',
        'Laboratorio Investigación en Enfermedades Reumáticas',
        'Laboratorio Investigación en Epidemiología e Infectología ​',
        'Laboratorio LACBio',
        'Laboratorio Morfología',
        'Laboratorio Nacional Conahcyt de Investigación y Diagnóstico por Inmunocitofluorometría (LANCIDI) ​',
        'Laboratorio Neumogenómica',
        'Laboratorio Onco-Inmunobiología',
        'Laboratorio Secuenciación y Biología Molecular',
        'Laboratorio Transcriptómica e Inmunología Molecular',
        'Laboratorio Transducción de Señales',
        'Laboratorio Trasplante Pulmonar Experimental',
        'Oficina Apoyo Técnico de la Dirección Médica ​',
        'Oficina Audiovisual',
        'Oficina Biblioteca y Editorial',
        'Oficina Bioterio',
        'Oficina Capacitación y Desarrollo',
        'Oficina Coordinación de Protección Civil Institucional y Gestión Ambiental ​',
        'Oficina Escuela de Enfermería',
        'Oficina Escuela Superior de Terapia Respiratoria',
        'Oficina Movimientos de Personal',
        'Oficina Seguridad Radiológica',
        'Programa Apoyo a Pacientes y Familiares (PAPyF) ​',
        'Servicio Anatomía Patológica',
        'Servicio Anestesia y Clínica del Dolor',
        'Servicio Banco de Sangre',
        'Servicio Broncoscopía y Endoscopía',
        'Servicio Cardiología',
        'Servicio Cirugía de Tórax',
        'Servicio Cirugía Maxilo Facial y Estomatología',
        'Servicio Clínico 1',
        'Servicio Clínico 2',
        'Servicio Clínico 3',
        'Servicio Clínico 4',
        'Servicio Clínico 7',
        'Servicio Clínico 8',
        'Servicio Consulta Externa',
        'Servicio Cuidados Intensivos Respiratorios',
        'Servicio Hospital de Día',
        'Servicio Medicina del Sueño',
        'Servicio Medicina Nuclear e Imagen Molecular',
        'Servicio Microbiología Clínica',
        'Servicio Oncología Médica',
        'Servicio Terapia Intermedia',
        'Servicio Terapia Postquirúrgica',
        'Servicio Terapia Respiratoria',
        'Servicio Urgencias Respiratorias',
        'Sindicato Sindicato',
        'Subdirección Atención Médica de Neumología',
        'Subdirección Cirugía',
        'Subdirección Enseñanza',
        'Subdirección Investigación Biomédica',
        'Subdirección Recursos Humanos y Organización',
        'Subdirección Recursos Materiales',
        'Subdirección Servicios Auxiliares de Diagnóstico y Paramédicos',
        'Transportes',
        'Trasplante',
        'Trasplante Pulmonar Experimental',
        'Tuberculosis',
        'Unidad de Administración y Finanzas',
        'Unidad de Igualdad, Género e Inclusión',
        'Urgencias Respiratorias',
        'Vasculitis Sistémicas Primarias',
        'Vigilancia Epidemiológica',
        'OTRO'
    ];

    const tiposEvento = [
        'Congreso',
        'Curso',
        'Taller',
        'Sesión Clínica',
        'Reunión Administrativa',
        'Webinar',
        'Conferencia',
        'Otro'
    ];

    const tiposActividad = [
        'Presentación Oral',
        'Mesa Redonda',
        'Demostración Práctica',
        'Exposición de Carteles (Posters)',
        'Evaluación/Examen',
        'Sesión de Preguntas y Respuestas (Q&A)',
        'Otro'
    ];

    // --- 3. Lógica General para Comboboxes (Reutilizada de la optimización anterior) ---

    function setupCombobox(inputId, dropdownId, sourceArray) {
        const inputElement = document.getElementById(inputId);
        const dropdownElement = document.getElementById(dropdownId);
        let currentHighlightedIndex = -1;
        let filteredSource = [];

        function filterItems(searchTerm) {
            if (!searchTerm) return sourceArray;
            return sourceArray.filter(item =>
                item.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        function showDropdown(itemsToShow) {
            filteredSource = itemsToShow;
            dropdownElement.innerHTML = '';

            if (filteredSource.length === 0) {
                const noResultsOption = document.createElement('div');
                noResultsOption.className = 'combobox-option';
                noResultsOption.textContent = 'No se encontraron resultados';
                noResultsOption.style.color = '#6b7280';
                dropdownElement.appendChild(noResultsOption);
            } else {
                filteredSource.forEach((item, index) => {
                    const option = document.createElement('div');
                    option.className = 'combobox-option';
                    option.textContent = item;
                    option.addEventListener('click', () => selectItem(item));
                    dropdownElement.appendChild(option);
                });
            }

            dropdownElement.classList.remove('hidden');
            currentHighlightedIndex = -1;
        }

        function hideDropdown() {
            dropdownElement.classList.add('hidden');
            currentHighlightedIndex = -1;
        }

        function selectItem(item) {
            inputElement.value = item;
            hideDropdown();
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function highlightOption(index) {
            const options = dropdownElement.querySelectorAll('.combobox-option');
            options.forEach(option => option.classList.remove('highlighted'));

            if (index >= 0 && index < options.length) {
                options[index].classList.add('highlighted');
                currentHighlightedIndex = index;
            }
        }

        // Event listeners
        inputElement.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            const filtered = filterItems(searchTerm);
            showDropdown(filtered);
        });

        inputElement.addEventListener('focus', () => {
            const searchTerm = inputElement.value;
            const filtered = filterItems(searchTerm);
            showDropdown(filtered);
        });

        inputElement.addEventListener('keydown', (e) => {
            const options = dropdownElement.querySelectorAll('.combobox-option');

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentHighlightedIndex < options.length - 1) {
                        highlightOption(currentHighlightedIndex + 1);
                        options[currentHighlightedIndex + 1].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentHighlightedIndex > 0) {
                        highlightOption(currentHighlightedIndex - 1);
                        options[currentHighlightedIndex - 1].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (currentHighlightedIndex >= 0 && filteredSource[currentHighlightedIndex]) {
                        selectItem(filteredSource[currentHighlightedIndex]);
                    }
                    break;
                case 'Escape':
                    hideDropdown();
                    break;
            }
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
                hideDropdown();
            }
        });
    }

    // Inicializar los comboboxes
    setupCombobox('area', 'areaDropdown', areas);
    setupCombobox('tipoEvento', 'tipoEventoDropdown', tiposEvento);
    setupCombobox('tipoActividad', 'tipoActividadDropdown', tiposActividad);

    // --- 4. Mostrar el formulario (Lógica de bienvenida eliminada) ---
    // ❌ ELIMINADA: La lógica de startRequestBtn

    // --- 5. Lógica para campos condicionales (Se mantiene) ---
    // A. Lógica "OTRO" para Comboboxes (Tipo Evento y Actividad)
    function handleOtherInput(inputId, dropdownId, containerId, otherInputId) {
        const input = document.getElementById(inputId);
        const container = document.getElementById(containerId);
        const otherInput = document.getElementById(otherInputId);

        // Observer para detectar cambios en el valor del input principal
        // Como usamos un combobox personalizado, el evento 'change' se dispara manualmente
        input.addEventListener('change', () => {
            const val = input.value.trim().toUpperCase();
            if (val === 'OTRO' || val === 'OTROS') {
                container.classList.remove('hidden');
                otherInput.setAttribute('required', 'required');
                otherInput.focus(); // Foco automático para mejorar UX
            } else {
                container.classList.add('hidden');
                otherInput.removeAttribute('required');
                otherInput.value = ''; // Limpiar si se oculta
            }
        });
    }

    // Inicializar listeners para "Otro"
    handleOtherInput('tipoEvento', 'tipoEventoDropdown', 'otroTipoEventoContainer', 'otroTipoEvento');
    handleOtherInput('tipoActividad', 'tipoActividadDropdown', 'otroTipoActividadContainer', 'otroTipoActividad');


   

    // C. Lógica de Recurrencia (Selector de Días)
    const diasSemanaContainer = document.getElementById('diasSemanaContainer');

    recurrenciaSelect.addEventListener('change', () => {
        if (recurrenciaSelect.value === 'personalizada') {
            // Mostrar selector de días
            diasSemanaContainer.classList.remove('hidden');
            diasSemanaContainer.classList.add('fade-in'); // Animación opcional

            // Hacer que al menos un día sea obligatorio seleccionar
            // (Esto se valida mejor al enviar, pero visualmente ayuda)
        } else {
            // Ocultar y limpiar
            diasSemanaContainer.classList.add('hidden');

            // Desmarcar todos los días si se oculta
            const checkboxes = diasSemanaContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
        }
    });


    // D. Lógica de Requerimientos "OTRO"
    const reqOtroCheckbox = document.getElementById('req_otro');
    const reqOtroTexto = document.getElementById('req_otro_texto');

    if (reqOtroCheckbox) {
        reqOtroCheckbox.addEventListener('change', () => {
            if (reqOtroCheckbox.checked) {
                reqOtroTexto.classList.remove('hidden');
                reqOtroTexto.setAttribute('required', 'required');
                reqOtroTexto.focus();
            } else {
                reqOtroTexto.classList.add('hidden');
                reqOtroTexto.removeAttribute('required');
                reqOtroTexto.value = '';
            }
        });
    }


    // Inicializar estados al cargar
    modalidadSelect.dispatchEvent(new Event('change'));
    recurrenciaSelect.dispatchEvent(new Event('change'));

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validación extra: Si es recurrente, verificar que al menos 1 día esté seleccionado
        if (recurrenciaSelect.value === 'personalizada') {
            const diasSeleccionados = document.querySelectorAll('input[name="dias[]"]:checked');
            if (diasSeleccionados.length === 0) {
                alert('Por favor, selecciona al menos un día de la semana para la repetición.');
                return; // Detener envío
            }
        }

        submitBtn.disabled = true;
        loadingSpinner.classList.remove('hidden');
        statusMessage.textContent = 'Enviando...';
        statusMessage.className = 'text-sm font-medium text-blue-600';

        const formData = new FormData(form);
        
        // Convertimos FormData a objeto, pero manejando los Arrays (Días y Requerimientos) manualmente
        const data = {};
        formData.forEach((value, key) => {
            // Si la llave termina en [], es un array
            if (key.endsWith('[]')) {
                const cleanKey = key.slice(0, -2); // quitar []
                if (!data[cleanKey]) {
                    data[cleanKey] = [];
                }
                data[cleanKey].push(value);
            } else {
                data[key] = value;
            }
        });
        
        // Procesar campos "OTRO" para que se guarden en el campo principal si aplica
        if (data.tipoEvento === 'OTRO' && data.otroTipoEvento) {
            data.tipoEvento = 'OTRO: ' + data.otroTipoEvento;
        }
        if (data.tipoActividad === 'OTRO' && data.otroTipoActividad) {
            data.tipoActividad = 'OTRO: ' + data.otroTipoActividad;
        }

        // Unir arrays para enviarlos como string (opcional, o enviarlos como array al backend)
        // Para simplificar la hoja de cálculo, los uniremos con comas aquí:
        if (data.dias && Array.isArray(data.dias)) data.dias = data.dias.join(', ');
        if (data.requerimientos && Array.isArray(data.requerimientos)) {
             // Si hay "Otro" y texto especificado, agregarlo al string de requerimientos
             if (data.requerimientos.includes('Otro') && data.otroRequerimientoTexto) {
                 // Removemos "Otro" literal y ponemos el texto
                 data.requerimientos = data.requerimientos.filter(r => r !== 'Otro');
                 data.requerimientos.push('Otro: ' + data.otroRequerimientoTexto);
             }
             data.requerimientos = data.requerimientos.join(', ');
        }

        data.timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
        data.action = "solicitudEvento"; 

        sendDataToGoogle(data);
    });

    function sendDataToGoogle(data) {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

        console.log('Sending data:', data);

        const formData = new FormData();
        formData.append('data', JSON.stringify(data));

        fetch(scriptURL, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error('Failed to parse JSON:', text);
                        throw new Error('Respuesta no válida del servidor.');
                    }
                });
            })
            .then(res => {
                if (res.result === 'success') {
                    var folio = res.folio || 'N/A';
                    statusMessage.textContent = '¡Solicitud enviada con éxito! Tu folio es: ' + folio;
                    statusMessage.className = 'text-green-600';
                    form.reset();

                    // Reiniciar los estados condicionales y de combobox
                    zoomContainer.style.display = 'none';
                    recurrenciaContainer.style.display = 'none';

                } else {
                    throw new Error(res.error || 'Error desconocido del servidor.');
                }
            })
            .catch(error => {
                console.error('Error!', error.message);
                statusMessage.textContent = 'Error al enviar. Intente de nuevo.';
                statusMessage.className = 'text-red-600';
            })
            .finally(() => {
                submitBtn.disabled = false;
                loadingSpinner.classList.add('hidden');
                setTimeout(() => { statusMessage.textContent = ''; }, 6000);
            });
    }

    // --- 7. Lógica del Tour (Shepherd.js) ---

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-arrows',
            scrollTo: true
        }
    });

    // ❌ ELIMINADO: El paso de bienvenida 'step-welcome'

    // Paso 1: Correo Electrónico
    tour.addStep({
        id: 'step-email',
        text: '¡Bienvenido! El correo electrónico es el primer paso y es obligatorio para que podamos contactarte.',
        attachTo: { element: '#email', on: 'bottom' },
        buttons: [{ text: 'Siguiente', action: tour.next }] // Primer paso, no necesita 'Atrás'
    });

    // Los siguientes pasos se mantienen, pero se ajustó el primer paso del tour.

    tour.addStep({
        id: 'step-nombre',
        text: 'Escribe tu nombre completo.',
        attachTo: { element: '#requesterName', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    tour.addStep({
        id: 'step-area',
        text: 'Selecciona el área o departamento al que pertenece la solicitud. Usa la búsqueda dinámica.',
        attachTo: { element: '#area', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    tour.addStep({
        id: 'step-tel',
        text: 'Proporciona un número de teléfono o extensión de contacto.',
        attachTo: { element: '#phone', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    // Detalles del Evento
    tour.addStep({
        id: 'step-nombreActividad',
        text: 'Escribe el nombre completo de la actividad académica que se registrará.',
        attachTo: { element: '#nombreActividad', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    tour.addStep({
        id: 'step-tipoEvento',
        text: 'Especifica si es un Congreso, Curso, Sesión Clínica, etc. Usa el combobox.',
        attachTo: { element: '#tipoEvento', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    tour.addStep({
        id: 'step-tipoActividad',
        text: 'Indica el tipo de actividad, como Presentación Oral o Mesa Redonda.',
        attachTo: { element: '#tipoActividad', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    // Requisitos de Fecha y Espacio
    tour.addStep({
        id: 'step-fechas',
        text: 'Define la fecha y hora de inicio y finalización del evento.',
        attachTo: { element: '#fechaInicio', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    tour.addStep({
        id: 'step-aforo',
        text: 'Indica el número estimado de asistentes (aforo).',
        attachTo: { element: '#aforoRequerido', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    tour.addStep({
        id: 'step-recurrencia',
        text: 'Si el evento se repite (diario, semanal, mensual), elige la opción y se te pedirá la fecha de finalización.',
        attachTo: { element: '#recurrencia', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    tour.addStep({
        id: 'step-modalidad',
        text: 'Selecciona la modalidad (Presencial, Virtual o Híbrido). Si eliges Virtual o Híbrido, aparecerá la opción de crear una reunión de Zoom.',
        attachTo: { element: '#modalidad', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    // Comentarios
    tour.addStep({
        id: 'step-comentarios',
        text: 'Utiliza este campo para cualquier información adicional o equipamiento especial que requieras.',
        attachTo: { element: '#comentarios', on: 'bottom' },
        buttons: [{ text: 'Atrás', action: tour.back }, { text: 'Siguiente', action: tour.next }]
    });

    // Final
    tour.addStep({
        id: 'step-finish',
        text: 'Revisa toda la información y presiona **Enviar Solicitud**. El mensaje de estado aparecerá aquí.',
        attachTo: { element: '#statusMessage', on: 'bottom' },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Finalizar', action: tour.complete }
        ]
    });


    // Inicia el tutorial solo si no se ha visto antes
    if (!localStorage.getItem('tutorialSolicitudVisto')) {
        tour.start();
        localStorage.setItem('tutorialSolicitudVisto', 'true');
    }
});