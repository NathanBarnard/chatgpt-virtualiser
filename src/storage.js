/**
 * Storage utilities for managing enabled conversations
 */

window.VirtualiserStorage = {
  // Get current conversation ID from URL
  getConversationId() {
    const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  },

  // Get set of enabled conversation IDs
  async getEnabledConversations() {
    try {
      const result = await chrome.storage.local.get('virtualiser_enabled');
      return new Set(result.virtualiser_enabled || []);
    } catch (e) {
      console.error('[Virtualiser] Failed to load enabled conversations:', e);
      return new Set();
    }
  },

  // Save enabled conversation IDs
  async saveEnabledConversations(enabledSet) {
    try {
      await chrome.storage.local.set({ virtualiser_enabled: [...enabledSet] });
    } catch (e) {
      console.error('[Virtualiser] Failed to save enabled conversations:', e);
    }
  },

  // Check if current conversation has virtualisation enabled
  async isEnabled() {
    const convId = this.getConversationId();
    if (!convId) return false;
    const enabled = await this.getEnabledConversations();
    return enabled.has(convId);
  },

  // Enable for current conversation
  async enable() {
    const convId = this.getConversationId();
    if (!convId) return false;

    console.log(`[Virtualiser] Enabling for conversation: ${convId}`);
    const enabled = await this.getEnabledConversations();
    enabled.add(convId);
    await this.saveEnabledConversations(enabled);
    console.log(`[Virtualiser] Saved. Total enabled: ${enabled.size}`);
    return true;
  },

  // Disable for current conversation
  async disable() {
    const convId = this.getConversationId();
    if (!convId) return false;

    console.log(`[Virtualiser] Disabling for conversation: ${convId}`);
    const enabled = await this.getEnabledConversations();
    enabled.delete(convId);
    await this.saveEnabledConversations(enabled);
    console.log(`[Virtualiser] Saved. Total enabled: ${enabled.size}`);
    return true;
  }
};
