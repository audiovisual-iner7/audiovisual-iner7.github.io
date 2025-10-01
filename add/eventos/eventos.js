document.addEventListener('DOMContentLoaded', () => {
    // URL de tu Google Apps Script
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

    // --- ELEMENTOS DEL DOM (NO MODIFICAR) ---
    const userInfo = document.getElementById('userInfo');
    const welcomeUser = document.getElementById('welcomeUser');
    const logoutBtn = document.getElementById('logoutBtn');
    const eventosForm = document.getElementById('eventosForm');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    let currentUser = null;

    

    // --- FUNCIONES AUXILIARES (YA ESTÁN BIEN, NO REQUIEREN CAMBIOS) ---
    function showMessage(message, isError = false) {
        let messageDiv = document.getElementById('message-container');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'message-container';
            messageDiv.className = 'fixed top-4 right-4 z-50 max-w-md';
            document.body.appendChild(messageDiv);
        }
        const alertDiv = document.createElement('div');
        alertDiv.className = `p-4 rounded-lg shadow-lg ${isError ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`;
        alertDiv.innerHTML = `<div class="flex items-center"><span class="flex-1">${message}</span><button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg font-bold">&times;</button></div>`;
        messageDiv.appendChild(alertDiv);
        setTimeout(() => { if (alertDiv.parentNode) { alertDiv.remove(); } }, 5000);
    }

    function setSubmitButtonState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Registrando...`;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Registrar Evento';
        }
    }

    // --- FUNCIÓN A MODIFICAR ---
    /**
     * Función para recopilar los datos del formulario con la nueva lógica de claves.
     */
    function collectFormData() {
        const formData = new FormData(eventosForm);

        // Recopilar las claves de los servicios seleccionados
        const clavesSeleccionadas = [];
        const serviceCheckboxes = eventosForm.querySelectorAll('input[type="checkbox"]:checked');
        serviceCheckboxes.forEach(checkbox => {
            // Asegurarnos de que el checkbox tenga un 'name' (para no incluir "seleccionar todos", si existiera)
            if (checkbox.name) {
                clavesSeleccionadas.push(checkbox.name);
            }
        });
        const clavesString = clavesSeleccionadas.join(', '); // Convertir a "S1, S5, S29"

        // Devolvemos el objeto en el formato que espera el backend
        return {
            action: 'registrarEvento',
            noEvento: formData.get('noEvento') || '',
            fechaInicio: formData.get('fechaInicio'),
            fechaFin: formData.get('fechaFin'),
            tipoEvento: formData.get('tipoEvento'),
            nombreEvento: formData.get('nombreEvento'),
            sede: formData.get('sede'),
            claves: clavesString // Aquí enviamos la cadena de texto de claves
        };
    }

    /**
     * Función para validar el formulario (MODIFICADA para claves)
     */
    function validateForm(data) {
        const errors = [];
        if (!data.fechaInicio) errors.push('La fecha de inicio es requerida');
        if (!data.fechaFin) errors.push('La fecha fin es requerida');
        if (!data.tipoEvento) errors.push('El tipo de evento es requerido');
        if (!data.nombreEvento.trim()) errors.push('El nombre del evento es requerido');
        if (!data.sede.trim()) errors.push('La sede es requerida');

        if (data.fechaInicio && data.fechaFin && new Date(data.fechaFin) < new Date(data.fechaInicio)) {
            errors.push('La fecha de fin no puede ser anterior a la de inicio');
        }

        // Validar que la cadena de claves no esté vacía
        if (!data.claves) {
            errors.push('Debe seleccionar al menos un servicio requerido');
        }

        return errors;
    }
    
    // --- LÓGICA PRINCIPAL DEL FORMULARIO ---
    eventosForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventData = collectFormData(); // Recopila datos con la nueva lógica
        const validationErrors = validateForm(eventData);

        if (validationErrors.length > 0) {
            showMessage('Errores de validación:\n• ' + validationErrors.join('\n• '), true);
            return;
        }

        setSubmitButtonState(true);
        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('data', JSON.stringify(eventData));
            
            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formDataToSubmit });
            const result = await response.json();

            if (result.success) {
                showMessage('¡Evento registrado exitosamente!');
                eventosForm.reset();
            } else {
                showMessage('Error al registrar evento: ' + (result.message || 'Error desconocido'), true);
            }
        } catch (error) {
            showMessage('Error al procesar la solicitud: ' + error.message, true);
        } finally {
            setSubmitButtonState(false);
        }
    });

    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Está seguro de que desea limpiar todos los campos del formulario?')) {
            eventosForm.reset();
            showMessage('Formulario limpiado correctamente');
        }
    });
});