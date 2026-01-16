/**
 * Message count-based virtualisation strategy
 * Uses fixed message counts instead of viewport heights
 * Swap this file with virtualiser-pages.js in manifest.json
 */

window.Virtualiser = {
  // Number of messages to keep visible
  VISIBLE_COUNT: 20,
  // Number of messages to reveal per batch
  REVEAL_COUNT: 10,
  // Margin before viewport to trigger reveal (pixels)
  REVEAL_MARGIN: 200,

  intersectionObserver: null,
  isRevealing: false,

  // Get all message turn elements
  getMessages() {
    return document.querySelectorAll('article[data-turn-id]');
  },

  // Get hidden message elements
  getHiddenMessages() {
    return document.querySelectorAll('article[data-virtualiser-hidden="true"]');
  },

  // Apply virtualisation - hide messages beyond N count
  apply() {
    const messages = Array.from(this.getMessages());
    
    // console.log(`[Virtualiser:Messages] Found ${messages.length} messages`);
    
    // Keep the last VISIBLE_COUNT messages visible
    const visibleCount = Math.min(this.VISIBLE_COUNT, messages.length);
    
    // console.log(`[Virtualiser:Messages] Keeping ${visibleCount} messages (max: ${this.VISIBLE_COUNT})`);
    
    if (visibleCount >= messages.length) {
      // console.log(`[Virtualiser:Messages] All messages fit within limit, nothing to hide`);
      return;
    }

    window.VirtualiserUI.removePlaceholders();

    const hiddenCount = messages.length - visibleCount;
    const messagesToHide = messages.slice(0, hiddenCount);

    // console.log(`[Virtualiser:Messages] Hiding ${hiddenCount} messages`);

    messagesToHide.forEach(msg => {
      msg.style.display = 'none';
      msg.setAttribute('data-virtualiser-hidden', 'true');
    });

    if (hiddenCount > 0) {
      const firstVisible = messages[hiddenCount];
      window.VirtualiserUI.insertPlaceholder(firstVisible, hiddenCount, () => this.revealBatch());
      // console.log(`[Virtualiser:Messages] Placeholder inserted, ${hiddenCount} messages hidden`);
    }
  },

  // Reveal a batch of hidden messages
  revealBatch() {
    if (this.isRevealing) return;
    this.isRevealing = true;

    // Save scroll position before revealing
    const scrollY = window.scrollY;

    const hidden = Array.from(this.getHiddenMessages());
    if (hidden.length === 0) {
      this.isRevealing = false;
      window.VirtualiserUI.updatePlaceholder(0);
      this.stopObserver();
      return;
    }

    // Reveal REVEAL_COUNT messages from the end of hidden (closest to visible)
    const revealCount = Math.min(this.REVEAL_COUNT, hidden.length);
    const toReveal = hidden.slice(-revealCount);
    
    // console.log(`[Virtualiser:Messages] Revealing ${toReveal.length} messages (${hidden.length - toReveal.length} still hidden)`);

    toReveal.forEach(msg => {
      msg.style.display = '';
      msg.removeAttribute('data-virtualiser-hidden');
    });

    const remaining = hidden.length - toReveal.length;
    window.VirtualiserUI.updatePlaceholder(remaining);

    if (remaining > 0) {
      const placeholder = window.VirtualiserUI.getPlaceholder();
      if (placeholder && toReveal[0]) {
        toReveal[0].parentNode.insertBefore(placeholder, toReveal[0]);
      }
      this.reobservePlaceholder();
    } else {
      this.stopObserver();
    }

    // Restore scroll position to where it was before revealing
    window.scrollTo(0, scrollY);

    this.isRevealing = false;
  },

  // Reveal all hidden messages
  revealAll() {
    const hidden = this.getHiddenMessages();
    // console.log(`[Virtualiser:Messages] Revealing all ${hidden.length} hidden messages`);
    
    hidden.forEach(element => {
      element.style.display = '';
      element.removeAttribute('data-virtualiser-hidden');
    });

    window.VirtualiserUI.removePlaceholders();
  },

  // Setup IntersectionObserver for the placeholder
  startObserver() {
    this.stopObserver();

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.isRevealing) {
            // console.log('[Virtualiser:Messages] Placeholder intersecting, revealing batch');
            this.revealBatch();
          }
        }
      },
      {
        root: null,
        rootMargin: `${this.REVEAL_MARGIN}px 0px 0px 0px`,
        threshold: 0
      }
    );

    const placeholder = window.VirtualiserUI.getPlaceholder();
    if (placeholder) {
      this.intersectionObserver.observe(placeholder);
      // console.log('[Virtualiser:Messages] IntersectionObserver watching placeholder');
    }
  },

  // Stop IntersectionObserver
  stopObserver() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
      // console.log('[Virtualiser:Messages] IntersectionObserver disconnected');
    }
  },

  // Re-observe placeholder after it moves
  reobservePlaceholder() {
    const placeholder = window.VirtualiserUI.getPlaceholder();
    if (placeholder && this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver.observe(placeholder);
    }
  }
};
