/**
 * Button Injector - adds virtualiser button to conversation header (next to Share)
 */

window.VirtualiserInjector = {
  name: 'button',
  observer: null,
  isInjecting: false,
  isLoading: true,

  // Create button by cloning the Share button
  createButton(isEnabled) {
    const Icons = window.VirtualiserIcons;
    const Actions = window.VirtualiserActions;

    // Find and clone the Share button
    const shareBtn = document.querySelector('[data-testid="share-chat-button"]');
    if (!shareBtn) {
      console.warn('[Virtualiser] Share button not found, cannot clone');
      return null;
    }

    const btn = shareBtn.cloneNode(true);
    
    // Update attributes
    btn.setAttribute('aria-label', isEnabled ? 'Disable virtualisation' : 'Enable virtualisation');
    btn.setAttribute('data-testid', 'virtualiser-button');
    btn.removeAttribute('style'); // Remove view-transition-name
    btn.disabled = this.isLoading;

    // Replace icon
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.outerHTML = isEnabled ? Icons.show : Icons.hide;
    }

    // Replace label text
    const inner = btn.querySelector('div');
    if (inner) {
      const label = this.isLoading ? 'Loading...' : (isEnabled ? 'Reveal' : 'Virtualise');
      inner.lastChild.textContent = label;
    }

    // Add click handler
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (this.isLoading) return;
      
      const wasEnabled = await window.VirtualiserStorage.isEnabled();
      if (wasEnabled) {
        await Actions.disable();
      } else {
        await Actions.enable();
      }
      
      this.updateButton(!wasEnabled);
    });

    return btn;
  },

  // Set loading state
  setLoading(loading) {
    this.isLoading = loading;
    const btn = document.querySelector('[data-testid="virtualiser-button"]');
    if (!btn) return;
    
    btn.disabled = loading;
    const inner = btn.querySelector('div');
    if (loading) {
      if (inner) inner.lastChild.textContent = 'Loading...';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.style.opacity = '';
      btn.style.cursor = '';
      this.refresh();
    }
    console.log(`[Virtualiser] Button loading: ${loading}`);
  },

  // Update existing button state
  updateButton(isEnabled) {
    const btn = document.querySelector('[data-testid="virtualiser-button"]');
    if (!btn) return;

    const Icons = window.VirtualiserIcons;
    btn.setAttribute('aria-label', isEnabled ? 'Disable virtualisation' : 'Enable virtualisation');
    
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.outerHTML = isEnabled ? Icons.show : Icons.hide;
    }
    
    const inner = btn.querySelector('div');
    if (inner) {
      inner.lastChild.textContent = isEnabled ? 'Reduce Lag: On' : 'Reduce Lag: Off';
    }
  },

  // Inject button as a fixed overlay (completely outside React's DOM tree)
  injectButton() {
    // Prevent race conditions
    if (this.isInjecting) return;
    if (document.querySelector('.virtualiser-btn-container')) return;
    
    const headerActions = document.getElementById('conversation-header-actions');
    if (!headerActions) return;
    
    // Need Share button to clone from
    const shareBtn = document.querySelector('[data-testid="share-chat-button"]');
    if (!shareBtn) return;

    this.isInjecting = true;
    
    // Create button immediately in loading state (isEnabled=false as placeholder)
    const btn = this.createButton(false);
    if (!btn) {
      this.isInjecting = false;
      return;
    }
    
    // Create container appended to body (outside React tree entirely)
    const container = document.createElement('div');
    container.className = 'virtualiser-btn-container';
    container.appendChild(btn);
    
    // Append to body - completely outside React's managed DOM
    document.body.appendChild(container);
    
    // Position it relative to header
    this.positionButton();
    console.log('[Virtualiser] Header button injected');
    
    this.isInjecting = false;
  },

  // Position the button container relative to header actions
  positionButton() {
    const container = document.querySelector('.virtualiser-btn-container');
    const headerActions = document.getElementById('conversation-header-actions');
    
    if (!container || !headerActions) return;
    
    const rect = headerActions.getBoundingClientRect();
    container.style.position = 'fixed';
    container.style.top = `${rect.top}px`;
    container.style.right = `${window.innerWidth - rect.left + 8}px`;
    container.style.zIndex = '10';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.height = `${rect.height}px`;
  },

  // Setup observer to watch for Share button appearing
  setup() {
    // Try to inject immediately
    this.injectButton();

    // Watch for Share button to appear (SPA navigation)
    this.observer = new MutationObserver(() => {
      const shareBtn = document.querySelector('[data-testid="share-chat-button"]');
      const existingContainer = document.querySelector('.virtualiser-btn-container');
      
      if (shareBtn && !existingContainer) {
        this.injectButton();
      } else if (shareBtn && existingContainer) {
        // Reposition if header moved
        this.positionButton();
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
    
    // Reposition on scroll/resize
    window.addEventListener('resize', () => this.positionButton());
    window.addEventListener('scroll', () => this.positionButton(), true);
    
    console.log('[Virtualiser] Button injector ready');
    return this.observer;
  },

  // Refresh button state (called after navigation)
  async refresh() {
    const isEnabled = await window.VirtualiserStorage.isEnabled();
    this.updateButton(isEnabled);
  }
};
