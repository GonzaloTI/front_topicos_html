document.addEventListener('DOMContentLoaded', function() {

    // --- Autenticación y datos de usuario ---
    const usuario = localStorage.getItem("usuario");
    const registro = localStorage.getItem("registro");
    const token = localStorage.getItem("token");
    const statusContainer = document.getElementById('status-container');

    if (!token) {
        window.location.href = "/";
        return;
    }

    document.getElementById("nombreUsuario").textContent = usuario || '';

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "/";
    });

    // --- Funciones de Estado ---
    let statusTimeout; // Variable para controlar el temporizador del mensaje

    function setStatus(type, message, withSpinner = false) {
        clearTimeout(statusTimeout); // Limpia cualquier temporizador anterior
        statusContainer.className = 'alert'; // Resetea clases
        statusContainer.classList.add('d-block');
        
        let alertTypeClass = 'alert-secondary';
        if (type === 'processing') alertTypeClass = 'alert-info';
        else if (type === 'success') alertTypeClass = 'alert-success';
        else if (type === 'error') alertTypeClass = 'alert-danger';
        
        statusContainer.classList.add(alertTypeClass);

        statusContainer.innerHTML = withSpinner
            ? `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ${message}`
            : message;

        // Si no es un mensaje de 'procesando', lo ocultamos después de 4 segundos
        if (type !== 'processing') {
            statusTimeout = setTimeout(() => {
                clearStatus();
            }, 4000);
        }
    }

    function clearStatus() {
        statusContainer.className = 'alert d-none';
        statusContainer.textContent = '';
    }

    // --- Lógica Principal de la Página ---
    const periodo_id = 1;
    const tbody = document.querySelector("#grupos-table tbody");

    async function cargarGruposMateria() {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>`;
        
        try {
            const res = await fetch(`http://127.0.0.1:8000/gruposmateria`, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'No se pudieron cargar los grupos.');
            }

            const grupos = await res.json();
            tbody.innerHTML = ""; // Limpiar tabla

            if (grupos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay grupos disponibles.</td></tr>`;
                return;
            }

            grupos.forEach(g => {
                const horariosHtml = (g.horarios || []).map(horario => 
                    `${horario.dia || ''} de ${horario.hora_inicio || ''} a ${horario.hora_fin || ''}`
                ).join('<br>');

                const primerHorario = (g.horarios && g.horarios[0]) || {};
                const aulaInfo = primerHorario.aula || {};
                const cupoInsuficiente = (g.cupo ?? 0) <= 0;

                const tr = document.createElement("tr");
                if (cupoInsuficiente) tr.classList.add('opacity-low');

                tr.innerHTML = `
                    <td>${g.nombre || '-'}</td>
                    <td>${g.materia?.nombre || '-'}</td>
                    <td>${g.docente?.nombre || '-'}</td>
                    <td>${g.cupo ?? 0}</td>
                    <td>${aulaInfo.nombre || "-"}</td>
                    <td>${aulaInfo.numero || "-"}</td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input grupo-checkbox" value="${g.id}" ${cupoInsuficiente ? 'disabled' : ''}>
                    </td>`;
                
                const trHorario = document.createElement("tr");
                if (cupoInsuficiente) trHorario.classList.add('opacity-low');
                trHorario.innerHTML = `<td colspan="7" class="text-muted small ps-4"><em>Horario: ${horariosHtml || 'No definido'}</em></td>`;

                tbody.appendChild(tr);
                tbody.appendChild(trHorario);
            });
        } catch (err) {
            console.error(err);
            setStatus('error', err.message);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los grupos.</td></tr>`;
        }
    }

    async function inscribirMateriasSeleccionadas() {
        const inscribirBtn = document.getElementById('inscribirBtn');
        const btnText = inscribirBtn.querySelector('.btn-text');
        const btnSpin = inscribirBtn.querySelector('.btn-spinner');

        const checks = document.querySelectorAll('.grupo-checkbox:checked');
        const grupos_ids = Array.from(checks).map(cb => parseInt(cb.value, 10));
        
        if (grupos_ids.length === 0) {
            setStatus('secondary', "Selecciona al menos una materia.");
            return;
        }

        inscribirBtn.disabled = true;
        btnText.textContent = 'Procesando...';
        btnSpin.classList.remove('d-none');
        setStatus('processing', 'Enviando solicitud de inscripción...', true);

        const payload = { estudiante_registro: registro, periodo_id, grupos_ids };

        try {
            const res = await fetch(`http://127.0.0.1:8000/inscripcionmaterialistasync`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.detail || "Ocurrió un error en el servidor.");
            }

            setStatus('success', data.msg || 'Inscripción procesada con éxito.');
            // Desmarcamos los checkboxes para evitar doble envío
            checks.forEach(check => check.checked = false);
            // Recargamos la lista para actualizar los cupos
            setTimeout(cargarGruposMateria, 1500);

        } catch (err) {
            console.error(err);
            setStatus('error', `Error en la inscripción: ${err.message}`);
        } finally {
            inscribirBtn.disabled = false;
            btnText.textContent = 'Inscribir Materias Seleccionadas';
            btnSpin.classList.add('d-none');
        }
    }

    // --- Asignación de Eventos ---
    document.getElementById('inscribirBtn').addEventListener('click', inscribirMateriasSeleccionadas);
    document.getElementById('recargarBtn').addEventListener('click', cargarGruposMateria);

    // Carga inicial de datos al entrar a la página
    cargarGruposMateria();
});