// URL DE TU SCRIPT DE GOOGLE
const API_URL = 'https://script.google.com/macros/s/AKfycbx3TIV78su8GSkAmxq15Ozcz0l37jEN-u76zjYuVVZkbewnMyx8Qw--rwukOg617B_7DA/exec';

let solicitudActual = null;
let espacioSeleccionadoID = null;
let solicitudesCache = [];



// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    cargarSolicitudes();
    configurarEventosIniciales();
});

function configurarEventosIniciales() {
    // Botón Buscar Disponibilidad
    
    // Botón Confirmar Asignación (Modal)
    const btnConfirmar = document.getElementById('btnConfirmarAsignacion');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', procesarAsignacion);
    }
}



// --- 1. CARGAR SOLICITUDES ---
function cargarSolicitudes() {
    // LIMPIEZA DE UI AL RECARGAR
    limpiarPanelDetalle();

    const container = document.getElementById('listaSolicitudes');
    container.innerHTML = '<div class="text-center text-gray-400 text-sm mt-4">Cargando...</div>';

    const formData = new FormData();
    formData.append('data', JSON.stringify({ action: 'getSolicitudes', status: 'PENDIENTE' }));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            container.innerHTML = '';
            if (res.result === 'success' && res.data.length > 0) {
                
                // --- ORDENAMIENTO INTELIGENTE ---
                let listaOrdenada = res.data.sort((a, b) => {
                    // Extraer números y letras. Ej: E-25-2-A
                    // Regex para separar: (E-25)-(2)-?(A)?
                    const regex = /^E-\d{2}-(\d+)-?([A-Z])?$/;
                    
                    const matchA = a.folio.match(regex);
                    const matchB = b.folio.match(regex);

                    // Si alguno no cumple el formato estándar, orden simple por texto
                    if (!matchA || !matchB) return a.folio.localeCompare(b.folio);

                    const numA = parseInt(matchA[1], 10);
                    const numB = parseInt(matchB[1], 10);
                    const sufijoA = matchA[2] || ""; // Si no tiene letra, es vacío
                    const sufijoB = matchB[2] || "";

                    // 1. Comparar número principal (2 vs 10)
                    if (numA !== numB) {
                        return numA - numB; // Menor a mayor (2 va antes que 10)
                    }

                    // 2. Si son el mismo número (2 vs 2), comparar sufijo
                    // Queremos que el vacío (Padre) vaya antes que "A" (Hijo)
                    if (sufijoA === "" && sufijoB !== "") return -1; // Padre primero
                    if (sufijoA !== "" && sufijoB === "") return 1;  // Hijo después
                    
                    return sufijoA.localeCompare(sufijoB); // A antes que B
                });

                solicitudesCache = listaOrdenada; // GUARDAMOS LA LISTA YA ORDENADA
                filtrarSolicitudes(); 
            } else {
                // ... (resto igual)
                solicitudesCache = [];
                container.innerHTML = '<div class="text-center text-gray-400 text-sm mt-4">No hay solicitudes pendientes.</div>';
            }
        })
        .catch(e => {
            container.innerHTML = '<div class="text-center text-red-400 text-sm mt-4">Error de conexión.</div>';
        });
}

// --- NUEVO: FUNCIÓN DE FILTRADO ---
function filtrarSolicitudes() {
    const texto = document.getElementById('inputBusqueda').value.toLowerCase();
    const container = document.getElementById('listaSolicitudes');
    container.innerHTML = '';

    const filtradas = solicitudesCache.filter(sol => {
        // Buscamos coincidencia en varios campos
        return (
            sol.folio.toLowerCase().includes(texto) ||
            sol.solicitante.toLowerCase().includes(texto) ||
            sol.area.toLowerCase().includes(texto) ||
            sol.actividad.toLowerCase().includes(texto) ||
            (sol.fechaSolicitud && sol.fechaSolicitud.includes(texto))
        );
    });

    if (filtradas.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 text-sm mt-4">No se encontraron resultados.</div>';
        return;
    }

    filtradas.forEach(sol => {
        const card = document.createElement('div');
        card.className = 'bg-white p-3 rounded border border-gray-200 cursor-pointer card-hover transition-all';
        card.innerHTML = `
            <div class="flex justify-between mb-1">
                <span class="font-bold text-[#003C7D] text-sm">${sol.folio}</span>
                <span class="text-xs text-gray-400">${formatearFecha(sol.fechaSolicitud)}</span>
            </div>
            <div class="font-medium text-gray-800 text-sm truncate">${sol.actividad}</div>
            <div class="text-xs text-gray-500 truncate">${sol.solicitante}</div>
            <div class="text-[10px] text-blue-600 mt-1">${sol.area}</div>
        `;
        card.onclick = () => mostrarDetalle(sol);
        container.appendChild(card);
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
function buscarDisponibilidad(ignorarAforo = false) {
    if (!solicitudActual) return;

    const panelRes = document.getElementById('panelResultados');
    const listaRes = document.getElementById('listaResultados');
    const spinner = document.getElementById('spinnerResultados');

    panelRes.classList.remove('hidden', 'translate-x-full');
    panelRes.classList.add('translate-x-0');

    // Si es la primera búsqueda, limpiamos. Si es "ver todo", mostramos loading pero mantenemos estructura.
    listaRes.innerHTML = '';
    spinner.classList.remove('hidden');

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
        dias: diasLimpios,
        ignorarAforo: ignorarAforo // <--- ENVIAMOS LA ORDEN
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            spinner.classList.add('hidden');
            if (res.result === 'success') {
                renderizarResultados(res, ignorarAforo); // Pasamos el flag para saber qué botón mostrar
            } else {
                listaRes.innerHTML = `<div class="text-red-500 p-4">Error: ${res.error}</div>`;
            }
        })
        .catch(e => {
            spinner.classList.add('hidden');
            listaRes.innerHTML = `<div class="text-red-500 p-4">Error de conexión</div>`;
        });
}

function renderizarResultados(res, modoExtendido) {
    const container = document.getElementById('listaResultados');

    // Header informativo
    if (modoExtendido) {
        container.innerHTML += `<div class="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mb-4 border border-yellow-200">⚠️ Mostrando <b>TODOS</b> los espacios (sin restricciones de aforo mínimo/máximo).</div>`;
    }

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
    }

    // B. Ocupados (Código igual que antes...)
    if (res.ocupados.length > 0) {
        container.innerHTML += `<h4 class="text-xs font-bold text-red-700 uppercase mb-2 mt-6">⛔ Con Conflictos o Llenos</h4>`;
        res.ocupados.forEach(esp => {
            const conflictosHtml = esp.conflictos.map(c => `<li class="text-xs text-red-500">• ${c}</li>`).join('');
            const fechasConflictivas = esp.conflictos.map(c => c.split(' ')[0]);
            const conflictosStr = JSON.stringify(fechasConflictivas).replace(/"/g, "&quot;");

            container.innerHTML += `
                <div class="bg-white p-4 rounded-lg border-l-4 border-red-400 shadow-sm mb-3 opacity-90">
                    <div class="flex justify-between items-start">
                        <h5 class="font-bold text-gray-700">${esp.nombre}</h5>
                        <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Cap: ${esp.capacidad}</span>
                    </div>
                    <ul class="mt-2 pl-1 space-y-1 mb-3">${conflictosHtml}</ul>
                    <button onclick="abrirModal('${esp.id}', '${esp.nombre}', ${conflictosStr})" class="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 rounded transition flex items-center justify-center gap-1">
                        <span>⚠️ GESTIONAR PARCIALMENTE</span>
                    </button>
                </div>
            `;
        });
    }

    // --- NUEVO: BOTÓN "VER TODO" AL FINAL ---
    if (!modoExtendido) {
        container.innerHTML += `
            <div class="mt-8 pt-4 border-t border-gray-200 text-center">
                <p class="text-xs text-gray-500 mb-2">¿No encuentras el espacio adecuado?</p>
                <button onclick="buscarDisponibilidad(true)" class="text-blue-600 hover:text-blue-800 text-xs font-bold underline">
                    🔄 Calcular disponibilidad en TODOS los espacios (Ignorar aforo)
                </button>
            </div>
        `;
    }
}

function cerrarPanelResultados() {
    const panel = document.getElementById('panelResultados');
    if (panel) {
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
    if (!confirm(`¿Deseas aprobar el evento virtual "${solicitudActual.actividad}" y generar el enlace de Zoom?`)) return;

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
            if (btn) {
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

function limpiarPanelDetalle() {
    solicitudActual = null;
    document.getElementById('panelDetalle').classList.add('hidden');
    document.getElementById('panelResultados').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
    // Limpiar input de búsqueda si quieres, o dejarlo
}


// ==========================================
// LÓGICA DEL DASHBOARD / CALENDARIO
// ==========================================

let fechaActualCal = new Date();
let eventosCache = [];

// 1. CONTROL DE PESTAÑAS
function cambiarVista(vista) {
    const tabP = document.getElementById('tabPendientes');
    const tabD = document.getElementById('tabDashboard');
    const viewP = document.getElementById('vistaPendientes');
    const viewD = document.getElementById('vistaDashboard');

    if (vista === 'pendientes') {
        tabP.className = "px-4 py-2 text-sm font-bold text-[#003C7D] border-b-2 border-[#003C7D] transition-colors";
        tabD.className = "px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#003C7D] border-b-2 border-transparent transition-colors";
        viewP.classList.remove('hidden');
        viewD.classList.add('hidden');
        viewD.classList.remove('flex');
    } else {
        tabD.className = "px-4 py-2 text-sm font-bold text-[#003C7D] border-b-2 border-[#003C7D] transition-colors";
        tabP.className = "px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#003C7D] border-b-2 border-transparent transition-colors";
        viewD.classList.remove('hidden');
        viewD.classList.add('flex');
        viewP.classList.add('hidden');

        // Cargar datos del calendario si es la primera vez o para refrescar
        cargarAgendaBackend();
    }
}

// 2. CARGAR DATOS DEL MES ACTUAL
function cargarAgendaBackend() {
    const spinner = document.getElementById('gridCalendario');
    // Spinner bonito mientras carga
    spinner.innerHTML = '<div class="col-span-7 flex justify-center items-center h-64"><div class="flex flex-col items-center"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#003C7D] mb-2"></div><span class="text-xs text-gray-400">Cargando eventos...</span></div></div>';

    // Obtenemos mes y año de la variable global fechaActualCal
    const payload = {
        action: 'getAgenda',
        mes: fechaActualCal.getMonth(), // 0-11
        anio: fechaActualCal.getFullYear()
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                eventosCache = res.eventos; // Solo tenemos los de este mes en memoria
                llenarFiltroEspacios();
                renderizarCalendario(); // Pintamos
            } else {
                spinner.innerHTML = `<div class="col-span-7 text-center text-red-500 py-10">Error: ${res.error}</div>`;
            }
        })
        .catch(e => {
            console.error(e);
            spinner.innerHTML = `<div class="col-span-7 text-center text-red-500 py-10">Error de conexión</div>`;
        });
}

// 3. RENDERIZAR CALENDARIO
function renderizarCalendario() {
    const grid = document.getElementById('gridCalendario');
    grid.innerHTML = '';

    const year = fechaActualCal.getFullYear();
    const month = fechaActualCal.getMonth();

    // Actualizar título
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById('dashTituloMes').textContent = `${meses[month]} ${year}`;

    // Cálculos de días
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 (Dom) a 6 (Sab)

    // Filtros
    const espacioFiltro = document.getElementById('filtroEspacio').value;

    // Relleno días vacíos iniciales
    for (let i = 0; i < startDayOfWeek; i++) {
        const celda = document.createElement('div');
        celda.className = "bg-gray-50 border-b border-r border-gray-100 min-h-[100px]";
        grid.appendChild(celda);
    }

    // Días del mes
    for (let dia = 1; dia <= daysInMonth; dia++) {
        const celda = document.createElement('div');
        celda.className = "bg-white border-b border-r border-gray-200 p-1 min-h-[100px] relative hover:bg-gray-50 transition";

        // Número del día
        const num = document.createElement('div');
        num.className = "text-xs font-bold text-gray-500 mb-1 text-right pr-1";
        num.textContent = dia;
        celda.appendChild(num);

        // Buscar eventos para este día
        const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const eventosDia = eventosCache.filter(e => {
            if (e.fecha !== fechaStr) return false;
            if (espacioFiltro !== 'TODOS' && e.espacio !== espacioFiltro) return false;
            return true;
        });

        // Pintar eventos (Máximo 3 para no saturar, luego "+2 más")
        const maxDisplay = 3;
        eventosDia.slice(0, maxDisplay).forEach(evt => {
            const tag = document.createElement('div');

            let colorClass = "bg-blue-100 border-blue-200 text-blue-800"; // Default: APROBADO
            
            // Si tu backend enviara el estado:
            if (evt.estado === 'CONFIRMADO') {
                colorClass = "bg-green-100 border-green-200 text-green-800";
            }

            tag.className = `${colorClass} border text-[10px] rounded px-1 py-0.5 mb-1 truncate cursor-pointer hover:opacity-80 select-none`;
            tag.textContent = `${evt.horaInicio} ${evt.actividad}`;
            
            tag.onclick = (e) => {
                e.stopPropagation(); // Evitar click en la celda
                abrirModalEvento(evt);
            };
            celda.appendChild(tag);
        });

        if (eventosDia.length > maxDisplay) {
            const mas = document.createElement('div');
            mas.className = "text-[10px] text-gray-400 text-center cursor-pointer hover:text-gray-600";
            mas.textContent = `+${eventosDia.length - maxDisplay} más`;
            celda.appendChild(mas);
        }

        grid.appendChild(celda);
    }
}

// 4. NAVEGACIÓN
function cambiarMes(delta) {
    // 1. Cambiamos la fecha global
    fechaActualCal.setMonth(fechaActualCal.getMonth() + delta);

    // 2. Actualizamos el título inmediatamente para feedback visual
    const year = fechaActualCal.getFullYear();
    const month = fechaActualCal.getMonth();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById('dashTituloMes').textContent = `${meses[month]} ${year}`;

    // 3. PEDIMOS LOS DATOS NUEVOS AL SERVIDOR
    cargarAgendaBackend();
}

// 5. LLENAR SELECT DE ESPACIOS (Dinámico basado en lo que hay en la agenda)
function llenarFiltroEspacios() {
    const select = document.getElementById('filtroEspacio');
    // Guardar selección actual
    const actual = select.value;

    // Obtener únicos
    const espacios = [...new Set(eventosCache.map(e => e.espacio))].sort();

    // Limpiar (dejando el TODOS)
    select.innerHTML = '<option value="TODOS">Todos los Espacios</option>';

    espacios.forEach(esp => {
        const opt = document.createElement('option');
        opt.value = esp;
        opt.textContent = esp;
        select.appendChild(opt);
    });

    // Restaurar selección si existe
    if (espacios.includes(actual)) select.value = actual;
}

// 6. MODAL DETALLE
let eventoSeleccionado = null;

function abrirModalEvento(evt) {
    // 1. Guardamos el evento en la variable global para que las otras funciones (confirmar/reprogramar) sepan cuál es.
    eventoSeleccionado = evt;

    // 2. Llenamos los textos
    document.getElementById('evtTitulo').textContent = evt.actividad;
    document.getElementById('evtEspacio').textContent = evt.espacio;
    document.getElementById('evtFolio').textContent = "Folio: " + evt.folio;

    // 3. Formato fecha bonita
    const parts = evt.fecha.split('-'); // Asume YYYY-MM-DD
    document.getElementById('evtFecha').textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
    document.getElementById('evtHora').textContent = `${evt.horaInicio} - ${evt.horaFin}`;

    // --- ELIMINADO: Ya no configuramos el botón btnConfirmarEvento aquí ---
    // El botón en el HTML ya tiene onclick="mostrarOpcionesConfirmacion()"
    // y usa la variable 'eventoSeleccionado' que definimos arriba.

    // 4. Asegurar que el modal inicie en el estado visual correcto (botones normales visibles, confirmación oculta)
    document.getElementById('modalFooterNormal').classList.remove('hidden');
    document.getElementById('modalFooterConfirmacion').classList.add('hidden');
    document.getElementById('modalFooterLiberacion').classList.add('hidden'); // Nuevo

    document.getElementById('modalEvento').classList.remove('hidden');
}

function cerrarModalEvento() {
    document.getElementById('modalEvento').classList.add('hidden');
}

function procesarConfirmacionEvento(folio) {
    if(!confirm("¿Deseas confirmar este evento oficialmente?\n\nEsto cambiará su estado a CONFIRMADO en la base de datos.")) return;
    
    const btn = document.getElementById('btnConfirmarEvento');
    // Guardamos texto original para restaurar si falla
    const textoOriginal = btn.innerHTML;
    
    btn.innerHTML = "<span>⏳ Procesando...</span>";
    btn.disabled = true;

    const payload = {
        action: 'confirmEvent',
        folio: folio
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                alert(res.message);
                cerrarModalEvento();
                // Recargamos el calendario para reflejar cambios (si tuviéramos lógica de colores)
                cargarAgendaBackend(); 
            } else {
                alert("Error: " + res.error);
            }
        })
        .catch(e => {
            console.error(e);
            alert("Error de conexión al confirmar.");
        })
        .finally(() => {
            // Restaurar botón (por si el modal se vuelve a abrir sin recargar)
            if(btn) {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        });
}

// --- REPROGRAMACIÓN DE EVENTOS ---

function iniciarReprogramacion() {
    if (!eventoSeleccionado) return;
    
    // Detectamos si es un folio compuesto o padre potencial
    // Simplemente preguntamos siempre para mayor seguridad si el admin quiere barrido completo
    
    let modoFamilia = false;
    
    // Pregunta 1: Confirmación básica
    if (!confirm(`¿Deseas liberar la solicitud ${eventoSeleccionado.folio}? Se borrará de la agenda y pasará a PENDIENTE.`)) {
        return;
    }

    // Pregunta 2: ¿Cascada?
    // Solo preguntamos si el usuario quiere aplicar esto a toda la serie
    if (confirm("¿Deseas aplicar esto a TODA LA SERIE?\n\n[Aceptar] = Libera al padre y todos sus hijos (-A, -B...)\n[Cancelar] = Libera SOLO este día/folio específico.")) {
        modoFamilia = true;
    }

    // UI Feedback
    const btn = document.querySelector('#modalEvento button.text-blue-600');
    if(btn) btn.textContent = "Liberando...";

    const payload = {
        action: 'releaseRequest',
        folio: eventoSeleccionado.folio,
        familyMode: modoFamilia // <--- Enviamos la decisión
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                alert(res.message);
                cerrarModalEvento();
                
                // Recargamos vista
                cambiarVista('pendientes');
                document.getElementById('inputBusqueda').value = eventoSeleccionado.folio.split('-')[0] + "-" + eventoSeleccionado.folio.split('-')[1]; // Buscamos por la raíz E-25
                cargarSolicitudes(); 
            } else {
                alert("Error: " + res.error);
            }
        })
        .catch(e => alert("Error de conexión"))
        .finally(() => {
           if(btn) btn.textContent = "✏️ Modificar / Reprogramar";
        });
}

// --- LÓGICA DE CONFIRMACIÓN VISUAL ---

function mostrarOpcionesConfirmacion() {
    document.getElementById('modalFooterNormal').classList.add('hidden');
    document.getElementById('modalFooterConfirmacion').classList.remove('hidden');
}

function cancelarOpcionesConfirmacion() {
    document.getElementById('modalFooterConfirmacion').classList.add('hidden');
    document.getElementById('modalFooterNormal').classList.remove('hidden');
}

function mostrarOpcionesLiberacion() {
    document.getElementById('modalFooterNormal').classList.add('hidden');
    document.getElementById('modalFooterLiberacion').classList.remove('hidden');
}

function restaurarFooterNormal() {
    document.getElementById('modalFooterConfirmacion').classList.add('hidden');
    document.getElementById('modalFooterLiberacion').classList.add('hidden');
    document.getElementById('modalFooterNormal').classList.remove('hidden');
}

function ejecutarLiberacion(modoFamilia) {
    if (!eventoSeleccionado) return;

    // Feedback Visual
    const container = document.getElementById('modalFooterLiberacion');
    container.innerHTML = '<div class="text-center text-xs text-orange-800 font-bold py-2">⏳ Liberando y limpiando datos...</div>';

    const payload = {
        action: 'releaseRequest',
        folio: eventoSeleccionado.folio,
        familyMode: modoFamilia
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                // Éxito: Cerramos modal y vamos a pendientes
                cerrarModalEvento();
                alert(res.message); // Opcional, o usar un toast
                
                cambiarVista('pendientes');
                // Buscamos la raíz para que aparezca el padre
                const raizFolio = eventoSeleccionado.folio.split('-').slice(0, 3).join('-');
                document.getElementById('inputBusqueda').value = raizFolio;
                cargarSolicitudes();
            } else {
                alert("Error: " + res.error);
                cerrarModalEvento();
            }
        })
        .catch(e => {
            alert("Error de conexión");
            cerrarModalEvento();
        });
}

function ejecutarConfirmacion(modoFamilia) {
    if (!eventoSeleccionado) return;

    // Feedback visual inmediato
    const contenedorBtns = document.getElementById('modalFooterConfirmacion');
    contenedorBtns.innerHTML = '<div class="text-center text-xs text-green-800 font-bold py-2">⏳ Procesando confirmación...</div>';

    const payload = {
        action: 'confirmEvent',
        folio: eventoSeleccionado.folio,
        familyMode: modoFamilia // Enviamos la decisión (true/false)
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.json())
        .then(res => {
            if (res.result === 'success') {
                alert(res.message);
                cerrarModalEvento();
                cargarAgendaBackend(); // Recargar calendario para ver los verdes
            } else {
                alert("Error: " + res.error);
                // Restaurar botones si falló (recargando el modal básicamente o cerrándolo)
                cerrarModalEvento();
            }
        })
        .catch(e => {
            console.error(e);
            alert("Error de conexión");
            cerrarModalEvento();
        });
}

// Actualiza cerrarModalEvento para resetear la vista por si acaso
const originalCerrarModalEvento = cerrarModalEvento;
cerrarModalEvento = function() {
    // Ocultar el modal
    document.getElementById('modalEvento').classList.add('hidden');
    // Resetear la vista de los botones para la próxima vez
    setTimeout(() => {
        document.getElementById('modalFooterNormal').classList.remove('hidden');
        document.getElementById('modalFooterConfirmacion').classList.add('hidden');
        // Restaurar el contenido HTML original del footer de confirmación si se reemplazó por el loading
        // (Una forma fácil es recargar la página, pero para SPA simple, basta con asegurar que la estructura esté bien)
        // Como sobrescribimos el innerHTML con "Procesando...", lo ideal es recargar la página o reconstruir los botones.
        // TRUCO RÁPIDO: Reconstruir los botones en el HTML original o recargar si es necesario.
        // Pero para simplificar, si confirmas con éxito, el modal se cierra.
        // Si vuelves a abrir, necesitamos que los botones estén ahí.
        
        // RECONSTRUCCIÓN DE BOTONES (Para evitar que se quede el mensaje de "Procesando")
        document.getElementById('modalFooterConfirmacion').innerHTML = `
            <p class="text-xs text-green-800 font-bold mb-3 text-center">¿Deseas confirmar toda la serie de eventos?</p>
            <div class="flex gap-2 justify-center">
                <button onclick="ejecutarConfirmacion(false)" class="bg-white border border-green-600 text-green-700 hover:bg-green-50 text-xs font-bold py-2 px-3 rounded shadow-sm">
                    Solo este día
                </button>
                <button onclick="ejecutarConfirmacion(true)" class="bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2 px-3 rounded shadow-sm">
                    Confirmar TODOS
                </button>
                <button onclick="cancelarOpcionesConfirmacion()" class="text-gray-400 hover:text-gray-600 text-xs font-bold px-2">
                    Cancelar
                </button>
            </div>
        `;
    }, 300);
}