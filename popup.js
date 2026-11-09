// Cargar la configuración actual al abrir el popup
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({ source: 'en', target: 'es', mode: 'automatic' }, (items) => {
    document.getElementById('sourceLang').value = items.source;
    document.getElementById('targetLang').value = items.target;
    document.getElementById('mode').value = items.mode;
  });
});

// Guardar los cambios
document.getElementById('saveBtn').addEventListener('click', () => {
  const source = document.getElementById('sourceLang').value;
  const target = document.getElementById('targetLang').value;
  const mode = document.getElementById('mode').value;

  chrome.storage.sync.set({ source, target, mode }, () => {
    const btn = document.getElementById('saveBtn');
    btn.textContent = '¡Guardado!';
    setTimeout(() => {
      btn.textContent = 'Guardar';
    }, 1500);
  });
});