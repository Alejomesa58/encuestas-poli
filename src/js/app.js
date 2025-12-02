// app.js
(function () {
  'use strict';

  const STORAGE_KEY_ENCUESTAS = 'encuestas_demo_v1';
  const STORAGE_KEY_RESPUESTAS = 'encuestas_respuestas_v1';

  // --------- Datos de ejemplo iniciales ---------

  const defaultEncuestas = [
    {
      id: generarId(),
      nombre: 'Satisfacción atención telefónica',
      canal: 'Web + WhatsApp',
      vigencia: '01/11/2025 - 30/11/2025',
      estado: 'Activa',
      preguntas: [
        { id: generarId(), texto: '¿Qué tan satisfecho(a) estás con la atención recibida?' },
        { id: generarId(), texto: '¿El asesor resolvió tu necesidad?' },
        { id: generarId(), texto: 'Comentarios adicionales' }
      ]
    },
    {
      id: generarId(),
      nombre: 'Satisfacción envío de productos',
      canal: 'Web',
      vigencia: '01/10/2025 - 31/10/2025',
      estado: 'Cerrada',
      preguntas: [
        { id: generarId(), texto: '¿Llegó el producto en buen estado?' },
        { id: generarId(), texto: '¿El tiempo de entrega fue adecuado?' }
      ]
    }
  ];

  function generarId() {
    // ID simple
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // --------- Encuestas ---------

  function cargarEncuestas() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ENCUESTAS);
      if (!raw) {
        const inicial = defaultEncuestas.map(e => ({
          ...e,
          preguntas: Array.isArray(e.preguntas) ? e.preguntas : []
        }));
        guardarEncuestas(inicial);
        return inicial;
      }
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) {
        const inicial = defaultEncuestas.map(e => ({
          ...e,
          preguntas: Array.isArray(e.preguntas) ? e.preguntas : []
        }));
        guardarEncuestas(inicial);
        return inicial;
      }
      return data.map(e => ({
        ...e,
        preguntas: Array.isArray(e.preguntas) ? e.preguntas : []
      }));
    } catch (e) {
      console.warn('No se pudieron cargar encuestas desde localStorage, usando valores por defecto.', e);
      const inicial = defaultEncuestas.map(e => ({
        ...e,
        preguntas: Array.isArray(e.preguntas) ? e.preguntas : []
      }));
      guardarEncuestas(inicial);
      return inicial;
    }
  }

  function guardarEncuestas(encuestas) {
    try {
      localStorage.setItem(STORAGE_KEY_ENCUESTAS, JSON.stringify(encuestas));
    } catch (e) {
      console.warn('No se pudieron guardar encuestas en localStorage.', e);
    }
  }

  // --------- Respuestas ---------

  function cargarRespuestas() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RESPUESTAS);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data;
    } catch (e) {
      console.warn('No se pudieron cargar respuestas desde localStorage.', e);
      return [];
    }
  }

  function guardarRespuestas(respuestas) {
    try {
      localStorage.setItem(STORAGE_KEY_RESPUESTAS, JSON.stringify(respuestas));
    } catch (e) {
      console.warn('No se pudieron guardar respuestas en localStorage.', e);
    }
  }

  // ======================================================
  //  ADMINISTRACIÓN DE ENCUESTAS + PREGUNTAS
  // ======================================================

  function initAdminPage() {
    const tbody = document.querySelector('#encuestas-tbody');
    const form = document.querySelector('#encuesta-form');
    const btnNueva = document.querySelector('#btn-nueva-encuesta');
    const btnCancelar = document.querySelector('#encuesta-cancelar');

    if (!tbody || !form || !btnNueva || !btnCancelar) {
      return;
    }

    const inputId = document.querySelector('#encuesta-id');
    const inputNombre = document.querySelector('#encuesta-nombre');
    const inputCanal = document.querySelector('#encuesta-canal');
    const inputVigencia = document.querySelector('#encuesta-vigencia');
    const inputEstado = document.querySelector('#encuesta-estado');

    const preguntasList = document.querySelector('#preguntas-list');
    const preguntasAyuda = document.querySelector('#preguntas-ayuda');
    const nuevaPreguntaInput = document.querySelector('#nueva-pregunta-texto');
    const nuevaPreguntaBtn = document.querySelector('#btn-agregar-pregunta');

    let encuestas = cargarEncuestas();
    renderTabla();
    renderPreguntas(null); // Sin encuesta seleccionada al inicio

    btnNueva.addEventListener('click', function (e) {
      e.preventDefault();
      limpiarFormulario();
      renderPreguntas(null);
      form.scrollIntoView({ behavior: 'smooth' });
      inputNombre.focus();
    });

    btnCancelar.addEventListener('click', function (e) {
      e.preventDefault();
      limpiarFormulario();
      renderPreguntas(null);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const id = inputId.value.trim();
      const nombre = inputNombre.value.trim();
      const canal = inputCanal.value;
      const vigencia = inputVigencia.value.trim();
      const estado = inputEstado.value;

      if (!nombre || !vigencia) {
        alert('Por favor completa el nombre y la vigencia.');
        return;
      }

      if (id) {
        // Editar
        const index = encuestas.findIndex(enc => enc.id === id);
        if (index !== -1) {
          encuestas[index] = {
            ...encuestas[index],
            nombre,
            canal,
            vigencia,
            estado
          };
        }
      } else {
        // Crear
        const nueva = {
          id: generarId(),
          nombre,
          canal,
          vigencia,
          estado,
          preguntas: [] // Nuevo array vacío de preguntas
        };
        encuestas.push(nueva);
      }

      guardarEncuestas(encuestas);
      renderTabla();
      limpiarFormulario();
      renderPreguntas(null);
    });

    // Delegación de eventos para botones de la tabla
    tbody.addEventListener('click', function (e) {
      const button = e.target.closest('button');
      if (!button) return;

      const accion = button.dataset.action;
      const fila = button.closest('tr');
      if (!fila) return;

      const id = fila.dataset.id;
      const encuesta = encuestas.find(enc => enc.id === id);
      if (!encuesta) return;

      if (accion === 'edit') {
        cargarEnFormulario(encuesta);
        renderPreguntas(encuesta);
      } else if (accion === 'duplicate') {
        const copia = {
          ...encuesta,
          id: generarId(),
          nombre: encuesta.nombre + ' (copia)',
          preguntas: Array.isArray(encuesta.preguntas)
            ? encuesta.preguntas.map(p => ({ ...p, id: generarId() }))
            : []
        };
        encuestas.push(copia);
        guardarEncuestas(encuestas);
        renderTabla();
      } else if (accion === 'delete') {
        const confirmar = window.confirm('¿Seguro que deseas eliminar esta encuesta?');
        if (!confirmar) return;
        encuestas = encuestas.filter(enc => enc.id !== id);
        guardarEncuestas(encuestas);
        renderTabla();

        if (inputId.value === id) {
          limpiarFormulario();
          renderPreguntas(null);
        }
      } else if (accion === 'whatsapp') {
        // Punto de integración futuro con WhatsApp
        mostrarInfoWhatsApp(encuesta);
      }
    });

    // Agregar nueva pregunta
    if (nuevaPreguntaBtn && nuevaPreguntaInput) {
      nuevaPreguntaBtn.addEventListener('click', function (e) {
        e.preventDefault();

        const encuestaId = inputId.value.trim();
        if (!encuestaId) {
          alert('Primero guarda la encuesta y luego haz clic en "Editar" para poder añadir preguntas.');
          return;
        }

        const texto = nuevaPreguntaInput.value.trim();
        if (!texto) {
          alert('Escribe el texto de la pregunta.');
          return;
        }

        const encuesta = encuestas.find(enc => enc.id === encuestaId);
        if (!encuesta) {
          alert('No se encontró la encuesta seleccionada.');
          return;
        }

        if (!Array.isArray(encuesta.preguntas)) {
          encuesta.preguntas = [];
        }

        encuesta.preguntas.push({
          id: generarId(),
          texto
        });

        guardarEncuestas(encuestas);
        nuevaPreguntaInput.value = '';
        renderPreguntas(encuesta);
      });
    }

    // Eliminar pregunta (delegación)
    if (preguntasList) {
      preguntasList.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-action="delete-question"]');
        if (!btn) return;

        const encuestaId = inputId.value.trim();
        const preguntaId = btn.dataset.idPregunta;
        if (!encuestaId || !preguntaId) return;

        const encuesta = encuestas.find(enc => enc.id === encuestaId);
        if (!encuesta || !Array.isArray(encuesta.preguntas)) return;

        encuesta.preguntas = encuesta.preguntas.filter(p => p.id !== preguntaId);
        guardarEncuestas(encuestas);
        renderPreguntas(encuesta);
      });
    }

    function renderTabla() {
      tbody.innerHTML = '';

      if (!encuestas.length) {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td colspan="5" class="text-center text-muted">
          No hay encuestas creadas aún.
        </td>`;
        tbody.appendChild(fila);
        return;
      }

      encuestas.forEach(encuesta => {
        const tr = document.createElement('tr');
        tr.dataset.id = encuesta.id;

        const badgeClass = encuesta.estado === 'Activa' ? 'bg-success' : 'bg-secondary';

        tr.innerHTML = `
          <td>${escapeHtml(encuesta.nombre)}</td>
          <td>${escapeHtml(encuesta.canal)}</td>
          <td>${escapeHtml(encuesta.vigencia)}</td>
          <td>
            <span class="badge ${badgeClass}">
              ${escapeHtml(encuesta.estado)}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-primary me-1" data-action="edit">Editar</button>
            <button class="btn btn-sm btn-outline-secondary me-1" data-action="duplicate">Duplicar</button>
            <button class="btn btn-sm btn-success me-1" data-action="whatsapp">WhatsApp (futuro)</button>
            <button class="btn btn-sm btn-danger" data-action="delete">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function cargarEnFormulario(encuesta) {
      inputId.value = encuesta.id;
      inputNombre.value = encuesta.nombre;
      inputCanal.value = encuesta.canal;
      inputVigencia.value = encuesta.vigencia;
      inputEstado.value = encuesta.estado;

      form.scrollIntoView({ behavior: 'smooth' });
      inputNombre.focus();
    }

    function limpiarFormulario() {
      inputId.value = '';
      form.reset();
      inputCanal.value = 'Web';
      inputEstado.value = 'Activa';
    }

    function renderPreguntas(encuesta) {
      if (!preguntasList || !nuevaPreguntaInput || !nuevaPreguntaBtn || !preguntasAyuda) return;

      preguntasList.innerHTML = '';

      if (!encuesta) {
        preguntasAyuda.textContent =
          'Para gestionar preguntas, guarda la encuesta y luego haz clic en "Editar" en la tabla inferior.';
        nuevaPreguntaInput.disabled = true;
        nuevaPreguntaBtn.disabled = true;

        const li = document.createElement('li');
        li.className = 'list-group-item text-muted';
        li.textContent = 'No hay encuesta seleccionada.';
        preguntasList.appendChild(li);
        return;
      }

      preguntasAyuda.textContent = `Preguntas de la encuesta: ${encuesta.nombre}`;
      nuevaPreguntaInput.disabled = false;
      nuevaPreguntaBtn.disabled = false;

      const preguntas = Array.isArray(encuesta.preguntas) ? encuesta.preguntas : [];

      if (!preguntas.length) {
        const li = document.createElement('li');
        li.className = 'list-group-item text-muted';
        li.textContent = 'Esta encuesta aún no tiene preguntas.';
        preguntasList.appendChild(li);
        return;
      }

      preguntas.forEach(p => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
          <span>${escapeHtml(p.texto)}</span>
          <button 
            class="btn btn-sm btn-outline-danger"
            data-action="delete-question"
            data-id-pregunta="${p.id}"
          >
            Eliminar
          </button>
        `;
        preguntasList.appendChild(li);
      });
    }

    function mostrarInfoWhatsApp(encuesta) {
      const baseUrl = 'https://mi-dominio.com/src/pages/responder.html';
      const linkEncuesta = `${baseUrl}?encuestaId=${encodeURIComponent(encuesta.id)}`;

      // Mensaje de ejemplo
      const mensaje = `Hola, te invitamos a responder la encuesta "${encuesta.nombre}". ` +
        `Puedes acceder al formulario en el siguiente enlace: ${linkEncuesta}`;

      alert(
        'SIMULACIÓN DE INTEGRACIÓN CON WHATSAPP\n\n' +
        'En el futuro, en este punto se llamaría a la API de WhatsApp Business ' +
        '(por ejemplo, WhatsApp Cloud API de Meta) para enviar el mensaje.\n\n' +
        'Ejemplo de mensaje que se enviaría:\n\n' +
        mensaje
      );
    }
  }

  // ======================================================
  //  RESPONDER ENCUESTA
  // ======================================================

  function initResponderPage() {
    const form = document.querySelector('#responder-encuesta-form');
    const mensaje = document.querySelector('#mensaje-exito');
    const titulo = document.querySelector('#titulo-encuesta');
    const descripcion = document.querySelector('#descripcion-encuesta');
    const inputEncuestaId = document.querySelector('#responder-encuesta-id');

    if (!form || !inputEncuestaId) return;

    const encuestas = cargarEncuestas();
    let encuestaSeleccionada = null;

    if (encuestas.length) {
      // Buscar encuesta por ID en query string
      encuestaSeleccionada = encuestas.find(e => e.estado === 'Activa') || encuestas[0];
    }

    if (encuestaSeleccionada) {
      if (titulo) titulo.textContent = encuestaSeleccionada.nombre;
      if (descripcion && !descripcion.textContent.trim()) {
        descripcion.textContent = 'Por favor responde esta encuesta para ayudarnos a mejorar.';
      }
      inputEncuestaId.value = encuestaSeleccionada.id;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const selectSatisfaccion = form.querySelector('select[name="satisfaccion"]');
      const radioResolvio = form.querySelector('input[name="resolvio"]:checked');
      const textareaComentarios = form.querySelector('textarea[name="comentarios"]');

      const satisfaccion = selectSatisfaccion ? selectSatisfaccion.value : '';
      const resolvio = radioResolvio ? radioResolvio.value : '';
      const comentarios = textareaComentarios ? textareaComentarios.value.trim() : '';
      const encuestaId = inputEncuestaId.value || (encuestaSeleccionada && encuestaSeleccionada.id) || 'sin-id';

      // Validaciones básicas
      let respuestas = cargarRespuestas();
      respuestas.push({
        id: generarId(),
        encuestaId,
        fecha: new Date().toISOString(),
        satisfaccion,
        resolvio,
        comentarios
      });
      guardarRespuestas(respuestas);

      if (mensaje) {
        mensaje.classList.remove('d-none');
        setTimeout(() => {
          mensaje.classList.add('d-none');
        }, 3000);
      } else {
        alert('¡Gracias por responder la encuesta!');
      }

      form.reset();
    });
  }

  // ======================================================
  //  REPORTES
  // ======================================================

  function initReportesPage() {
    const select = document.querySelector('#reporte-encuesta-select');
    const totalSpan = document.querySelector('#reporte-total-respuestas');
    const lista = document.querySelector('#reporte-lista-respuestas');
    const msgSinEncuestas = document.querySelector('#reporte-sin-encuestas');

    if (!select || !totalSpan || !lista) {
      return;
    }

    const encuestas = cargarEncuestas();
    const respuestas = cargarRespuestas();

    if (!encuestas.length) {
      if (msgSinEncuestas) msgSinEncuestas.classList.remove('d-none');
      select.disabled = true;
      totalSpan.textContent = '0';
      lista.innerHTML = `<li class="list-group-item text-muted">
        No hay encuestas registradas.
      </li>`;
      return;
    } else if (msgSinEncuestas) {
      msgSinEncuestas.classList.add('d-none');
    }

    // Llenar select de encuestas
    select.innerHTML = '';
    encuestas.forEach(encuesta => {
      const opt = document.createElement('option');
      opt.value = encuesta.id;
      opt.textContent = encuesta.nombre;
      select.appendChild(opt);
    });

    function renderReporte(encuestaId) {
      const respuestasEncuesta = respuestas.filter(r => r.encuestaId === encuestaId);

      totalSpan.textContent = String(respuestasEncuesta.length);
      lista.innerHTML = '';

      if (!respuestasEncuesta.length) {
        lista.innerHTML = `<li class="list-group-item text-muted">
          No hay respuestas para esta encuesta.
        </li>`;
        return;
      }

      const ultimas = respuestasEncuesta
        .slice()
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);

      ultimas.forEach(resp => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
          <strong>${escapeHtml(formatearFecha(resp.fecha))}</strong> - 
          ${escapeHtml(resp.satisfaccion || 'N/A')} 
          (${escapeHtml(resp.resolvio || 'N/A')})<br>
          <small>${escapeHtml(resp.comentarios || 'Sin comentarios')}</small>
        `;
        lista.appendChild(li);
      });
    }

    // Render inicial
    if (encuestas.length) {
      select.value = encuestas[0].id;
      renderReporte(encuestas[0].id);
    }

    select.addEventListener('change', function () {
      const encuestaId = select.value;
      renderReporte(encuestaId);
    });
  }

  // ======================================================
  //  UTILIDADES
  // ======================================================

  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatearFecha(fechaIso) {
    try {
      const d = new Date(fechaIso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString(); // Formato local
    } catch {
      return '';
    }
  }

  // ======================================================
  //  INICIALIZACIÓN GENERAL
  // ======================================================

  document.addEventListener('DOMContentLoaded', function () {
    initAdminPage();
    initResponderPage();
    initReportesPage();
  });

})();
