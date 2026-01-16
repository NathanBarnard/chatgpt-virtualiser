/**
 * Shared actions for enable/disable virtualisation
 */

window.VirtualiserActions = {
  // Enable virtualisation for current conversation
  async enable() {
    const Storage = window.VirtualiserStorage;
    const UI = window.VirtualiserUI;
    const Core = window.Virtualiser;

    const convId = Storage.getConversationId();
    if (!convId) {
      UI.showToast('Cannot enable - no conversation ID found', 'error');
      return false;
    }

    await Storage.enable();
    Core.apply();
    Core.startObserver();
    UI.showToast('Virtualisation enabled', 'success');
    return true;
  },

  // Disable virtualisation for current conversation
  async disable() {
    const Storage = window.VirtualiserStorage;
    const UI = window.VirtualiserUI;
    const Core = window.Virtualiser;

    // Check if there are hidden messages
    const hiddenMessages = Core.getHiddenMessages();
    const hiddenCount = hiddenMessages.length;

    if (hiddenCount > 0) {
      // Show confirmation modal
      return new Promise((resolve) => {
        UI.showConfirmModal(
          `This will reveal <strong>${hiddenCount}</strong> hidden message${hiddenCount !== 1 ? 's' : ''}.`,
          async () => {
            // On confirm
            await Storage.disable();
            Core.revealAll();
            Core.stopObserver();
            UI.showToast('Virtualisation disabled', 'success');
            resolve(true);
          },
          () => {
            // On cancel
            resolve(false);
          }
        );
      });
    }

    // No hidden messages, just disable
    await Storage.disable();
    Core.revealAll();
    Core.stopObserver();
    UI.showToast('Virtualisation disabled', 'success');
    return true;
  }
};
