export function showToast(message, type = 'info') {
  if (!message) return;

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Prevent duplicate toast if an identical message is already visible
  const existingSpans = container.querySelectorAll('.toast span');
  for (const span of existingSpans) {
    if (span.textContent.trim() === message.trim()) {
      return;
    }
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.1rem;margin-left:0.5rem;" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 4000);
}

