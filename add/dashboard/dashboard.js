document.addEventListener('DOMContentLoaded', () => {
    // URL de tu Google Apps Script (la misma que usas en tu otro panel)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4aIKStwstRyJs3Q3KO44myLzBKw-zIJbIIZrA2W5Ml__5y6WrAv-OZALTnuuNLWlhWg/exec';

    // --- ELEMENTOS DEL DOM ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const dashboardContainer = document.getElementById('dashboard-container');
    const noPendientesMsg = document.getElementById('no-pendientes');
    const sortSelect = document.getElementById('sort-select');

    // --- ESTADO DE LA APLICACIÓN ---
    let originalData = {}; // Almacenará los datos originales agrupados por persona

    /**
     * Función principal que se ejecuta al cargar la página para obtener los datos.
     */
    async function initDashboard() {
        showLoading(true);
        try {
            const formData = new FormData();
            formData.append('data', JSON.stringify({ action: 'getAllPendientes' }));

            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                originalData = result.data;
                // Renderizar la vista inicial agrupada por persona
                renderByPerson(originalData);
            } else {
                throw new Error(result.message || 'Error desconocido al cargar los datos.');
            }

        } catch (error) {
            console.error('Error al inicializar el dashboard:', error);
            dashboardContainer.innerHTML = `<p class="text-center text-red-500 font-semibold">No se pudieron cargar los datos. Error: ${error.message}</p>`;
        } finally {
            showLoading(false);
        }
    }

    /**
     * Renderiza los pendientes agrupados por persona.
     * @param {object} data - Los datos agrupados por persona.
     */
    function renderByPerson(data) {
        dashboardContainer.innerHTML = '';
        const people = Object.keys(data).sort(); // Ordenar nombres alfabéticamente

        if (people.length === 0) {
            noPendientesMsg.classList.remove('hidden');
            return;
        }
        noPendientesMsg.classList.add('hidden');

        people.forEach(person => {
            const tasks = data[person];
            const personSection = document.createElement('div');
            personSection.innerHTML = `
                <div class="flex items-center gap-3 mb-4">
                    <h2 class="text-2xl font-bold text-brand">${person}</h2>
                    <span class="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">${tasks.length} pendiente(s)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${tasks.map(task => createTaskCard(task)).join('')}
                </div>
            `;
            dashboardContainer.appendChild(personSection);
        });
    }

    /**
     * Renderiza todos los pendientes en una sola lista, ordenada por fecha.
     * @param {object} data - Los datos originales agrupados.
     * @param {'asc' | 'desc'} order - El orden ('asc' para antiguos, 'desc' para recientes).
     */
    function renderByDate(data, order = 'asc') {
        dashboardContainer.innerHTML = '';
        
        // 1. Aplanar los datos en un solo array de tareas
        let allTasks = [];
        for (const person in data) {
            data[person].forEach(task => {
                allTasks.push({ ...task, asignadoA: person }); // Añadir a quién está asignada
            });
        }
        
        if (allTasks.length === 0) {
            noPendientesMsg.classList.remove('hidden');
            return;
        }
        noPendientesMsg.classList.add('hidden');

        // 2. Ordenar el array por fecha
        allTasks.sort((a, b) => {
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // 3. Renderizar la lista
        const listContainer = document.createElement('div');
        listContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
        listContainer.innerHTML = allTasks.map(task => createTaskCard(task, true)).join('');
        dashboardContainer.appendChild(listContainer);
    }
    
    /**
     * Crea el HTML para una tarjeta de tarea individual.
     * @param {object} task - El objeto de la tarea.
     * @param {boolean} showOwner - Si es true, muestra a quién está asignada la tarea.
     * @returns {string} El string HTML de la tarjeta.
     */
    function createTaskCard(task, showOwner = false) {
        const fecha = new Date(task.fecha);
        const diasPasados = Math.floor((new Date() - fecha) / (1000 * 60 * 60 * 24));
        
        let borderColorClass = 'border-gray-300';
        if (diasPasados > 7) borderColorClass = 'border-red-500';
        else if (diasPasados > 3) borderColorClass = 'border-yellow-500';

        return `
            <div class="task-card bg-white rounded-lg shadow-md p-4 ${borderColorClass}">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-gray-800">${task.folio}</p>
                        <p class="text-sm text-gray-500">${task.solicitante}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-semibold text-gray-600">${fecha.toLocaleDateString('es-MX')}</p>
                        <p class="text-xs text-gray-500">Hace ${diasPasados} días</p>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-3 break-words">${task.descripcion.substring(0, 100)}${task.descripcion.length > 100 ? '...' : ''}</p>
                ${showOwner ? `<p class="text-xs font-semibold text-brand mt-3 pt-2 border-t">Asignado a: ${task.asignadoA}</p>` : ''}
            </div>
        `;
    }

    /**
     * Muestra u oculta el indicador de carga.
     * @param {boolean} isLoading - True para mostrar, false para ocultar.
     */
    function showLoading(isLoading) {
        loadingIndicator.classList.toggle('hidden', !isLoading);
        dashboardContainer.classList.toggle('hidden', isLoading);
    }

    // --- EVENT LISTENERS ---
    sortSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        switch (selectedValue) {
            case 'persona':
                renderByPerson(originalData);
                break;
            case 'antiguo':
                renderByDate(originalData, 'asc');
                break;
            case 'reciente':
                renderByDate(originalData, 'desc');
                break;
        }
    });

    // Iniciar la aplicación
    initDashboard();
});