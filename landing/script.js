// website/landing/script.js — Persist landing page interactions

(function () {
  'use strict';

  // ── Nav scroll effect ────────────────────────────────────────────────────────

  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // ── Mobile hamburger ─────────────────────────────────────────────────────────

  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  }

  // ── Intersection observer — fade-in ──────────────────────────────────────────

  const fadeEls = document.querySelectorAll(
    '.feature-card, .step, .pricing-card, .faq-item'
  );

  fadeEls.forEach((el) => el.classList.add('fade-in'));

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  fadeEls.forEach((el) => fadeObserver.observe(el));

  // ── Smooth-scroll for anchor links ───────────────────────────────────────────

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Demo animation ───────────────────────────────────────────────────────────

  const demo = {
    phase: 0,
    timer: null,
    PHASE_DURATION: 3200,  // ms per phase

    phases: [
      {
        label: 'Upload PDF to Claude',
        fn: 'phaseUpload',
      },
      {
        label: 'Persist loads memory',
        fn: 'phaseMemoryLoaded',
      },
      {
        label: 'Context injected',
        fn: 'phaseContextInjected',
      },
      {
        label: 'Conversation captured',
        fn: 'phaseConversation',
      },
      {
        label: 'Memory saved to PDF',
        fn: 'phaseSaved',
      },
    ],

    els: {
      messages:      document.getElementById('demo-messages'),
      attachment:    document.getElementById('demo-attachment'),
      attachName:    document.getElementById('demo-attachment-name'),
      input:         document.getElementById('demo-input'),
      sendBtn:       document.getElementById('demo-send-btn'),
      badge:         document.getElementById('demo-badge'),
      badgeDot:      document.getElementById('demo-badge-dot'),
      badgeLabel:    document.getElementById('demo-badge-label'),
      badgeStatus:   document.getElementById('demo-badge-status'),
      badgeStats:    document.getElementById('demo-badge-stats'),
      saveBtn:       document.getElementById('demo-save-btn'),
      phaseDots:     document.querySelectorAll('.demo-phase-dot'),
      phaseLabel:    document.getElementById('demo-phase-label'),
    },

    init() {
      if (!this.els.messages) return;
      // Allow manual phase navigation via dots
      this.els.phaseDots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          clearTimeout(this.timer);
          this.goToPhase(i);
          this.scheduleNext();
        });
      });
      this.goToPhase(0);
      this.scheduleNext();
    },

    scheduleNext() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        const next = (this.phase + 1) % this.phases.length;
        this.goToPhase(next);
        this.scheduleNext();
      }, this.PHASE_DURATION);
    },

    goToPhase(index) {
      this.phase = index;
      this.updatePhaseDots();
      this.els.phaseLabel.textContent = this.phases[index].label;
      this[this.phases[index].fn]();
    },

    updatePhaseDots() {
      this.els.phaseDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === this.phase);
      });
    },

    // Helpers
    clearMessages() {
      this.els.messages.innerHTML = '';
    },

    addMessage(role, text, delay = 0) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = `demo-msg demo-msg-${role}`;
          el.textContent = text;
          this.els.messages.appendChild(el);
          // Trigger animation
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.classList.add('visible');
            });
          });
          resolve();
        }, delay);
      });
    },

    addContext(text, delay = 0) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'demo-msg demo-msg-context';
          el.textContent = text;
          this.els.messages.appendChild(el);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => el.classList.add('visible'));
          });
          resolve();
        }, delay);
      });
    },

    setInput(text) {
      this.els.input.textContent = text;
    },

    setBadge({ dot = 'blue', label, status, stats = '', showSave = false, saveState = '' }) {
      this.els.badgeDot.className = `demo-badge-dot${dot === 'green' ? ' green' : ''}`;
      this.els.badgeLabel.textContent = label;
      this.els.badgeStatus.textContent = status;
      this.els.badgeStats.textContent = stats;
      this.els.saveBtn.style.display = showSave ? 'block' : 'none';
      this.els.saveBtn.className = 'demo-save-btn' + (saveState ? ` ${saveState}` : '');
      if (saveState === 'saving') {
        this.els.saveBtn.textContent = 'Saving...';
      } else if (saveState === 'saved') {
        this.els.saveBtn.textContent = '✓ Saved!';
      } else {
        this.els.saveBtn.textContent = 'Save Memory';
      }
    },

    showBadge(visible) {
      this.els.badge.classList.toggle('visible', visible);
    },

    showAttachment(visible, name = 'research.pdf') {
      this.els.attachName.textContent = name;
      this.els.attachment.classList.toggle('visible', visible);
      this.els.sendBtn.classList.toggle('visible', visible);
    },

    // ── Phase implementations ──────────────────────────────────────────────────

    phaseUpload() {
      this.clearMessages();
      this.setInput('');
      this.showAttachment(false);
      this.showBadge(false);
      this.els.saveBtn.style.display = 'none';
      this.setBadge({
        dot: 'blue',
        label: 'Persist',
        status: 'Watching for PDF...',
        stats: '',
        showSave: false,
      });
      this.showBadge(true);

      // After a beat, show file being attached
      setTimeout(() => {
        this.showAttachment(true, 'architecture.pdf');
        this.setInput('Can you summarize the key decisions from our last session?');
        this.setBadge({
          dot: 'blue',
          label: 'Persist',
          status: 'Reading PDF...',
          stats: '',
          showSave: false,
        });
      }, 1200);
    },

    phaseMemoryLoaded() {
      this.clearMessages();
      this.showAttachment(true, 'architecture.pdf');
      this.setInput('');
      this.setBadge({
        dot: 'green',
        label: 'Persist: Memory Loaded',
        status: '12 prior messages loaded.',
        stats: '',
        showSave: true,
      });
    },

    phaseContextInjected() {
      this.clearMessages();
      this.showAttachment(true, 'architecture.pdf');
      this.setInput('Can you summarize the key decisions from our last session?');

      this.addContext(
        '--- Persist: Previous History ---\n' +
        '[User] We decided on PostgreSQL over MongoDB.\n' +
        '[Assistant] Confirmed. Indexing strategy was defined.\n' +
        '--- End of Persist History ---',
        0
      );

      this.setBadge({
        dot: 'green',
        label: 'Persist: Memory Loaded',
        status: 'Context injected.',
        stats: '',
        showSave: true,
      });
    },

    phaseConversation() {
      this.clearMessages();
      this.showAttachment(true, 'architecture.pdf');
      this.setInput('');

      this.addMessage('user', 'What did we decide on the database schema?', 0);
      this.addMessage(
        'assistant',
        'Based on our previous session: you chose PostgreSQL with a normalized schema. The users table has an index on email for auth queries.',
        400
      );
      this.addMessage('user', 'Right. Can we add a caching layer now?', 900);
      this.addMessage(
        'assistant',
        'Yes — Redis fits well here. I\'d recommend caching the session queries with a 5-minute TTL.',
        1400
      );

      this.setBadge({
        dot: 'blue',
        label: 'Persist: Syncing...',
        status: 'Capturing messages...',
        stats: '4 messages captured',
        showSave: true,
      });
    },

    phaseSaved() {
      this.clearMessages();
      this.showAttachment(true, 'architecture.pdf');
      this.setInput('');

      this.addMessage('user', 'Save this session — I\'ll continue tomorrow.', 0);
      this.addMessage('assistant', 'Of course! Click "Save Memory" in the Persist badge.', 400);

      setTimeout(() => {
        this.setBadge({
          dot: 'green',
          label: 'Persist: Saving...',
          status: 'Writing to PDF...',
          stats: '6 messages',
          showSave: true,
          saveState: 'saving',
        });
      }, 900);

      setTimeout(() => {
        this.setBadge({
          dot: 'green',
          label: 'Persist: Saved!',
          status: 'Saved as architecture_persist.pdf',
          stats: '6 messages embedded',
          showSave: true,
          saveState: 'saved',
        });
      }, 2000);
    },
  };

  // Init demo on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => demo.init());
  } else {
    demo.init();
  }

  // ── FAQ keyboard accessibility ────────────────────────────────────────────────

  document.querySelectorAll('.faq-question').forEach((q) => {
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        q.closest('details').toggleAttribute('open');
      }
    });
  });

  // ── Hero install button click tracking (placeholder) ──────────────────────────

  const heroInstallBtn = document.getElementById('hero-install-btn');
  if (heroInstallBtn) {
    heroInstallBtn.addEventListener('click', () => {
      // Replace with real analytics / store URL when published
      console.log('[Persist] Install CTA clicked');
    });
  }

})();
