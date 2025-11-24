document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const startRequestBtn = document.getElementById('startRequestBtn');
    const initialButtonContainer = document.getElementById('initialButtonContainer');
    const workRequestForm = document.getElementById('workRequestForm');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemsTableBody = document.getElementById('itemsTableBody');
    const noItemsRow = document.getElementById('noItemsRow');
    const form = document.getElementById('workRequestForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statusMessage = document.getElementById('statusMessage');
    const productSelect = document.getElementById('product');
    const fileUpload = document.getElementById('fileUpload');
    const fileList = document.getElementById('fileList');
    const fileError = document.getElementById('fileError');

    let stagedFiles = [];
    const MAX_FILES = 10;
    const MAX_SIZE_MB = 20;

    // Contenedores de campos condicionales
    const digitalPrintContainer = document.getElementById('digitalPrintContainer');
    const plotterContainer = document.getElementById('plotterContainer');
    const engarContainer = document.getElementById('engarContainer');
    const orientacionContainer = document.getElementById('orientacionContainer');
    const cartelCongresoContainer = document.getElementById('cartelCongresoContainer'); // <-- NUEVO
    const matriculaInput = document.getElementById('matricula');

    // --- NUEVO: Elementos para validación de plotter ---
    const plotterWidthInput = document.getElementById('plotterWidth');
    const plotterLengthInput = document.getElementById('plotterLength');
    const plotterWidthError = document.getElementById('plotterWidthError');
    const plotterLengthError = document.getElementById('plotterLengthError');

    // --- NUEVO: Elementos para el combobox de área ---
    const areaInput = document.getElementById('area');
    const areaDropdown = document.getElementById('areaDropdown');

    // Opciones que activan campos condicionales
    const digitalPrintOption = "IMPRESIÓN DIGITAL";
    const plotterOption = "IMPRESIÓN EN PLOTTER";
    const engargoladosOption = "ENGARGOLADO";
    const cartelCongresoOption = "CARTEL CONGRESO";



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

    let currentHighlightedIndex = -1;
    let filteredAreas = [];

    // --- NUEVO: Funciones para el combobox de área ---
    function filterAreas(searchTerm) {
        if (!searchTerm) return areas;
        return areas.filter(area =>
            area.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    function showDropdown(areasToShow) {
        filteredAreas = areasToShow;
        areaDropdown.innerHTML = '';

        if (filteredAreas.length === 0) {
            const noResultsOption = document.createElement('div');
            noResultsOption.className = 'combobox-option';
            noResultsOption.textContent = 'No se encontraron resultados';
            noResultsOption.style.color = '#6b7280';
            areaDropdown.appendChild(noResultsOption);
        } else {
            filteredAreas.forEach((area, index) => {
                const option = document.createElement('div');
                option.className = 'combobox-option';
                option.textContent = area;
                option.addEventListener('click', () => selectArea(area));
                areaDropdown.appendChild(option);
            });
        }

        areaDropdown.classList.remove('hidden');
        currentHighlightedIndex = -1;
    }

    function hideDropdown() {
        areaDropdown.classList.add('hidden');
        currentHighlightedIndex = -1;
    }

    function selectArea(area) {
        areaInput.value = area;
        hideDropdown();
        areaInput.focus();
    }

    function highlightOption(index) {
        const options = areaDropdown.querySelectorAll('.combobox-option');
        options.forEach(option => option.classList.remove('highlighted'));

        if (index >= 0 && index < options.length) {
            options[index].classList.add('highlighted');
            currentHighlightedIndex = index;
        }
    }

    // Event listeners para el combobox de área
    areaInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        const filtered = filterAreas(searchTerm);
        showDropdown(filtered);
    });

    areaInput.addEventListener('focus', () => {
        const searchTerm = areaInput.value;
        const filtered = filterAreas(searchTerm);
        showDropdown(filtered);
    });

    areaInput.addEventListener('keydown', (e) => {
        const options = areaDropdown.querySelectorAll('.combobox-option');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentHighlightedIndex < options.length - 1) {
                    highlightOption(currentHighlightedIndex + 1);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentHighlightedIndex > 0) {
                    highlightOption(currentHighlightedIndex - 1);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (currentHighlightedIndex >= 0 && filteredAreas[currentHighlightedIndex]) {
                    selectArea(filteredAreas[currentHighlightedIndex]);
                }
                break;
            case 'Escape':
                hideDropdown();
                break;
        }
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!areaInput.contains(e.target) && !areaDropdown.contains(e.target)) {
            hideDropdown();
        }
    });

    // --- 1. Mostrar el formulario ---
    startRequestBtn.addEventListener('click', () => {
        initialButtonContainer.style.display = 'none';
        workRequestForm.style.display = 'block';
        workRequestForm.classList.add('fade-in');
    });

    // --- 2. Lógica para campos condicionales ---
    productSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        digitalPrintContainer.style.display = 'none';
        plotterContainer.style.display = 'none';
        engarContainer.style.display = 'none';
        orientacionContainer.style.display = 'none';
        cartelCongresoContainer.style.display = 'none';

        matriculaInput.required = false;

        if (selectedValue === digitalPrintOption) digitalPrintContainer.style.display = 'block';
        if (selectedValue === plotterOption) plotterContainer.style.display = 'block';
        if (selectedValue === cartelCongresoOption) {
            cartelCongresoContainer.style.display = 'block';
            // Solo cuando el campo es VISIBLE, lo hacemos requerido.
            matriculaInput.required = true;
        }
        if (selectedValue === engargoladosOption) {
            engarContainer.style.display = 'block';
            orientacionContainer.style.display = 'block';
        }
    });

    // --- NUEVO: Listeners para validación en tiempo real del plotter ---
    plotterWidthInput.addEventListener('input', () => {
        if (parseInt(plotterWidthInput.value, 10) > 90) {
            plotterWidthError.classList.remove('hidden');
        } else {
            plotterWidthError.classList.add('hidden');
        }
    });

    plotterLengthInput.addEventListener('input', () => {
        if (parseInt(plotterLengthInput.value, 10) > 150) {
            plotterLengthError.classList.remove('hidden');
        } else {
            plotterLengthError.classList.add('hidden');
        }
    });

    // --- 3. Lógica para agregar items a la tabla (ACTUALIZADA)---
    addItemBtn.addEventListener('click', () => {
        const quantityInput = document.getElementById('quantity');
        let productName = productSelect.value;
        const quantity = parseInt(quantityInput.value, 10);

        if (productName === "") {
            productSelect.focus();
            return;
        }

        if (digitalPrintContainer.style.display === 'block') {
            const paperType = document.getElementById('paperType').value;
            const paperSize = document.getElementById('paperSize').value;
            const isDoubleSided = document.getElementById('doubleSided').checked;
            productName += ` - Papel: ${paperType}, Tamaño: ${paperSize}`;
            if (isDoubleSided) productName += ' (Ambas Caras)';
        }

        if (plotterContainer.style.display === 'block') {
            const width = parseInt(plotterWidthInput.value, 10);
            const length = parseInt(plotterLengthInput.value, 10);
            if (width > 90 || length > 150 || !width || !length) {
                if (width > 90) plotterWidthError.classList.remove('hidden');
                if (length > 150) plotterLengthError.classList.remove('hidden');
                return;
            }
            productName += ` - Medidas: ${width}cm (ancho) x ${length}cm (largo)`;
        }

        // <-- BLOQUE NUEVO PARA CARTEL CONGRESO -->
        if (cartelCongresoContainer.style.display === 'block') {
            const matriculaInput = document.getElementById('matricula');
            const matricula = matriculaInput.value.trim();

            // Validación de que la matrícula no esté vacía
            if (!matricula) {
                matriculaInput.focus(); // Pone el foco en el campo de matrícula
                matriculaInput.classList.add('border-red-500'); // Resalta el campo en rojo
                setTimeout(() => matriculaInput.classList.remove('border-red-500'), 3000); // Quita el resaltado después de 3 segundos
                return; // Detiene la ejecución
            }
            productName += ` - Matrícula: ${matricula}`;
        }
        // <-- FIN DEL BLOQUE NUEVO -->

        if (engarContainer.style.display === 'block') {
            const engargoladoSize = document.getElementById('enType').value;
            const selectedOrientation = document.querySelector('input[name="orientation"]:checked');
            if (!selectedOrientation) {
                return;
            }
            productName += ` - Tamaño: ${engargoladoSize} - Orientación: ${selectedOrientation.value}`;
        }

        if (quantity > 0) {
            if (noItemsRow) noItemsRow.style.display = 'none';
            const newRow = document.createElement('tr');
            newRow.classList.add('border-b');
            newRow.innerHTML = `<td class="py-2 px-4">${productName}</td><td class="text-center py-2 px-4">${quantity}</td><td class="text-center py-2 px-4"><button type="button" class="text-red-500 hover:text-red-700 font-semibold delete-item-btn">Eliminar</button></td>`;
            itemsTableBody.appendChild(newRow);

            // Resetear campos
            quantityInput.value = '1';
            productSelect.value = "";
            digitalPrintContainer.style.display = 'none';
            plotterContainer.style.display = 'none';
            engarContainer.style.display = 'none';
            orientacionContainer.style.display = 'none';
            cartelCongresoContainer.style.display = 'none'; // <-- NUEVO
            if (document.getElementById('matricula')) {
                document.getElementById('matricula').value = ''; // <-- NUEVO
            }
            plotterWidthInput.value = '';
            plotterLengthInput.value = '';
            plotterWidthError.classList.add('hidden');
            plotterLengthError.classList.add('hidden');
            document.querySelectorAll('input[name="orientation"]').forEach(radio => radio.checked = false);
        }
    });

    // --- 4. Lógica para eliminar items ---
    itemsTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-item-btn')) {
            e.target.closest('tr').remove();
            if (itemsTableBody.querySelectorAll('tr:not(#noItemsRow)').length === 0) {
                if (noItemsRow) noItemsRow.style.display = 'table-row';
            }
        }
    });

    // --- 5. Validación de archivos en el cliente ---
    // NUEVO: Manejador para cuando se seleccionan archivos
    fileUpload.addEventListener('change', (e) => {
        fileError.textContent = '';
        const files = e.target.files;

        if (files.length === 0) return;

        // Validar si excedemos el límite total
        if (stagedFiles.length + files.length > MAX_FILES) {
            fileError.textContent = `Error: No puede seleccionar más de ${MAX_FILES} archivos en total.`;
            fileUpload.value = ''; // Limpiar el input
            return;
        }

        // Validar cada archivo
        let validFiles = Array.from(files).filter(file => {
            if (file.size > MAX_SIZE_MB * 1024 * 1024) { // 10 MB
                fileError.textContent = `Error: El archivo "${file.name}" excede el límite de ${MAX_SIZE_MB}MB.`;
                return false;
            }
            // Evitar duplicados
            if (stagedFiles.some(sf => sf.name === file.name)) {
                fileError.textContent = `Info: El archivo "${file.name}" ya está en la lista.`;
                return false;
            }
            return true;
        });

        // Añadir archivos válidos al array
        stagedFiles.push(...validFiles);

        // Actualizar la UI
        updateFileListUI();

        // Limpiar el input para que el usuario pueda agregar más
        fileUpload.value = '';
    });

    // NUEVO: Manejador para eliminar un archivo de la lista
    fileList.addEventListener('click', (e) => {
        if (e.target.classList.contains('file-remove-btn')) {
            const filename = e.target.dataset.filename;
            // Filtrar el array, quitando el archivo
            stagedFiles = stagedFiles.filter(file => file.name !== filename);
            // Actualizar la UI
            updateFileListUI();
        }
    });

    // NUEVO: Función para renderizar la lista de archivos
    function updateFileListUI() {
        fileList.innerHTML = '';
        if (stagedFiles.length === 0) {
            fileList.innerHTML = '<p>No hay archivos seleccionados.</p>';
            return;
        }

        stagedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-list-item';
            fileItem.innerHTML = `
                <span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                <button type="button" class="file-remove-btn" data-filename="${file.name}">Quitar</button>
            `;
            fileList.appendChild(fileItem);
        });
    }

    // Inicializar la lista de archivos
    updateFileListUI();


    // --- 6. Lógica para enviar el formulario a Google Sheets ---
    // Convertir la función en ASÍNCRONA para esperar el zipping
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // <-- NUEVA VALIDACIÓN INICIA AQUÍ -->
        const servicesRowsCount = itemsTableBody.querySelectorAll('tr:not(#noItemsRow)').length;

        if (servicesRowsCount === 0) {
            statusMessage.textContent = 'Error: Debe agregar al menos un servicio a la lista.';
            statusMessage.className = 'text-sm font-medium text-red-600';

            // Hacemos scroll y ponemos el foco en el selector de productos para guiar al usuario
            productSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
            productSelect.focus();

            // Limpiamos el mensaje después de 5 segundos
            setTimeout(() => { statusMessage.textContent = ''; }, 5000);

            return; // Detenemos el envío del formulario aquí mismo
        }
        // <-- NUEVA VALIDACIÓN TERMINA AQUÍ -->

        if (fileUpload.files.length > 3) {
            fileError.textContent = 'Por favor, seleccione 3 archivos como máximo.';
            return;
        }

        submitBtn.disabled = true;
        loadingSpinner.classList.remove('hidden');
        statusMessage.textContent = 'Enviando...';
        statusMessage.className = 'text-sm font-medium text-blue-600';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const items = [];
        itemsTableBody.querySelectorAll('tr:not(#noItemsRow)').forEach(row => {
            const cells = row.getElementsByTagName('td');
            if (cells.length > 0) items.push(`${cells[0].innerText} (Cantidad: ${cells[1].innerText})`);
        });

        data.items = items.join('; ');
        data.timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

        delete data.product;
        delete data.files;

        if (stagedFiles.length > 0) {
            statusMessage.textContent = 'Comprimiendo archivos... Esto puede tardar.';
            
            try {
                const zip = new JSZip();
                // Añadir cada archivo al zip
                stagedFiles.forEach(file => {
                    zip.file(file.name, file);
                });

                // Generar el blob del zip
                const zipBlob = await zip.generateAsync({
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: { level: 6 }
                });

                // Convertir el blob del zip a base64
                const zipBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result.split(',')[1]);
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(zipBlob);
                });
                
                // Añadir el archivo zip (y solo ese) a los datos
                data.files = [{
                    filename: 'archivos_adjuntos.zip',
                    mimeType: 'application/zip',
                    data: zipBase64
                }];

                data.action = "solicitud";
                sendDataToGoogle(data);

            } catch (error) {
                console.error('Error al comprimir archivos:', error);
                statusMessage.textContent = 'Error al procesar los archivos.';
                statusMessage.className = 'text-red-600';
                submitBtn.disabled = false;
                loadingSpinner.classList.add('hidden');
            }
            
        } else {
            // Enviar sin archivos
            data.action = "solicitud";
            sendDataToGoogle(data);
        }
    });

    function sendDataToGoogle(data) {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';


        console.log('Sending data:', data);

        // Crear FormData en lugar de JSON
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));

        fetch(scriptURL, {
            method: 'POST',
            body: formData  // Sin headers de Content-Type
        })
            .then(response => response.json())
            .then(res => {
                if (res.result === 'success') {
                    var folio = res.folio;
                    statusMessage.textContent = '¡Solicitud enviada con éxito! Tu folio es: ' + folio;
                    statusMessage.className = 'text-green-600';
                    form.reset();
                    itemsTableBody.innerHTML = '';
                    if (noItemsRow) {
                        itemsTableBody.appendChild(noItemsRow);
                        noItemsRow.style.display = 'table-row';
                    }

                    stagedFiles = [];
                    updateFileListUI();
                    fileList.innerHTML = '';
                    digitalPrintContainer.style.display = 'none';
                    plotterContainer.style.display = 'none';
                    engarContainer.style.display = 'none';
                    orientacionContainer.style.display = 'none';
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




    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-arrows', // Un tema visual ya incluido
            scrollTo: true
        }
    });

    // Paso 1: Botón inicial
    tour.addStep({
        id: 'step-welcome',
        text: '¡Bienvenido! Para comenzar a llenar tu solicitud de trabajo, haz clic aquí.',
        attachTo: {
            element: '#startRequestBtn',
            on: 'bottom'
        },
        buttons: [{
            text: 'Siguiente',
            action: () => {
                // Simula un clic para mostrar el formulario antes de ir al siguiente paso
                document.getElementById('startRequestBtn').click();
                tour.next();
            }
        }]
    });

    // Paso 2: Información del solicitante

    tour.addStep({
        id: 'step-email',
        text: 'El correo electrónico es obligatorio para que podamos contactarte. Asegúrate de que sea correcto.',
        attachTo: {
            element: '#email', // Se ancla al campo de email
            on: 'bottom'
        },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Siguiente', action: tour.next }
        ]
    });



    tour.addStep({
        id: 'step-nombre',
        text: 'Escribir el nombre del solicitante es importante para identificar quién está haciendo la solicitud.',
        attachTo: {
            element: '#requesterName', // Se ancla al campo de nombre
            on: 'bottom'
        },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Siguiente', action: tour.next }
        ]
    });

    tour.addStep({
        id: 'step-area',
        text: 'Selecciona el área a la que pertenece tu solicitud. Esto nos ayuda a dirigirla al departamento correcto. Si no estás seguro, elige "Otro" y especifica en el campo de descripción.',
        attachTo: {
            element: '#area', // Se ancla al campo de área
            on: 'bottom'
        },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Siguiente', action: tour.next }
        ]
    });

    tour.addStep({
        id: 'step-tel',
        text: 'Proporcionar un número de teléfono o extensión de contacto es importante para que podamos comunicarnos contigo si necesitamos más información sobre tu solicitud. \n O para avisarte sobre el estado de la misma.',
        attachTo: {
            element: '#phone', // Se ancla al campo de teléfono
            on: 'bottom'
        },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Siguiente', action: tour.next }
        ]
    });


    // Paso 3: Descripción del trabajo 


    tour.addStep({
        id: 'step-items',
        text: 'Puedes agregar varias tareas de trabajo. Por ejemplo, si necesitas imprimir documentos y también engargolarlos, puedes agregar ambos trabajos aquí. \n O si también necesitas imprimir otro documento o solicitar otro servicio, puedes hacerlo.  \n Es importante indicar la cantidad de cada trabajo que necesitas.  \n ¡¡Este paso es opcional!!, si no deseas especificar puedes dejarlo en blanco solo se muy claro en la descripción de tu solicitud.',
        attachTo: {
            element: '#product',
            on: 'bottom'
        },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Siguiente', action: tour.next }
        ]
    });

    tour.addStep({
        id: 'step-workType',
        text: 'Aquí debes describir lo mas detalladamente posible el trabajo que necesitas. \n Por ejemplo, si necesitas imprimir un documento, especifica el tipo de papel, tamaño, si es a color o en blanco y negro. Si es un diseño, incluye detalles sobre los elementos gráficos, colores y cualquier otro requisito específico. Además de la Justificación del trabajo.',
        attachTo: {
            element: '#description',
            on: 'bottom'
        },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Siguiente', action: tour.next }
        ]
    });


    tour.addStep({
        id: 'step-documents',
        text: 'Puedes enviarnos documentos relacionados con tu solicitud. Asegúrate de que sean claros y legibles. Puedes subir hasta 3 archivos, cada uno con un tamaño máximo de 10 MB. Aceptamos formatos PDF, DOCX, JPG y PNG. Si por ejemplo necesitas impresiones de un archivo o documento o si un diseño debe contener cierta imagen, etc. Si tu archivo pesa mas, contacta a la oficina de Audiovisual o deberás traernos el archivo.',
        attachTo: {
            element: '#fileUpload',
            on: 'bottom'
        },
        buttons: [
            { text: 'Atrás', action: tour.back },
            { text: 'Siguiente', action: tour.next }
        ]
    });

    tour.addStep({
        id: 'step-finish',
        text: 'Si ya estas seguro de que toda la información es correcta, puedes enviar tu solicitud. Si quieres hacer alguna modificación, una vez enviado el formulario porfavor contactarnos si tienes dudas o necesitas ayuda a la extensión 5147 o 5239.',
        attachTo: {
            element: '#statusMessage',
            on: 'bottom'
        },
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


