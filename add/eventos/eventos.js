document.addEventListener('DOMContentLoaded', function () {
    // URL de tu Google Apps Script (la misma que usas en scripts.js)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

    // --- ELEMENTOS DEL DOM ---
    const userInfo = document.getElementById('userInfo');
    const welcomeUser = document.getElementById('welcomeUser');
    const logoutBtn = document.getElementById('logoutBtn');
    const eventosForm = document.getElementById('eventosForm');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');

    // --- ESTADO ---
    let currentUser = null;



    // --- 2. LÓGICA DEL FORMULARIO DE EVENTOS (SIN CAMBIOS, AHORA FUNCIONARÁ) ---
    if (eventosForm) {
        eventosForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';

            // Obtener solo los checkboxes de servicios seleccionados
            const checkboxesSeleccionados = document.querySelectorAll('.service-checkbox:checked');
            const serviciosSeleccionados = [];
            
            checkboxesSeleccionados.forEach(cb => {
                if (cb.value) {
                    serviciosSeleccionados.push(cb.value);
                }
            });
            
            const serviciosString = serviciosSeleccionados.join(' ');

            // --- Objeto de datos que se enviará al backend ---
            const dataToSend = {
                action: 'registrarEvento',
                // CAMBIO: Se quitó "noEvento" y se agregó "asignadoA"
                asignadoA: document.getElementById('asignadoA').value,
                fechaInicio: document.getElementById('fechaInicio').value,
                fechaFin: document.getElementById('fechaFin').value,
                tipoEvento: document.getElementById('tipoEvento').value,
                nombreEvento: document.getElementById('nombreEvento').value,
                sede: document.getElementById('sede').value,
                servicios: serviciosString,
                comentarios: document.getElementById('comentarios').value 
            };
            
            // Log para debugging
            console.log('Enviando datos:', dataToSend);

            const formData = new FormData();
            formData.append('data', JSON.stringify(dataToSend));

            fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ ¡Evento registrado con éxito!');
                    eventosForm.reset();
                    // Disparamos un evento 'change' para que la UI se reinicie
                    document.getElementById('tipoEvento').dispatchEvent(new Event('change'));
                } else {
                    throw new Error(result.message || 'Error desconocido del servidor.');
                }
            })
            .catch(error => {
                console.error('Error al registrar el evento:', error);
                alert(`❌ Hubo un error: ${error.message}`);
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrar Evento';
            });
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            eventosForm.reset();
            // Disparamos un evento 'change' para que la UI se reinicie también al limpiar
            document.getElementById('tipoEvento').dispatchEvent(new Event('change'));
        });
    }
});