/**
 * Page-based virtualisation strategy
 * Uses viewport height and message heights to calculate "scroll pages"
 * Swap this file with virtualiser-messages.js in manifest.json
 */

window.Virtualiser = {
  // Number of viewport heights worth of content to keep visible
  VISIBLE_PAGES: 3,
  // Number of viewport heights worth of content to reveal per batch
  REVEAL_PAGES: 1,
  // Margin before viewport to trigger reveal (pixels)
  REVEAL_MARGIN: 200,

  intersectionObserver: null,
  isRevealing: false,

  // Get viewport height
  getViewportHeight() {
    return window.innerHeight;
  },

  // Get all message turn elements
  getMessages() {
    return document.querySelectorAll('article[data-turn-id]');
  },

  // Get hidden message elements
  getHiddenMessages() {
    return document.querySelectorAll('article[data-virtualiser-hidden="true"]');
  },

  // Calculate total height of an array of elements
  calculateTotalHeight(elements) {
    return elements.reduce((total, el) => {
      // Need to temporarily show hidden elements to measure
      const wasHidden = el.style.display === 'none';
      if (wasHidden) el.style.display = '';
      const height = el.getBoundingClientRect().height;
      if (wasHidden) el.style.display = 'none';
      return total + height;
    }, 0);
  },

  // Find how many messages from the end fill N viewport heights
  findMessagesForPages(messages, pages) {
    const targetHeight = this.getViewportHeight() * pages;
    let totalHeight = 0;
    let count = 0;

    // Start from the end (most recent) and work backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const height = messages[i].getBoundingClientRect().height;
      totalHeight += height;
      count++;
      
      if (totalHeight >= targetHeight) {
        break;
      }
    }

    return count;
  },

  // Apply virtualisation - hide messages beyond N scroll pages
  apply() {
    const messages = Array.from(this.getMessages());
    const viewportHeight = this.getViewportHeight();
    
    console.log(`[Virtualiser:Pages] Found ${messages.length} messages, viewport: ${viewportHeight}px`);
    
    // Calculate how many messages to keep visible
    const visibleCount = this.findMessagesForPages(messages, this.VISIBLE_PAGES);
    
    console.log(`[Virtualiser:Pages] Keeping ${visibleCount} messages (${this.VISIBLE_PAGES} pages worth)`);
    
    if (visibleCount >= messages.length) {
      console.log(`[Virtualiser:Pages] All messages fit in ${this.VISIBLE_PAGES} pages, nothing to hide`);
      return;
    }

    window.VirtualiserUI.removePlaceholders();

    const hiddenCount = messages.length - visibleCount;
    const messagesToHide = messages.slice(0, hiddenCount);

    const hiddenHeight = this.calculateTotalHeight(messagesToHide);
    console.log(`[Virtualiser:Pages] Hiding ${hiddenCount} messages (${Math.round(hiddenHeight)}px, ~${(hiddenHeight / viewportHeight).toFixed(1)} pages)`);

    messagesToHide.forEach(msg => {
      msg.style.display = 'none';
      msg.setAttribute('data-virtualiser-hidden', 'true');
    });

    if (hiddenCount > 0) {
      const firstVisible = messages[hiddenCount];
      window.VirtualiserUI.insertPlaceholder(firstVisible, hiddenCount, () => this.revealBatch());
      console.log(`[Virtualiser:Pages] Placeholder inserted, ${hiddenCount} messages hidden`);
    }
  },

  // Reveal a batch of hidden messages (1 page worth)
  revealBatch() {
    if (this.isRevealing) return;
    this.isRevealing = true;

    const hidden = Array.from(this.getHiddenMessages());
    if (hidden.length === 0) {
      this.isRevealing = false;
      window.VirtualiserUI.updatePlaceholder(0);
      this.stopObserver();
      return;
    }

    // Calculate how many messages make up 1 page, starting from the last hidden
    const targetHeight = this.getViewportHeight() * this.REVEAL_PAGES;
    let totalHeight = 0;
    let revealCount = 0;

    // Start from the last hidden message (closest to visible content)
    for (let i = hidden.length - 1; i >= 0; i--) {
      // Temporarily show to measure
      hidden[i].style.display = '';
      const height = hidden[i].getBoundingClientRect().height;
      hidden[i].style.display = 'none';
      
      totalHeight += height;
      revealCount++;
      
      if (totalHeight >= targetHeight) {
        break;
      }
    }

    // Reveal at least 1 message
    revealCount = Math.max(1, revealCount);
    const toReveal = hidden.slice(-revealCount);
    
    console.log(`[Virtualiser:Pages] Revealing ${toReveal.length} messages (~${this.REVEAL_PAGES} page, ${hidden.length - toReveal.length} still hidden)`);

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

    // Scroll to the bottom of the last revealed message (top of previously visible content)
    // This keeps the placeholder off-screen above
    const lastRevealed = toReveal[toReveal.length - 1];
    if (lastRevealed) {
      lastRevealed.scrollIntoView({ behavior: 'instant', block: 'end' });
      console.log('[Virtualiser:Pages] Scrolled to bottom of last revealed message');
    }

    this.isRevealing = false;
  },

  // Reveal all hidden messages
  revealAll() {
    const hidden = this.getHiddenMessages();
    console.log(`[Virtualiser:Pages] Revealing all ${hidden.length} hidden messages`);
    
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
            console.log('[Virtualiser:Pages] Placeholder intersecting, revealing batch');
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
      console.log('[Virtualiser:Pages] IntersectionObserver watching placeholder');
    }
  },

  // Stop IntersectionObserver
  stopObserver() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
      console.log('[Virtualiser:Pages] IntersectionObserver disconnected');
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
