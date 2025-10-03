document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';
    
    const SERVICIOS_MAPA = {
        'S1': 'COORTINILLA ANIMADA GENERAL',
        'S2': 'CORTINILLA ASISTENCIA SESIÓN GENERAL Y ENF',
        'S3': 'CORTINILLA INSCRIPCIÓN',
        'S4': 'CORTINILLA ASISTENCIA',
        'S5': 'CORTINILLA EVALUACIÓN DE CALIDAD',
        'S6': 'CORTINILLA GENERAL',
        'S7': 'CORTINILLA GRADUADOS',
        'S8': 'CORTINILLA RECESOS',
        'S9': 'BANNER VERTICAL PODIUM',
        'S10': 'CARTEL IMPRESIÓN',
        'S11': 'CARTEL REVISTA',
        'S12': 'ENCABEZADO DE ZOOM',
        'S13': 'ENCABEZADO FORMULARIOS',
        'S14': 'FLECHAS',
        'S15': 'FONDOS DE PANTALLA, VIRTUAL Y OBS',
        'S16': 'GAFETES',
        'S17': 'MAPA DE DISTRIBUCIÓN DE TALLERES',
        'S18': 'MOSCA',
        'S19': 'PLANTILLA DE PRESENTACIONES',
        'S20': 'POSTAL DE DIFUSIÓN',
        'S21': 'PROGRAMA PANTALLA LOBBY AUDITORIO RÉBORA',
        'S22': 'PROGRAMA: PORTADA E INTERIOR',
        'S23': 'SEÑALÉTICA Y QR PARA TALLERES',
        'S24': 'APOYO TÉCNICO',
        'S25': 'DOCUMENTO DE PREGUNTAS Y COMENTARIOS',
        'S26': 'FORMATO TRABAJO LIBRES',
        'S27': 'MANUAL EXPOSITORES',
        'S28': 'SUPERS',
        'S29': 'SUPERS ORDEN DEL DIA INAUGURACIÓN Y CLAUSURA',
        'S30': 'SUPERS PROGRAMA',
        'S31': 'SUPERS SESIÓN GENERAL Y ENFERMERIA',
        'S32': 'QR ASISTENCIA',
        'S33': 'QR BANDERÍN',
        'S34': 'QR EVALUACION DE CALIDAD',
        'S35': 'QR INSCRIPCIÓN',
        'S36': 'QR SESIÓN',
        'S37': 'PROGRAMACIÓN ZOOM',
        'S38': 'REEL DE VIDEO DEL EVENTO (SESIÓN, CURSO, JORNADA, ETC)',
        'S39': 'TRANSMITIR INSTAGRAM Y FACEBOOK',
        'S40': 'TRANSMISION EN YOUTUBE',
        'S41': 'TRANSMISION ZOOM',
        'S42': 'VIDEO CUENTA REGRESIVA',
        'S43': 'VIDEO INTRO DE PROTECCIÓN CIVIL',
        'S44': 'VIDEOS SALA DE ESPERA'
    };

    const mesSelect = document.getElementById('filtroMes');
    const anioSelect = document.getElementById('filtroAnio');
    const container = document.getElementById('eventosContainer');
    const loading = document.getElementById('loadingState');

    /**
     * Función para llamar a Google Apps Script usando el método FormData,
     * que evita problemas de CORS.
     */
    function callGAS(action, data) {
        const formData = new FormData();
        const payload = { action, ...data };
        formData.append('data', JSON.stringify(payload));

        // No se necesitan 'headers'. El navegador lo maneja automáticamente con FormData.
        return fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json());
    }

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

    function loadEvents() {
        const mes = parseInt(mesSelect.value);
        const anio = parseInt(anioSelect.value);
        
        container.innerHTML = '';
        loading.classList.remove('hidden');

        callGAS('getEventosDelMes', { mes, anio })
            .then(response => {
                if (response.success) {
                    renderEvents(response.data);
                } else {
                    throw new Error(response.message || 'Error desconocido.');
                }
            })
            .catch(error => {
                container.innerHTML = `<p class="text-red-500 col-span-full text-center">Error al cargar eventos: ${error.message}</p>`;
            })
            .finally(() => {
                loading.classList.add('hidden');
            });
    }

    function renderEvents(eventos) {
        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-full text-center">No hay eventos para este mes.</p>';
            return;
        }
        eventos.forEach(evento => {
            const card = createEventCard(evento);
            container.appendChild(card);
        });
    }

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
                        const nombreServicio = SERVICIOS_MAPA[s.codigo] || s.codigo; // <-- El cambio clave está aquí
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

        card.querySelector('.card-header').addEventListener('click', () => {
            const details = card.querySelector('.card-details');
            if (details.style.maxHeight) {
                details.style.maxHeight = null;
            } else {
                details.style.maxHeight = details.scrollHeight + "px";
            }
        });
        
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
                           // Podríamos actualizar la barra de progreso aquí mismo para una mejor experiencia de usuario
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

    // --- Inicialización ---
    populateFilters();
    loadEvents();

    mesSelect.addEventListener('change', loadEvents);
    anioSelect.addEventListener('change', loadEvents);
});