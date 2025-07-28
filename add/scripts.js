document.addEventListener('DOMContentLoaded', function() {
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

    // Contenedores de campos condicionales
    const digitalPrintContainer = document.getElementById('digitalPrintContainer');
    const plotterContainer = document.getElementById('plotterContainer');
    const engarContainer = document.getElementById('engarContainer');
    const orientacionContainer = document.getElementById('orientacionContainer');
    
    // --- NUEVO: Elementos para validación de plotter ---
    const plotterWidthInput = document.getElementById('plotterWidth');
    const plotterLengthInput = document.getElementById('plotterLength');
    const plotterWidthError = document.getElementById('plotterWidthError');
    const plotterLengthError = document.getElementById('plotterLengthError');
    
    // Opciones que activan campos condicionales
    const digitalPrintOption = "IMPRESIÓN DIGITAL";
    const plotterOption = "IMPRESIÓN EN PLOTTER";
    const engargoladosOption = "ENGARGOLADO";

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

        if (selectedValue === digitalPrintOption) digitalPrintContainer.style.display = 'block';
        if (selectedValue === plotterOption) plotterContainer.style.display = 'block';
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
            // Reemplazado alert por un foco en el campo para mejor UX
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

            // Validación final antes de agregar
            if (width > 90 || length > 150 || !width || !length) {
                // Si hay un error, nos aseguramos que los mensajes sean visibles y detenemos
                if (width > 90) plotterWidthError.classList.remove('hidden');
                if (length > 150) plotterLengthError.classList.remove('hidden');
                return; 
            }
            productName += ` - Medidas: ${width}cm (ancho) x ${length}cm (largo)`;
        }
        
        if (engarContainer.style.display === 'block') {
            const engargoladoSize = document.getElementById('enType').value;
            const selectedOrientation = document.querySelector('input[name="orientation"]:checked');

            if (!selectedOrientation) {
                // Podemos añadir un feedback visual aquí también si queremos
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
    fileUpload.addEventListener('change', () => {
        fileError.textContent = '';
        fileList.innerHTML = '';
        const files = fileUpload.files;
        
        if (files.length > 3) {
            fileError.textContent = 'Error: No puede seleccionar más de 3 archivos.';
            fileUpload.value = '';
            return;
        }

        for(const file of files) {
            if (file.size > 10 * 1024 * 1024) { // 10 MB
                fileError.textContent = `Error: El archivo "${file.name}" excede el límite de 10MB.`;
                fileUpload.value = '';
                fileList.innerHTML = '';
                return;
            }
            const fileItem = document.createElement('p');
            fileItem.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            fileList.appendChild(fileItem);
        }
    });

    // --- 6. Lógica para enviar el formulario a Google Sheets ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (fileUpload.files.length > 3) {
            fileError.textContent = 'Por favor, seleccione 3 archivos como máximo.';
            return;
        }

        submitBtn.disabled = true;
        loadingSpinner.classList.remove('hidden');
        statusMessage.textContent = 'Enviando...';
        statusMessage.className = 'text-blue-600';

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
        delete data.orientation;

        const files = fileUpload.files;
        if (files.length > 0) {
            statusMessage.textContent = 'Subiendo archivos... Esto puede tardar.';
            const filePromises = Array.from(files).map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        resolve({
                            filename: file.name,
                            mimeType: file.type,
                            data: event.target.result.split(',')[1]
                        });
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(filePromises)
                .then(fileDataArray => {
                    data.files = fileDataArray;
                    sendDataToGoogle(data);
                })
                .catch(error => {
                    console.error('Error al leer archivos:', error);
                    statusMessage.textContent = 'Error al procesar los archivos.';
                    statusMessage.className = 'text-red-600';
                    submitBtn.disabled = false;
                    loadingSpinner.classList.add('hidden');
                });
        } else {
            sendDataToGoogle(data);
        }
    });

  function sendDataToGoogle(data) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbz7dPGWOXudgEg8f8ZOh-qmGoxE0f_48Aesk-RwMeTCiVHNRfua7db1OomX-aCI8nrnYQ/exec';

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(data)
        // ← Solo esto, nada más
    })
    .then(response => response.json())
    .then(res => {
        if (res.result === 'success') {
            statusMessage.textContent = '¡Solicitud enviada con éxito!';
            statusMessage.className = 'text-green-600';
            form.reset();
            itemsTableBody.innerHTML = '';
            if (noItemsRow) {
                itemsTableBody.appendChild(noItemsRow);
                noItemsRow.style.display = 'table-row';
            }
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




    // --- Configuración del Tour con Shepherd.js ---
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-arrows',
        scrollTo: true
      }
    });

    tour.addStep({
      id: 'step-welcome',
      text: '¡Bienvenido! Para comenzar a llenar tu solicitud de trabajo, haz clic aquí.',
      attachTo: { element: '#startRequestBtn', on: 'bottom' },
      buttons: [{
        text: 'Siguiente',
        action: () => {
            document.getElementById('startRequestBtn').click();
            tour.next();
        }
      }]
    });
    // ... (El resto del tour sigue igual)

    if (!localStorage.getItem('tutorialSolicitudVisto')) {
      tour.start();
      localStorage.setItem('tutorialSolicitudVisto', 'true');
    }
});