/**
 * Menu Injector - adds virtualiser toggle to conversation ellipsis menu
 */

window.VirtualiserInjector = {
  name: 'menu',

  // Inject menu item into the radix dropdown menu
  async injectMenuItem(menu) {
    const deleteItem = menu.querySelector('[data-testid="delete-chat-menu-item"]');
    if (!deleteItem) return;
    if (menu.querySelector('[data-testid="virtualiser-toggle"]')) return;

    const Storage = window.VirtualiserStorage;
    const UI = window.VirtualiserUI;
    const Icons = window.VirtualiserIcons;
    const Actions = window.VirtualiserActions;

    const isEnabled = await Storage.isEnabled();

    const menuItem = UI.createMenuItem(
      isEnabled ? Icons.show : Icons.hide,
      isEnabled ? 'Disable virtualisation' : 'Enable virtualisation',
      isEnabled ? Actions.disable : Actions.enable,
      'virtualiser-toggle'
    );

    menu.insertBefore(menuItem, deleteItem);
  },

  // Setup observer to watch for menu appearing
  setup() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const menu = node.querySelector?.('[data-radix-menu-content]') || 
                        (node.hasAttribute?.('data-radix-menu-content') ? node : null);
            
            if (menu) {
              setTimeout(() => this.injectMenuItem(menu), 10);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[Virtualiser] Menu injector ready');
    return observer;
  }
};
