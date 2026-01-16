/**
 * UI utilities - toasts, menu injection, placeholders
 */

window.VirtualiserUI = {
  // Show toast notification
  showToast(message, type = 'success') {
    const existing = document.querySelector('.virtualiser-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `virtualiser-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Create a menu item matching ChatGPT's style
  createMenuItem(icon, label, onClick, testId) {
    const item = document.createElement('div');
    item.setAttribute('role', 'menuitem');
    item.setAttribute('tabindex', '0');
    item.className = 'group __menu-item gap-1.5';
    item.setAttribute('data-orientation', 'vertical');
    item.setAttribute('data-radix-collection-item', '');
    if (testId) {
      item.setAttribute('data-testid', testId);
    }

    item.innerHTML = `
      <div class="flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon">
        ${icon}
      </div>
      ${label}
    `;

    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      setTimeout(onClick, 50);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });

    return item;
  },

  // Insert placeholder showing hidden message count
  insertPlaceholder(beforeElement, count, onReveal) {
    const placeholder = document.createElement('div');
    placeholder.className = 'virtualiser-hidden-placeholder';
    placeholder.setAttribute('data-hidden-count', count);
    placeholder.innerHTML = `
      ${window.VirtualiserIcons.expand}
      <span>${count} older message${count !== 1 ? 's' : ''} hidden — scroll up to reveal</span>
    `;

    placeholder.addEventListener('click', onReveal);
    beforeElement.parentNode.insertBefore(placeholder, beforeElement);
    return placeholder;
  },

  // Update placeholder count or remove if zero
  updatePlaceholder(count) {
    const placeholder = document.querySelector('.virtualiser-hidden-placeholder');
    if (!placeholder) return;

    if (count <= 0) {
      placeholder.remove();
      console.log('[Virtualiser] All messages revealed, placeholder removed');
    } else {
      placeholder.setAttribute('data-hidden-count', count);
      placeholder.querySelector('span').textContent = 
        `${count} older message${count !== 1 ? 's' : ''} hidden — scroll up to reveal`;
    }
  },

  // Remove all placeholders
  removePlaceholders() {
    document.querySelectorAll('.virtualiser-hidden-placeholder').forEach(p => p.remove());
  },

  // Get placeholder element
  getPlaceholder() {
    return document.querySelector('.virtualiser-hidden-placeholder');
  },

  // Show confirmation modal
  showConfirmModal(message, onConfirm, onCancel) {
    // Remove any existing modal
    const existing = document.querySelector('.virtualiser-modal-wrapper');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'virtualiser-modal-wrapper absolute inset-0';
    wrapper.innerHTML = `
      <div data-state="open" class="virtualiser-modal-backdrop fixed inset-0 z-50 before:absolute before:inset-0 before:bg-gray-200/50 before:backdrop-blur-[1px] dark:before:bg-black/50" style="pointer-events: auto;">
        <div class="z-50 h-full w-full overflow-y-auto grid grid-cols-[10px_1fr_10px] grid-rows-[minmax(10px,1fr)_auto_minmax(10px,1fr)] md:grid-rows-[minmax(20px,0.8fr)_auto_minmax(20px,1fr)]">
          <div role="dialog" data-state="open" class="virtualiser-modal popover bg-token-bg-primary relative col-auto col-start-2 row-auto row-start-2 h-full w-full text-start start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 rounded-2xl shadow-long flex flex-col focus:outline-hidden max-w-md overflow-hidden" tabindex="-1" style="pointer-events: auto;">
            <header class="min-h-header-height flex justify-between p-2.5 ps-4 select-none">
              <div class="flex max-w-full items-center">
                <div class="flex max-w-full min-w-0 grow flex-col">
                  <h2 class="text-token-text-primary text-lg font-normal">Reveal messages?</h2>
                </div>
              </div>
              <div class="flex h-[max-content] items-center gap-2"></div>
            </header>
            <div class="grow overflow-y-auto p-4 pt-1">
              ${message}
              <div class="text-token-text-tertiary mt-2 text-sm">This action is managed by the <strong>Virtualiser</strong> extension.</div>
              <div class="flex w-full flex-row items-center text-sm select-none justify-end">
                <div class="flex-0">
                  <div class="flex flex-col gap-3 sm:flex-row-reverse mt-5 sm:mt-4 flex w-full flex-row-reverse">
                    <button class="btn relative btn-primary virtualiser-confirm-btn" as="button">
                      <div class="flex items-center justify-center">Reveal All</div>
                    </button>
                    <button class="btn relative btn-secondary virtualiser-cancel-btn" as="button">
                      <div class="flex items-center justify-center">Cancel</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeModal = () => {
      wrapper.querySelector('.virtualiser-modal-backdrop').dataset.state = 'closed';
      setTimeout(() => wrapper.remove(), 200);
    };

    wrapper.querySelector('.virtualiser-cancel-btn').addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });

    wrapper.querySelector('.virtualiser-confirm-btn').addEventListener('click', () => {
      closeModal();
      if (onConfirm) onConfirm();
    });

    wrapper.querySelector('.virtualiser-modal-backdrop').addEventListener('click', (e) => {
      if (e.target.classList.contains('virtualiser-modal-backdrop')) {
        closeModal();
        if (onCancel) onCancel();
      }
    });

    document.body.appendChild(wrapper);
  }
};
