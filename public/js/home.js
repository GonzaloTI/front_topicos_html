document.addEventListener('DOMContentLoaded', function() {

  // --- Autenticación y datos de usuario ---
  const usuario  = localStorage.getItem("usuario");
  const registro = localStorage.getItem("registro");
  const token    = localStorage.getItem("token");

  if (!token) { 
    window.location.href = "/"; 
    return;
  } 
  
  document.getElementById("nombreUsuario").textContent = usuario || '';
  document.getElementById("registro").textContent = registro || '';

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear(); 
    window.location.href = "/";
  });

  // --- Lógica de la página ---
  const listaContainer = document.getElementById('lista-materias-inscritas');
  const horarioModal = new bootstrap.Modal(document.getElementById('horarioModal'));

async function cargarMateriasInscritas() {
    // La URL que me confirmaste que es la correcta
    const url = `http://127.0.0.1:8000/materiasxregistro?registro=${registro}`;
    
    listaContainer.innerHTML = `<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
    
    try {
        const res = await fetch(url, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || 'Error al cargar las materias');
        }
      
        const data = await res.json();
        
        // --- AQUÍ ESTÁ LA LÓGICA CLAVE ---
        // Convierte el objeto { "1": {...}, "2": {...} } en una lista [ {...}, {...} ]
        const materiasArray = Object.values(data);

        if (!Array.isArray(materiasArray)) {
            throw new Error("La respuesta del servidor no se pudo convertir en una lista.");
        }
        // --- FIN DE LA LÓGICA CLAVE ---
      
        listaContainer.innerHTML = ""; // Limpiar lista

        if (materiasArray.length === 0) {
            listaContainer.innerHTML = `<div class="alert alert-info">No tienes materias inscritas actualmente.</div>`;
            return;
        }

        // Ahora sí podemos usar forEach en la lista 'materiasArray'
        materiasArray.forEach(materia => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2';
            
            item.innerHTML = `
                <div>
                    <h6 class="mb-0">${materia.nombre || 'Sin nombre'} (${materia.sigla || 'N/A'})</h6>
                    <small class="text-muted">Docente: ${materia.docente || 'No asignado'}</small>
                </div>
                <button class="btn btn-secondary btn-sm ver-horario-btn">
                    <i class="bi bi-clock"></i> Ver horario y aula
                </button>
            `;

            const botonHorario = item.querySelector('.ver-horario-btn');
            botonHorario.dataset.materiaNombre = `${materia.nombre || ''} (${materia.sigla || ''})`;
            botonHorario.dataset.grupoNombre = materia.grupo || '-';
            botonHorario.dataset.horarioDias = materia.dias || 'No definido';
            botonHorario.dataset.horarioHoras = (materia.hora_inicio && materia.hora_fin) 
                ? `${materia.hora_inicio.substring(0,5)} - ${materia.hora_fin.substring(0,5)}` 
                : 'No definido';
            botonHorario.dataset.aulaNombre = materia.aula || '-';
            botonHorario.dataset.aulaModulo = materia.modulo || '-';
            
            listaContainer.appendChild(item);
        });

    } catch (err) {
        console.error(err);
        listaContainer.innerHTML = `<div class="alert alert-danger">${err.message || 'No se pudieron cargar tus materias.'}</div>`;
    }
}

  // Event listener para mostrar el modal con la info correcta
  listaContainer.addEventListener('click', function(event) {
    const boton = event.target.closest('.ver-horario-btn');
    if (boton) {
      document.getElementById('modal-materia-nombre').textContent = boton.dataset.materiaNombre;
      document.getElementById('modal-grupo-nombre').textContent = boton.dataset.grupoNombre;
      document.getElementById('modal-horario-dias').textContent = boton.dataset.horarioDias;
      document.getElementById('modal-horario-horas').textContent = boton.dataset.horarioHoras;
      document.getElementById('modal-aula-nombre').textContent = boton.dataset.aulaNombre;
      document.getElementById('modal-aula-modulo').textContent = boton.dataset.aulaModulo;
      horarioModal.show();
    }
  });

  document.getElementById('actualizarBtn').addEventListener('click', cargarMateriasInscritas);

  // Carga inicial
  cargarMateriasInscritas();
});