// Variable para guardar el popup flotante
let popupDiv = null;
let textoSeleccionadoActual = '';
let posicionPopupActual = null;

// Función para crear o reutilizar el popup flotante
function crearPopup(textoTRL, x, y) {
  if (!popupDiv) {
    popupDiv = document.createElement('div');
    document.body.appendChild(popupDiv);
  }

  popupDiv.style.position = 'absolute';
  popupDiv.style.backgroundColor = '#1e293b';
  popupDiv.style.color = '#ffffff';
  popupDiv.style.padding = '8px 12px';
  popupDiv.style.borderRadius = '6px';
  popupDiv.style.fontSize = '14px';
  popupDiv.style.zIndex = '999999';
  popupDiv.style.boxShadow = '0px 4px 10px rgba(0,0,0,0.3)';
  popupDiv.style.pointerEvents = 'none';
  popupDiv.replaceChildren();
  popupDiv.textContent = `"${textoTRL}"`;
  // Posicionarlo justo arriba del texto seleccionado
  popupDiv.style.left = `${x}px`;
  popupDiv.style.top = `${y - 45}px`;
  popupDiv.style.display = 'block';
}

function mostrarIconoTraducir(x, y) {
  if (!popupDiv) {
    popupDiv = document.createElement('div');
    popupDiv.style.position = 'absolute';
    popupDiv.style.zIndex = '999999';
    document.body.appendChild(popupDiv);
  }

  popupDiv.replaceChildren();
  popupDiv.style.left = `${x}px`;
  popupDiv.style.top = `${y - 45}px`;
  popupDiv.style.display = 'block';
  popupDiv.style.pointerEvents = 'auto';

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.setAttribute('aria-label', 'Traducir selección');
  boton.title = 'Traducir selección';
  boton.style.cssText = 'display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:4px;border:0;border-radius:6px;background:#1e293b;box-shadow:0 4px 10px rgba(0,0,0,.3);cursor:pointer';

  const icono = document.createElement('img');
  icono.src = chrome.runtime.getURL('icon.png');
  icono.alt = '';
  icono.style.cssText = 'width:26px;height:26px;object-fit:contain';
  boton.appendChild(icono);
  boton.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  boton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    traducirSeleccionActual();
  });
  popupDiv.appendChild(boton);
}

function ocultarPopup() {
  if (popupDiv) {
    popupDiv.style.display = 'none';
  }
}

async function traducirSeleccionActual() {
  if (!textoSeleccionadoActual || !posicionPopupActual) {
    return;
  }

  const texto = textoSeleccionadoActual;
  const { x, y } = posicionPopupActual;
  popupDiv.style.pointerEvents = 'none';
  crearPopup('Traduciendo...', x, y);

  chrome.storage.sync.get({ source: 'en', target: 'es' }, async (items) => {
    const resultadoTraduccion = await traducirTexto(texto, items.source, items.target);
    crearPopup(resultadoTraduccion, x, y);
  });
}

// Función para traducir texto usando el servicio gratuito de Google Translate (ahora acepta source y target)
async function traducirTexto(texto, source, target) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(texto)}`;
    
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    
    // El API devuelve un arreglo complejo; las oraciones traducidas están en datos[0]
    let textoTRL = "";
    if (datos && datos[0]) {
      datos[0].forEach(item => {
        if (item[0]) textoTRL += item[0];
      });
    }
    
    return textoTRL || texto; // Si falla, devuelve el original por seguridad
  } catch (error) {
    console.error("Error al traducir:", error);
    return "Error de traducción";
  }
}

// Escuchar cuando el usuario termina de seleccionar texto (mouse up)
document.addEventListener('mouseup', () => {
  const seleccion = window.getSelection();
  const textoSeleccionado = seleccion ? seleccion.toString().trim() : '';

  if (textoSeleccionado.length > 0) {
    const range = seleccion.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const x = rect.left + window.scrollX + (rect.width / 2);
    const y = rect.top + window.scrollY;

    chrome.storage.sync.get({ mode: 'automatic', source: 'en', target: 'es' }, async (items) => {
      if (items.mode === 'off') {
        textoSeleccionadoActual = '';
        posicionPopupActual = null;
        ocultarPopup();
        return;
      }

      textoSeleccionadoActual = textoSeleccionado;
      posicionPopupActual = { x, y };

      if (items.mode === 'click') {
        mostrarIconoTraducir(x, y);
        return;
      }

      // Mostrar un estado de "Cargando..." mientras se conecta al traductor
      crearPopup('Traduciendo...', x, y);
      const resultadoTraduccion = await traducirTexto(textoSeleccionado, items.source, items.target);
      // Actualizar el popup con el resultado final ya traducido
      crearPopup(resultadoTraduccion, x, y);
    });
  } else {
    // Si hace clic en otro lado sin seleccionar nada, ocultar el popup
    textoSeleccionadoActual = '';
    posicionPopupActual = null;
    ocultarPopup();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.mode && changes.mode.newValue === 'off') {
    textoSeleccionadoActual = '';
    posicionPopupActual = null;
    ocultarPopup();
  }
});