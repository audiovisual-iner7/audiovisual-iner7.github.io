// URL DE TU SCRIPT DE GOOGLE
const API_URL = 'https://script.google.com/macros/s/AKfycbx3TIV78su8GSkAmxq15Ozcz0l37jEN-u76zjYuVVZkbewnMyx8Qw--rwukOg617B_7DA/exec';

let solicitudActual = null;
let espacioSeleccionadoID = null;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    cargarSolicitudes();
    configurarEventosIniciales();
});

function configurarEventosIniciales() {
    // Botón Buscar Disponibilidad
    const btnBuscar = document.getElementById('btnBuscarDispo');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarDisponibilidad);
    }

    // Botón Confirmar Asignación (Modal)
    const btnConfirmar = document.getElementById('btnConfirmarAsignacion');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', procesarAsignacion);
    }
}

// --- 1. CARGAR SOLICITUDES ---
function cargarSolicitudes() {
    const container = document.getElementById('listaSolicitudes');
    container.innerHTML = '<div class="text-center text-gray-400 text-sm mt-4">Cargando...</div>';

    const formData = new FormData();
    formData.append('data', JSON.stringify({ action: 'getSolicitudes', status: 'PENDIENTE' }));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            container.innerHTML = '';
            if (res.result === 'success' && res.data.length > 0) {
                res.data.forEach(sol => {
                    const card = document.createElement('div');
                    card.className = 'bg-white p-3 rounded border border-gray-200 cursor-pointer card-hover transition-all';
                    card.innerHTML = `
                        <div class="flex justify-between mb-1">
                            <span class="font-bold text-[#003C7D] text-sm">${sol.folio}</span>
                            <span class="text-xs text-gray-400">${sol.fechaSolicitud.split('T')[0]}</span>
                        </div>
                        <div class="font-medium text-gray-800 text-sm truncate">${sol.actividad}</div>
                        <div class="text-xs text-gray-500 truncate">${sol.solicitante}</div>
                    `;
                    card.onclick = () => mostrarDetalle(sol);
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<div class="text-center text-gray-400 text-sm mt-4">No hay solicitudes pendientes.</div>';
            }
        })
        .catch(e => {
            container.innerHTML = '<div class="text-center text-red-400 text-sm mt-4">Error de conexión.</div>';
        });
}

// --- 2. MOSTRAR DETALLE ---
function mostrarDetalle(sol) {
    solicitudActual = sol;
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('panelDetalle').classList.remove('hidden');
    cerrarPanelResultados(); 

    // Llenar datos visuales
    document.getElementById('detFolio').textContent = sol.folio;
    document.getElementById('detActividad').textContent = sol.actividad;
    document.getElementById('detSolicitante').textContent = sol.solicitante;
    document.getElementById('detArea').textContent = sol.area;
    
    // NUEVO: Mostrar Modalidad
    const labelModalidad = document.getElementById('detModalidad');
    if (labelModalidad) labelModalidad.textContent = sol.modalidad || "No especificada";

    document.getElementById('detAforo').textContent = sol.aforo + ' Pax';
    document.getElementById('detFechas').textContent = formatearFecha(sol.fechaInicio) + ' al ' + formatearFecha(sol.fechaFin || sol.fechaInicio);
    document.getElementById('detHoras').textContent = sol.horaInicio + ' - ' + sol.horaFin;
    document.getElementById('detDias').textContent = 'Recurrencia: ' + sol.diasRecurrencia;
    document.getElementById('detRequerimientos').textContent = sol.requerimientos || 'Ninguno';
    document.getElementById('detFechaSol').textContent = 'Solicitado: ' + formatearFecha(sol.fechaSolicitud);

    // --- Lógica Virtual vs Presencial ---
    const btnBuscar = document.getElementById('btnBuscarDispo');
    const btnVirtualExistente = document.getElementById('btnVirtualAction');
    
    // Normalizamos el texto (quitamos espacios y mayusculas) para comparar seguro
    const modalidad = String(sol.modalidad).trim().toLowerCase();

    if (modalidad === 'virtual') {
        // ES VIRTUAL
        btnBuscar.style.display = 'none'; // Ocultar buscador de salas
        
        // Crear/Mostrar botón Zoom
        if (!btnVirtualExistente) {
            const btnVirtual = document.createElement('button');
            btnVirtual.id = 'btnVirtualAction';
            btnVirtual.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow mb-2 transition-all flex items-center justify-center gap-2';
            btnVirtual.innerHTML = '<span>📹 Generar Zoom y Aprobar</span>';
            btnVirtual.onclick = procesarVirtual;
            
            btnBuscar.parentNode.insertBefore(btnVirtual, btnBuscar);
        } else {
            btnVirtualExistente.style.display = 'block'; // Asegurar que sea visible
            // Reasignar onclick por si acaso
            btnVirtualExistente.onclick = procesarVirtual; 
        }

    } else {
        // ES PRESENCIAL O HÍBRIDO
        btnBuscar.style.display = 'flex'; // Mostrar buscador de salas
        if (btnVirtualExistente) btnVirtualExistente.style.display = 'none'; // Ocultar botón Zoom
    }
}
// --- 3. BUSCAR DISPONIBILIDAD ---
function buscarDisponibilidad() {
    if (!solicitudActual) return;

    const panelRes = document.getElementById('panelResultados');
    const listaRes = document.getElementById('listaResultados');
    const spinner = document.getElementById('spinnerResultados');

    panelRes.classList.remove('hidden', 'translate-x-full'); 
    panelRes.classList.add('translate-x-0');
    listaRes.innerHTML = '';
    spinner.classList.remove('hidden');

    // Limpieza de recurrencia
    let diasLimpios = "";
    if (solicitudActual.diasRecurrencia.includes('(')) {
        diasLimpios = solicitudActual.diasRecurrencia.match(/\(([^)]+)\)/)[1];
    }

    const payload = {
        action: 'checkAvailability',
        fechaInicio: formatearFechaISO(solicitudActual.fechaInicio),
        fechaFin: formatearFechaISO(solicitudActual.fechaFin || solicitudActual.fechaInicio),
        horaInicio: solicitudActual.horaInicio,
        horaFin: solicitudActual.horaFin,
        aforo: solicitudActual.aforo,
        dias: diasLimpios
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            spinner.classList.add('hidden');
            if (res.result === 'success') {
                renderizarResultados(res);
            } else {
                listaRes.innerHTML = `<div class="text-red-500 p-4">Error: ${res.error}</div>`;
            }
        })
        .catch(e => {
            spinner.classList.add('hidden');
            listaRes.innerHTML = `<div class="text-red-500 p-4">Error de conexión</div>`;
        });
}

function renderizarResultados(res) {
    const container = document.getElementById('listaResultados');

    // A. Disponibles
    if (res.disponibles.length > 0) {
        container.innerHTML += `<h4 class="text-xs font-bold text-green-700 uppercase mb-2">✅ Espacios Disponibles</h4>`;
        res.disponibles.forEach(esp => {
            container.innerHTML += `
                <div class="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm mb-3">
                    <div class="flex justify-between items-start">
                        <h5 class="font-bold text-gray-800">${esp.nombre}</h5>
                        <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Cap: ${esp.capacidad}</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">ID: ${esp.id}</p>
                    <button onclick="abrirModal('${esp.id}', '${esp.nombre}')" class="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded transition">
                        ASIGNAR ESTE ESPACIO
                    </button>
                </div>
            `;
        });
    } else {
        container.innerHTML += `<div class="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 mb-4">No hay espacios disponibles.</div>`;
    }

    // B. Ocupados
    // B. OCUPADOS (ROJOS)
    if (res.ocupados.length > 0) {
        container.innerHTML += `<h4 class="text-xs font-bold text-red-700 uppercase mb-2 mt-6">⛔ Con Conflictos o Llenos</h4>`;
        
        res.ocupados.forEach(esp => {
            const conflictosHtml = esp.conflictos.map(c => `<li class="text-xs text-red-500">• ${c}</li>`).join('');
            
            // Extracción inteligente: El backend manda "dd/MM/yyyy (Ocupado...)".
            // Necesitamos sacar solo la fecha "dd/MM/yyyy" para saber qué bloquear.
            // Creamos un array simple de fechas conflictivas.
            const fechasConflictivas = esp.conflictos.map(c => c.split(' ')[0]); 
            
            // Convertimos a string seguro para HTML
            const conflictosStr = JSON.stringify(fechasConflictivas).replace(/"/g, "&quot;");

            container.innerHTML += `
                <div class="bg-white p-4 rounded-lg border-l-4 border-red-400 shadow-sm mb-3 opacity-90">
                    <div class="flex justify-between items-start">
                        <h5 class="font-bold text-gray-700">${esp.nombre}</h5>
                        <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Cap: ${esp.capacidad}</span>
                    </div>
                    
                    <ul class="mt-2 pl-1 space-y-1 mb-3">
                        ${conflictosHtml}
                    </ul>

                    <button onclick="abrirModal('${esp.id}', '${esp.nombre}', ${conflictosStr})" class="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 rounded transition flex items-center justify-center gap-1">
                        <span>⚠️ GESTIONAR PARCIALMENTE</span>
                    </button>
                </div>
            `;
        });
    }
}

function cerrarPanelResultados() {
    const panel = document.getElementById('panelResultados');
    if(panel) {
        panel.classList.add('hidden', 'translate-x-full');
        panel.classList.remove('translate-x-0');
    }
}

// --- 4. MODAL DE ASIGNACIÓN ---

function abrirModal(idEspacio, nombreEspacio, conflictosArray = []) {
    espacioSeleccionadoID = idEspacio;
    document.getElementById('modalEspacioNombre').textContent = nombreEspacio;
    document.getElementById('modalFolio').textContent = solicitudActual.folio;

    // A. Checklist Fechas
    const containerFechas = document.getElementById('listaCheckFechas');
    containerFechas.innerHTML = '<div class="text-xs text-gray-400">Calculando fechas...</div>';
    
    const fechas = calcularFechasLocal(solicitudActual.fechaInicio, solicitudActual.fechaFin, solicitudActual.diasRecurrencia);
    containerFechas.innerHTML = '';

    // Mensaje de alerta si hay conflictos
    if (conflictosArray.length > 0) {
        const alerta = document.createElement('div');
        alerta.className = "col-span-2 bg-red-50 border border-red-100 text-red-600 text-[10px] p-2 rounded mb-2";
        alerta.innerHTML = `⚠️ <b>Atención:</b> Se han bloqueado automáticamente ${conflictosArray.length} días que coinciden con eventos existentes.`;
        containerFechas.appendChild(alerta);
    }
    
    fechas.forEach((fechaISO, index) => {
        const parts = fechaISO.split('-');
        const fechaVisual = `${parts[2]}/${parts[1]}/${parts[0]}`; // dd/MM/yyyy

        // Verificar si esta fecha es conflictiva
        // conflictosArray viene como ["31/12/2025", "01/01/2026"]
        const esConflictivo = conflictosArray.includes(fechaVisual);
        
        const div = document.createElement('div');
        div.className = `flex items-center ${esConflictivo ? 'opacity-50' : ''}`;
        
        // Si es conflictivo: disabled y NO checked
        // Si no: checked por defecto
        const estadoCheck = esConflictivo ? 'disabled' : 'checked';
        const estiloTexto = esConflictivo ? 'text-red-500 line-through' : 'text-gray-700';
        const textoExtra = esConflictivo ? '(Ocupado)' : '';

        div.innerHTML = `
            <input type="checkbox" name="fechasAssign" id="date_chk_${index}" value="${fechaISO}" ${estadoCheck} 
                class="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500 transition cursor-pointer">
            <label for="date_chk_${index}" class="ml-2 text-xs ${estiloTexto} font-medium cursor-pointer">
                ${fechaVisual} ${textoExtra}
            </label>
        `;
        containerFechas.appendChild(div);
    });

    // Contador y Eventos (Igual que antes)
    actualizarContadorDias(); 
    const checkboxesFechas = containerFechas.querySelectorAll('input[name="fechasAssign"]');
    checkboxesFechas.forEach(chk => {
        chk.addEventListener('change', actualizarContadorDias);
    });
    // ----------------------------------

    // B. Checklist Requerimientos (Sin cambios)
    const containerReq = document.getElementById('listaCheckRequerimientos');
    containerReq.innerHTML = '';
    if (solicitudActual.requerimientos && solicitudActual.requerimientos.length > 2) {
        const items = solicitudActual.requerimientos.split(',').map(s => s.trim());
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'flex items-center';
            div.innerHTML = `
                <input type="checkbox" id="req_chk_${index}" value="${item}" checked class="h-4 w-4 text-[#003C7D] rounded border-gray-300 focus:ring-[#003C7D]">
                <label for="req_chk_${index}" class="ml-2 text-sm text-gray-700">${item}</label>
            `;
            containerReq.appendChild(div);
        });
    } else {
        containerReq.innerHTML = '<p class="text-xs text-gray-400 italic">No se especificaron requerimientos.</p>';
    }

    document.getElementById('modalAsignacion').classList.remove('hidden');
}

// --- NUEVA FUNCIÓN HELPER PARA EL CONTADOR ---
function actualizarContadorDias() {
    const checkboxes = document.querySelectorAll('#listaCheckFechas input[name="fechasAssign"]');
    const total = checkboxes.length;
    const marcados = Array.from(checkboxes).filter(c => c.checked).length;
    
    const badge = document.getElementById('contadorDiasBadge');
    badge.textContent = `${marcados} de ${total} días`;
    
    // Cambio de color visual si no están todos marcados
    if (marcados < total) {
        badge.className = "bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full transition-all";
    } else {
        badge.className = "bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full transition-all";
    }
}

function cerrarModal() {
    document.getElementById('modalAsignacion').classList.add('hidden');
}

function procesarAsignacion() {
    const btn = document.getElementById('btnConfirmarAsignacion');
    btn.disabled = true;
    btn.textContent = "Procesando...";

    // Requerimientos
    const checkReqs = document.querySelectorAll('#listaCheckRequerimientos input[type="checkbox"]');
    const aprobados = [];
    const rechazados = [];
    checkReqs.forEach(cb => cb.checked ? aprobados.push(cb.value) : rechazados.push(cb.value));

    // Fechas
    const checkFechas = document.querySelectorAll('input[name="fechasAssign"]');
    const fechasAceptadas = [];
    checkFechas.forEach(cb => {
        if (cb.checked) fechasAceptadas.push(cb.value);
    });

    if (fechasAceptadas.length === 0) {
        alert("Debes seleccionar al menos una fecha para asignar.");
        btn.disabled = false;
        btn.textContent = "✅ Confirmar Asignación";
        return;
    }

    let diasLimpios = "";
    if (solicitudActual.diasRecurrencia.includes('(')) {
        diasLimpios = solicitudActual.diasRecurrencia.match(/\(([^)]+)\)/)[1];
    }

    const payload = {
        action: 'assignSpace',
        folio: solicitudActual.folio,
        idEspacio: espacioSeleccionadoID,
        reqAprobados: aprobados.join(', ') || 'Ninguno',
        reqRechazados: rechazados.join(', ') || 'Ninguno',
        fechaInicio: formatearFechaISO(solicitudActual.fechaInicio),
        fechaFin: formatearFechaISO(solicitudActual.fechaFin || solicitudActual.fechaInicio),
        diasRecurrencia: diasLimpios,
        horaInicio: solicitudActual.horaInicio,
        horaFin: solicitudActual.horaFin,
        actividadCorto: solicitudActual.actividad,
        fechasAprobadas: fechasAceptadas
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                alert(res.message);
                cerrarModal();
                cargarSolicitudes();
                document.getElementById('panelDetalle').classList.add('hidden');
                document.getElementById('panelResultados').classList.add('hidden');
                document.getElementById('emptyState').classList.remove('hidden');
            } else {
                alert("Error: " + res.error);
            }
        })
        .catch(e => alert("Error de conexión"))
        .finally(() => {
            btn.disabled = false;
            btn.textContent = "✅ Confirmar Asignación";
        });
}

// --- 5. RECHAZAR Y EDITAR ---

function abrirModalRechazo() {
    document.getElementById('modalRechazo').classList.remove('hidden');
}

function confirmarRechazo() {
    if (!confirm("¿Seguro que deseas rechazar esta solicitud?")) return;

    const motivo = document.getElementById('rechazoMotivo').value;
    const comentario = document.getElementById('rechazoComentario').value;

    const payload = {
        action: 'denyRequest',
        folio: solicitudActual.folio,
        motivo: motivo,
        comentarioAdicional: comentario
    };

    const modalContent = document.querySelector('#modalRechazo > div');
    const originalHTML = modalContent.innerHTML;
    modalContent.innerHTML = '<div class="text-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div><p class="mt-2 text-sm">Rechazando...</p></div>';

    enviarAccion(payload, () => {
        alert("Solicitud rechazada correctamente.");
        document.getElementById('modalRechazo').classList.add('hidden');
        modalContent.innerHTML = originalHTML;
        cargarSolicitudes();
        document.getElementById('panelDetalle').classList.add('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
    });
}

function abrirModalEdicion() {
    document.getElementById('editFechaInicio').value = formatearFechaISO(solicitudActual.fechaInicio);
    document.getElementById('editFechaFin').value = formatearFechaISO(solicitudActual.fechaFin || solicitudActual.fechaInicio);
    document.getElementById('editHoraInicio').value = solicitudActual.horaInicio;
    document.getElementById('editHoraFin').value = solicitudActual.horaFin;
    document.getElementById('editAforo').value = solicitudActual.aforo;

    let diasTexto = solicitudActual.diasRecurrencia;
    if (diasTexto.includes('(')) {
        diasTexto = diasTexto.match(/\(([^)]+)\)/)[1];
    } else if (diasTexto === 'NO') {
        diasTexto = ''; 
    }
    document.getElementById('editDias').value = diasTexto;
    document.getElementById('modalEdicion').classList.remove('hidden');
}

function guardarEdicion() {
    const nuevosDias = document.getElementById('editDias').value;
    const payload = {
        action: 'updateRequestDetails',
        folio: solicitudActual.folio,
        fechaInicio: document.getElementById('editFechaInicio').value,
        fechaFin: document.getElementById('editFechaFin').value,
        horaInicio: document.getElementById('editHoraInicio').value,
        horaFin: document.getElementById('editHoraFin').value,
        aforo: document.getElementById('editAforo').value,
        diasRecurrencia: nuevosDias
    };

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = "Guardando...";
    btn.disabled = true;

    enviarAccion(payload, () => {
        alert("Cambios guardados. Vuelve a buscar disponibilidad.");
        document.getElementById('modalEdicion').classList.add('hidden');
        btn.textContent = originalText;
        btn.disabled = false;
        cargarSolicitudes();
        document.getElementById('panelDetalle').classList.add('hidden');
    });
}


// --- LÓGICA VIRTUAL ---
function procesarVirtual() {
    if(!confirm(`¿Deseas aprobar el evento virtual "${solicitudActual.actividad}" y generar el enlace de Zoom?`)) return;

    const btn = document.getElementById('btnVirtualAction');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>🔄 Conectando con Zoom...</span>';

    const payload = {
        action: 'confirmVirtual',
        folio: solicitudActual.folio,
        actividad: solicitudActual.actividad,
        solicitante: solicitudActual.solicitante,
        area: solicitudActual.area,
        // Datos de fecha/hora para agendar en Zoom
        fechaInicio: formatearFechaISO(solicitudActual.fechaInicio),
        horaInicio: solicitudActual.horaInicio,
        horaFin: solicitudActual.horaFin
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                let msg = "¡Evento Virtual Aprobado!";
                if (res.link && res.link.startsWith('http')) {
                    msg += `\n\nEnlace generado: ${res.link}`;
                    // Opcional: Copiar al portapapeles
                    navigator.clipboard.writeText(res.link);
                    msg += "\n(Copiado al portapapeles)";
                } else {
                    msg += "\nNota: No se pudo generar el link automático (revisar credenciales), pero la solicitud fue aprobada.";
                }
                
                alert(msg);
                cargarSolicitudes(); // Recargar inbox
                document.getElementById('panelDetalle').classList.add('hidden');
                document.getElementById('emptyState').classList.remove('hidden');
            } else {
                alert("Error: " + res.error);
            }
        })
        .catch(e => alert("Error de conexión"))
        .finally(() => {
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
}

// --- HELPERS ---

function enviarAccion(payload, callbackSuccess) {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                callbackSuccess();
            } else {
                alert("Error del servidor: " + res.error);
            }
        })
        .catch(e => alert("Error de conexión"));
}

function formatearFecha(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoDate;
}

function formatearFechaISO(isoDate) {
    if (!isoDate) return '';
    return isoDate;
}

function calcularFechasLocal(inicio, fin, recurrenciaTexto) {
    const start = new Date(inicio + "T00:00:00");
    const end = new Date((fin || inicio) + "T00:00:00");
    const fechas = [];

    let diasDeseados = [0, 1, 2, 3, 4, 5, 6]; 
    if (recurrenciaTexto && recurrenciaTexto.includes('(')) {
        diasDeseados = [];
        const diasMap = { "dom": 0, "lun": 1, "mar": 2, "mié": 3, "mie": 3, "jue": 4, "vie": 5, "sáb": 6, "sab": 6 };
        const textoLimpio = recurrenciaTexto.toLowerCase();
        for (const [key, val] of Object.entries(diasMap)) {
            if (textoLimpio.includes(key)) diasDeseados.push(val);
        }
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (diasDeseados.includes(d.getDay())) {
            fechas.push(d.toISOString().split('T')[0]);
        }
    }
    if (fechas.length === 0) fechas.push(inicio);
    return fechas;
}