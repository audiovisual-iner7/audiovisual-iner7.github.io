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
        const paperTypeContainer = document.getElementById('paperTypeContainer');
        const rollTypeContainer = document.getElementById('rollTypeContainer');
        const doubleSidedContainer = document.getElementById('doubleSidedContainer');
        const fileUpload = document.getElementById('fileUpload');
        const fileList = document.getElementById('fileList');
        const fileError = document.getElementById('fileError');

        // Opciones que activan campos condicionales
        const paperOptions = ["IMPRESIÓN PAPEL REUSO", "IMPRESIONES CARTA", "IMPRESIONES OFICIO", "IMPRESIONES PAPEL ESPECIAL", "IMPRESIONES TABLOIDE", "HOJAS CARTA", "HOJAS OFICIO", "HOJAS TABLOIDE", "HOJAS DE REUSO", "HOJAS PAPEL ESPECIAL"];
        const impressionOptions = ["IMPRESIÓN PAPEL REUSO", "IMPRESIONES CARTA", "IMPRESIONES OFICIO", "IMPRESIONES PAPEL ESPECIAL", "IMPRESIONES TABLOIDE"];
        const plotterOption = "CENTÍMETROS PLOTTER";

        // 1. Mostrar el formulario
        startRequestBtn.addEventListener('click', () => {
            initialButtonContainer.style.display = 'none';
            workRequestForm.style.display = 'block';
            workRequestForm.classList.add('fade-in');
        });

        // 2. Lógica para campos condicionales
        productSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;

            // Ocultar todos los campos condicionales por defecto
            paperTypeContainer.style.display = 'none';
            rollTypeContainer.style.display = 'none';
            doubleSidedContainer.style.display = 'none';

            // Mostrar campos basados en la selección
            if (paperOptions.includes(selectedValue)) {
                paperTypeContainer.style.display = 'block';
            }
            if (impressionOptions.includes(selectedValue)) {
                doubleSidedContainer.style.display = 'block';
            }
            if (selectedValue === plotterOption) {
                rollTypeContainer.style.display = 'block';
            }
        });

        // 3. Lógica para agregar items a la tabla
        addItemBtn.addEventListener('click', () => {
            const quantityInput = document.getElementById('quantity');
            let productName = productSelect.value;
            const quantity = parseInt(quantityInput.value, 10);
            const doubleSidedCheckbox = document.getElementById('doubleSided');

            if (paperTypeContainer.style.display === 'block') {
                productName += ` - Papel: ${document.getElementById('paperType').value}`;
            }
            if (rollTypeContainer.style.display === 'block') {
                productName += ` - Rollo: ${document.getElementById('rollType').value}`;
            }
            if (doubleSidedContainer.style.display === 'block' && doubleSidedCheckbox.checked) {
                productName += ' (Ambas Caras)';
            }

            if (quantity > 0) {
                if (noItemsRow) noItemsRow.style.display = 'none';
                const newRow = document.createElement('tr');
                newRow.classList.add('border-b');
                newRow.innerHTML = `<td class="py-2 px-4">${productName}</td><td class="text-center py-2 px-4">${quantity}</td><td class="text-center py-2 px-4"><button type="button" class="text-red-500 hover:text-red-700 font-semibold delete-item-btn">Eliminar</button></td>`;
                itemsTableBody.appendChild(newRow);
                quantityInput.value = '1';
            }
        });

        // 4. Lógica para eliminar items
        itemsTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-item-btn')) {
                e.target.closest('tr').remove();
                if (itemsTableBody.querySelectorAll('tr:not(#noItemsRow)').length === 0) {
                    noItemsRow.style.display = 'table-row';
                }
            }
        });
        
        // 5. Validación de archivos en el cliente
        fileUpload.addEventListener('change', () => {
            fileError.textContent = '';
            fileList.innerHTML = '';
            const files = fileUpload.files;
            
            if (files.length > 3) {
                fileError.textContent = 'Error: No puede seleccionar más de 3 archivos.';
                fileUpload.value = ''; // Limpiar selección
                return;
            }

            for(const file of files) {
                if (file.size > 10 * 1024 * 1024) { // 10 MB
                    fileError.textContent = `Error: El archivo "${file.name}" excede el límite de 10MB.`;
                    fileUpload.value = ''; // Limpiar selección
                    fileList.innerHTML = '';
                    return;
                }
                const fileItem = document.createElement('p');
                fileItem.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                fileList.appendChild(fileItem);
            }
        });

        // 6. Lógica para enviar el formulario a Google Sheets
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
            
            const files = fileUpload.files;
            if (files.length > 0) {
                statusMessage.textContent = 'Subiendo archivos... Esto puede tardar.';
                const filePromises = Array.from(files).map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const fileData = {
                                filename: file.name,
                                mimeType: file.type,
                                data: event.target.result.split(',')[1] // Base64 data
                            };
                            resolve(fileData);
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
            const scriptURL = 'https://script.google.com/macros/s/AKfycbwy-6eVTxYKXP51cjQurYEwXQwjB_N0-MQhwCUegXzZhr3OuQF-SmiljQ447-iTEmEv/exec'; // Reemplaza con tu URL

            fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(res => {
                if (res.result === 'success') {
                    statusMessage.textContent = '¡Solicitud enviada con éxito!';
                    statusMessage.className = 'text-green-600';
                    form.reset();
                    itemsTableBody.innerHTML = '';
                    itemsTableBody.appendChild(noItemsRow);
                    noItemsRow.style.display = 'table-row';
                    fileList.innerHTML = '';
                    paperTypeContainer.style.display = 'none';
                    rollTypeContainer.style.display = 'none';
                    doubleSidedContainer.style.display = 'none';
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
    });