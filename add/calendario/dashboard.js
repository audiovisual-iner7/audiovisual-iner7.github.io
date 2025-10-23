document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';
    
    // El mapa de servicios no cambia
    const SERVICIOS_MAPA = {
        'S1': 'COORTINILLA ANIMADA GENERAL', 'S2': 'CORTINILLA ASISTENCIA SESIÓN GENERAL Y ENF',
        'S3': 'CORTINILLA INSCRIPCIÓN', 'S4': 'CORTINILLA ASISTENCIA',
        'S5': 'CORTINILLA EVALUACIÓN DE CALIDAD', 'S6': 'CORTINILLA GENERAL',
        'S7': 'CORTINILLA GRADUADOS', 'S8': 'CORTINILLA RECESOS',
        'S9': 'BANNER VERTICAL PODIUM', 'S10': 'CARTEL IMPRESIÓN',
        'S11': 'CARTEL REVISTA', 'S12': 'ENCABEZADO DE ZOOM',
        'S13': 'ENCABEZADO FORMULARIOS', 'S14': 'FLECHAS',
        'S15': 'FONDOS DE PANTALLA, VIRTUAL Y OBS', 'S16': 'GAFETES',
        'S17': 'MAPA DE DISTRIBUCIÓN DE TALLERES', 'S18': 'MOSCA',
        'S19': 'PLANTILLA DE PRESENTACIONES', 'S20': 'POSTAL DE DIFUSIÓN',
        'S21': 'PROGRAMA PANTALLA LOBBY AUDITORIO RÉBORA', 'S22': 'PROGRAMA: PORTADA E INTERIOR',
        'S23': 'SEÑALÉTICA Y QR PARA TALLERES', 'S24': 'APOYO TÉCNICO',
        'S25': 'DOCUMENTO DE PREGUNTAS Y COMENTARIOS', 'S26': 'FORMATO TRABAJO LIBRES',
        'S27': 'MANUAL EXPOSITORES', 'S28': 'SUPERS',
        'S29': 'SUPERS ORDEN DEL DIA INAUGURACIÓN Y CLAUSURA', 'S30': 'SUPERS PROGRAMA',
        'S31': 'SUPERS SESIÓN GENERAL Y ENFERMERIA', 'S32': 'QR ASISTENCIA',
        'S33': 'QR BANDERÍN', 'S34': 'QR EVALUACION DE CALIDAD',
        'S35': 'QR INSCRIPCIÓN', 'S36': 'QR SESIÓN',
        'S37': 'PROGRAMACIÓN ZOOM', 'S38': 'REEL DE VIDEO DEL EVENTO (SESIÓN, CURSO, JORNADA, ETC)',
        'S39': 'TRANSMITIR INSTAGRAM Y FACEBOOK', 'S40': 'TRANSMISION EN YOUTUBE',
        'S41': 'TRANSMISION ZOOM', 'S42': 'VIDEO CUENTA REGRESIVA',
        'S43': 'VIDEO INTRO DE PROTECCIÓN CIVIL', 'S44': 'VIDEOS SALA DE ESPERA'
    };
    

    
    // --- ELEMENTOS DEL DOM ---
    const mesSelect = document.getElementById('filtroMes');
    const anioSelect = document.getElementById('filtroAnio');
    // Nuevos filtros
    const tipoSelect = document.getElementById('filtroTipo');
    const asignadoSelect = document.getElementById('filtroAsignado');
    const sedeSelect = document.getElementById('filtroSede');
    const estadoSelect = document.getElementById('filtroEstado');
    
    const container = document.getElementById('eventosContainer');
    const loading = document.getElementById('loadingState');

    // --- ESTADO ---
    let allEventosDelMes = []; // Guardará todos los eventos del mes

    /**
     * Función para llamar a Google Apps Script (sin cambios)
     */
    function callGAS(action, data) {
        const formData = new FormData();
        const payload = { action, ...data };
        formData.append('data', JSON.stringify(payload));

        return fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json());
    }

    /**
     * Popula los filtros estáticos (Mes y Año) (sin cambios)
     */
    function populateFilters() {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        meses.forEach((mes, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = mes;
            mesSelect.appendChild(option);
        });

        const anioActual = new Date().getFullYear();
        for (let i = anioActual + 1; i >= anioActual - 2; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            anioSelect.appendChild(option);
        }

        mesSelect.value = new Date().getMonth() + 1;
        anioSelect.value = anioActual;
    }

    /**
     * MODIFICADO: Carga eventos del servidor
     * Esta función AHORA solo obtiene los datos y los guarda.
     * Luego llama a las funciones para popular filtros y renderizar.
     */
    function loadEvents() {
        const mes = parseInt(mesSelect.value);
        const anio = parseInt(anioSelect.value);
        
        container.innerHTML = '';
        loading.classList.remove('hidden');
        resetDynamicFilters(); // Limpia los filtros dinámicos

        callGAS('getEventosDelMes', { mes, anio })
            .then(response => {
                if (response.success) {
                    allEventosDelMes = response.data || []; // Guarda la lista completa
                    populateDynamicFilters(allEventosDelMes); // Popula los <select>
                    applyFiltersAndRender(); // Filtra y muestra
                } else {
                    throw new Error(response.message || 'Error desconocido.');
                }
            })
            .catch(error => {
                allEventosDelMes = []; // Limpia en caso de error
                container.innerHTML = `<p class="text-red-500 col-span-full text-center">Error al cargar eventos: ${error.message}</p>`;
            })
            .finally(() => {
                loading.classList.add('hidden');
            });
    }

    /**
     * NUEVA FUNCIÓN: Popula los filtros dinámicos (Tipo, Asignado, Sede)
     * basado en los eventos cargados.
     */
    function populateDynamicFilters(eventos) {
        // Obtenemos valores únicos y los ordenamos
        const tipos = [...new Set(eventos.map(e => e.tipo))].sort();
        const asignados = [...new Set(eventos.map(e => e.asignadoA))].sort();
        const sedes = [...new Set(eventos.map(e => e.sede))].sort();

        // Función helper para rellenar un <select>
        const populateSelect = (selectEl, items) => {
            const currentValue = selectEl.value; // Guardar valor seleccionado (si existe)
            selectEl.innerHTML = '<option value="todos">Todos</option>'; // Reset
            items.forEach(item => {
                if (item) { // Evitar valores nulos o vacíos
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    selectEl.appendChild(option);
                }
            });
            selectEl.value = currentValue; // Intentar restaurar el valor
            if (selectEl.selectedIndex === -1) {
                selectEl.value = 'todos'; // Default si el valor ya no existe
            }
        };
        
        populateSelect(tipoSelect, tipos);
        populateSelect(asignadoSelect, asignados);
        populateSelect(sedeSelect, sedes);
    }
    
    /**
     * NUEVA FUNCIÓN: Resetea los filtros dinámicos (usado al cambiar de mes)
     */
    function resetDynamicFilters() {
        tipoSelect.innerHTML = '<option value="todos">Todos</option>';
        asignadoSelect.innerHTML = '<option value="todos">Todos</option>';
        sedeSelect.innerHTML = '<option value="todos">Todos</option>';
        estadoSelect.value = 'todos'; // Resetear el de estado también
    }

    /**
     * NUEVA FUNCIÓN: Aplica TODOS los filtros (los nuevos) a la lista
     * `allEventosDelMes` y luego llama a `renderEvents`.
     */
    function applyFiltersAndRender() {
        // Lee los valores de todos los filtros
        const tipo = tipoSelect.value;
        const asignado = asignadoSelect.value;
        const sede = sedeSelect.value;
        const estado = estadoSelect.value;

        // Filtra la lista de eventos guardada
        const filteredEventos = allEventosDelMes.filter(evento => {
            // Filtro Tipo
            if (tipo !== 'todos' && evento.tipo !== tipo) {
                return false;
            }
            // Filtro Asignado A
            if (asignado !== 'todos' && evento.asignadoA !== asignado) {
                return false;
            }
            // Filtro Sede
            if (sede !== 'todos' && evento.sede !== sede) {
                return false;
            }
            // Filtro Estado
            if (estado !== 'todos') {
                const progreso = evento.totalServicios > 0 ? (evento.serviciosEntregados / evento.totalServicios) : 1;
                
                if (estado === 'completados' && progreso < 1) { // < 1 porque 1 es 100%
                    return false;
                }
                if (estado === 'pendientes' && progreso === 1) { // === 1 es 100%
                    return false;
                }
            }
            return true; // Si pasa todos los filtros, se incluye
        });
        
        renderEvents(filteredEventos); // Renderiza solo los eventos filtrados
    }


    /**
     * MODIFICADO: Renderiza los eventos.
     * Ahora limpia el contenedor al inicio y muestra un mensaje si
     * la lista de (eventos filtrados) está vacía.
     */
    function renderEvents(eventos) {
        container.innerHTML = ''; // Limpiar siempre antes de renderizar

        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-full text-center">No hay eventos que coincidan con los filtros seleccionados.</p>';
            return;
        }
        eventos.forEach(evento => {
            const card = createEventCard(evento);
            container.appendChild(card);
        });
    }

    /**
     * Función para crear la tarjeta de evento (sin cambios)
     */
    function createEventCard(evento) {
        const progreso = evento.totalServicios > 0 ? (evento.serviciosEntregados / evento.totalServicios) * 100 : 100;
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg flex flex-col';
        card.innerHTML = `
            <div class="p-5 cursor-pointer card-header">
                <p class="text-sm text-gray-500">${evento.tipo}</p>
                <h3 class="font-bold text-lg text-gray-800">${evento.nombre}</h3>
                <p class="text-sm text-gray-600 mt-1">${new Date(evento.fechaInicio).toLocaleDateString()} - ${new Date(evento.fechaFin).toLocaleDateString()}</p>
                <p class="text-sm font-medium text-brand mt-1">${evento.sede} / Asignado a: ${evento.asignadoA}</p>
                
                <div class="mt-4">
                    <div class="flex justify-between items-center text-sm mb-1">
                        <span class="font-medium">Progreso</span>
                        <span class="font-bold">${evento.serviciosEntregados} / ${evento.totalServicios}</span>
                    </div>
                    <div class="w-full progress-bar-bg rounded-full h-2.5">
                        <div class="progress-bar-fill h-2.5 rounded-full" style="width: ${progreso}%"></div>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-200 card-details">
                <div class="p-5 space-y-3">
                    <h4 class="font-semibold">Servicios Requeridos</h4>
                    ${evento.servicios && evento.servicios.length > 0 ? evento.servicios.map(s => {
                        const nombreServicio = SERVICIOS_MAPA[s.codigo] || s.codigo;
                        return `
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-medium text-gray-600">${nombreServicio}</label>
                                <div class="flex items-center gap-2" data-service-code="${s.codigo}">
                                    <input type="text" value="${s.link || ''}" ${s.link ? 'disabled' : ''} placeholder="Pegar link de entrega..." class="flex-grow border-gray-300 rounded-md text-sm">
                                    <button class="entregar-btn px-3 py-1 text-sm rounded-md ${s.link ? 'bg-green-500 text-white' : 'bg-brand text-white hover:bg-brand-light'}">
                                        ${s.link ? '✓ Entregado' : 'Entregar'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('') : '<p class="text-sm text-gray-500">No se solicitaron servicios.</p>'}
                </div>
            </div>
        `;

        // Lógica del acordeón (sin cambios)
        card.querySelector('.card-header').addEventListener('click', () => {
            const details = card.querySelector('.card-details');
            if (details.style.maxHeight) {
                details.style.maxHeight = null;
            } else {
                details.style.maxHeight = details.scrollHeight + "px";
            }
        });
        
        // Lógica de entrega (sin cambios)
        card.querySelectorAll('.entregar-btn').forEach(btn => {
            if(btn.textContent.includes('Entregado')) return;

            btn.addEventListener('click', () => {
                const serviceDiv = btn.closest('[data-service-code]');
                const codigoServicio = serviceDiv.dataset.serviceCode;
                const input = serviceDiv.querySelector('input[type="text"]');
                const link = input.value.trim();

                if(!link) {
                    alert('Por favor, pega un link antes de entregar.');
                    return;
                }

                btn.disabled = true;
                btn.textContent = '...';

                callGAS('entregarServicio', { idEvento: evento.idEvento, codigoServicio, link })
                    .then(response => {
                        if(response.success){
                           input.disabled = true;
                           btn.textContent = '✓ Entregado';
                           btn.classList.remove('bg-brand', 'hover:bg-brand-light');
                           btn.classList.add('bg-green-500');
                           // Idealmente, aquí se debería recargar o actualizar la barra de progreso
                           // Para una UX instantánea, podríamos llamar a loadEvents() o recalcular
                        } else {
                            throw new Error(response.message);
                        }
                    })
                    .catch(error => {
                        alert('Error al entregar: ' + error.message);
                        btn.disabled = false;
                        btn.textContent = 'Entregar';
                    });
            });
        });

        return card;
    }

    // --- Inicialización y Event Listeners ---
    populateFilters(); // Popula Mes/Año
    loadEvents(); // Carga datos, popula filtros dinámicos y renderiza

    // --- Event Listeners MODIFICADOS ---
    
    // Estos recargan los datos desde el servidor
    mesSelect.addEventListener('change', loadEvents);
    anioSelect.addEventListener('change', loadEvents);

    // Estos SÓLO aplican filtros en el cliente (frontend)
    tipoSelect.addEventListener('change', applyFiltersAndRender);
    asignadoSelect.addEventListener('change', applyFiltersAndRender);
    sedeSelect.addEventListener('change', applyFiltersAndRender);
    estadoSelect.addEventListener('change', applyFiltersAndRender);
});