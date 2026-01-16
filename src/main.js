/**
 * ChatGPT Conversation Virtualiser
 * Main entry point - initialization and event handling
 */

(function () {
  'use strict';

  const Storage = window.VirtualiserStorage;
  const Core = window.Virtualiser;
  const Injector = window.VirtualiserInjector;

  // Wait for messages to appear, then run callback
  function waitForMessages(callback, maxWaitMs = 15000) {
    const startTime = Date.now();
    
    const check = () => {
      const messages = Core.getMessages();
      const elapsed = Date.now() - startTime;
      
      if (messages.length > 0) {
        console.log(`[Virtualiser] Messages appeared after ${elapsed}ms`);
        callback();
      } else if (elapsed < maxWaitMs) {
        setTimeout(check, 200);
      } else {
        console.log(`[Virtualiser] Timeout waiting for messages after ${maxWaitMs}ms`);
      }
    };
    
    check();
  }

  // Wait for page to be ready and apply virtualisation if enabled
  async function onPageReady() {
    const enabled = await Storage.isEnabled();
    console.log(`[Virtualiser] Virtualisation enabled: ${enabled}`);
    
    if (enabled) {
      Core.apply();
      Core.startObserver();
    }
    
    // Enable the button now that page is ready
    if (Injector.setLoading) {
      Injector.setLoading(false);
    }
  }

  // Initialize
  async function init() {
    const convId = Storage.getConversationId();
    console.log(`[Virtualiser] Initializing for conversation: ${convId || '(none)'}`);
    console.log(`[Virtualiser] Using ${Injector.name} injector`);
    
    // Setup the UI injector (menu or button) - starts in loading state
    Injector.setup();

    // Wait for messages to load, then enable button
    console.log('[Virtualiser] Waiting for messages to load...');
    waitForMessages(onPageReady);

    console.log('[Virtualiser] Initialized');
  }

  // Handle URL changes
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(async () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const convId = Storage.getConversationId();
      console.log(`[Virtualiser] URL changed: ${convId || '(none)'}`);

      // Set loading state during navigation
      if (Injector.setLoading) {
        Injector.setLoading(true);
      }

      // Cleanup previous conversation
      Core.stopObserver();
      Core.revealAll();

      // Wait for messages and apply
      console.log('[Virtualiser] Waiting for messages to load...');
      waitForMessages(onPageReady);
    }
  });

  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
