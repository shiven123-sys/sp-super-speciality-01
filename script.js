/* Clinic site interactivity: mobile nav, FAQ accordion, appointment WhatsApp deep link,
 * testimonials (1-5 star reviews saved to localStorage), and AI assistant widget. */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));


  const on = (el, event, handler, opts) => {
    if (!el) return;
    el.addEventListener(event, handler, opts);
  };

  const escapeHtml = (str) =>
    String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------
  // Mobile navigation
  // -----------------------------
  function initMobileNav() {
    const body = document.body;
    const toggleBtn = $('.nav-toggle');
    const nav = $('#primary-nav');
    if (!toggleBtn || !nav) return;

    const links = $$('a[href^="#"]', nav);

    const setOpen = (open) => {
      body.classList.toggle('nav-open', open);
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    on(toggleBtn, 'click', (e) => {
      e.preventDefault();
      const open = !body.classList.contains('nav-open');
      setOpen(open);
    });

    // Close when a nav link is clicked
    links.forEach((a) =>
      on(a, 'click', () => {
        setOpen(false);
      })
    );

    // Close on outside click (only if open)
    on(document, 'click', (e) => {
      if (!body.classList.contains('nav-open')) return;
      const target = e.target;
      if (!(target instanceof Node)) return;

      const clickedInsideNav = nav.contains(target);
      const clickedToggle = toggleBtn.contains(target);
      if (!clickedInsideNav && !clickedToggle) {
        setOpen(false);
      }
    });

    // Close on Escape
    on(document, 'keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!body.classList.contains('nav-open')) return;
      setOpen(false);
    });
  }

  // -----------------------------
  // FAQ accordion
  // -----------------------------
  function initFaq() {
    const items = $$('.faq-item');
    if (!items.length) return;

    const faqs = $$('.faq-q');
    if (!faqs.length) return;

    // Only one open at a time
    const setOpen = (btn, open) => {
      const icon = $('.faq-icon', btn);
      const content = btn.parentElement?.querySelector('.faq-a');
      if (!content) return;

      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      content.hidden = !open;
      if (icon) icon.textContent = open ? '−' : '+';
    };

    faqs.forEach((btn) => {
      // Ensure initial ARIA/state match hidden
      const content = btn.parentElement?.querySelector('.faq-a');
      if (!content) return;
      const icon = $('.faq-icon', btn);
      btn.setAttribute('aria-expanded', content.hidden ? 'false' : 'true');
      if (icon) icon.textContent = content.hidden ? '+' : '−';

      on(btn, 'click', () => {
        const content = btn.parentElement?.querySelector('.faq-a');
        if (!content) return;
        const currentlyOpen = !content.hidden;

        // Close others
        items.forEach((it) => {
          const otherBtn = $('.faq-q', it);
          const otherContent = $('.faq-a', it);
          if (!otherBtn || !otherContent) return;
          if (otherBtn !== btn) {
            setOpen(otherBtn, false);
          }
        });

        // Toggle this one
        setOpen(btn, !currentlyOpen);
      });
    });
  }

  // -----------------------------
  // Appointment form
  // -----------------------------
  function initAppointmentForm() {
    const form = $('#appointment-form');
    if (!form) return;

    const success = $('#form-success');

    const DOCTORS = {
      ashlesha: {
        name: 'Dr. Ashlesha Shimpi-Dighe',
        whatsappNumber: '919850823550',
      },
      mohnish: {
        name: 'Dr. Mohnish Dighe',
        whatsappNumber: '9850823550',
      },
    };

    const WAPP_FALLBACK_NUMBER = DOCTORS.ashlesha.whatsappNumber;

    const getDoctorKeyFromLabel = (label) => {
      if (!label) return 'ashlesha';
      return String(label).toLowerCase().includes('mohnish') ? 'mohnish' : 'ashlesha';
    };

    const fields = [
      'parentName',
      'childName',
      'childAge',
      'doctor',
      'gender',
      'mobile',
      'email',
      'city',
      'preferredDate',
      'preferredTime',
      'reason',
      'problem',
    ];

    const preferredTimeSelect = form.querySelector('#preferredTime');

    const TIME_OPTIONS_BY_DOCTOR = {
      mohnish: [
        '10:00 AM - 10:30 AM',
        '10:30 AM - 11:00 AM',
        '11:00 AM - 11:30 AM',
        '11:30 AM - 12:00 PM',
        '12:00 PM - 12:30 PM',
        '12:30 PM - 1:00 PM',
        '1:00 PM - 1:30 PM',
        '1:30 PM - 2:00 PM',
      ],
      ashlesha: [
        '6:30 PM - 7:00 PM',
        '7:00 PM - 7:30 PM',
        '7:30 PM - 8:00 PM',
        '8:00 PM - 8:30 PM',
      ],
    };

    const renderTimeOptionsForDoctor = (doctorKey) => {
      if (!preferredTimeSelect) return;
      const options = TIME_OPTIONS_BY_DOCTOR[doctorKey] || TIME_OPTIONS_BY_DOCTOR.ashlesha;
      const optsHtml = [
        `<option value="" selected disabled>Select</option>`,
        ...options.map((t) => `<option>${t}</option>`),
      ].join('');
      preferredTimeSelect.innerHTML = optsHtml;
    };

    const syncPreferredTimesWithDoctor = () => {
      const doctorValue = form.querySelector('#doctor')?.value;
      const doctorKey = getDoctorKeyFromLabel(doctorValue);
      renderTimeOptionsForDoctor(doctorKey);
    };

    const getErrorEl = (id) => form.querySelector(`.error[data-for="${CSS.escape(id)}"]`);

    const validate = () => {
      let ok = true;
      fields.forEach((id) => {
        const el = form.querySelector(`#${CSS.escape(id)}`);
        const err = getErrorEl(id);
        if (!el || !err) return;
        err.textContent = '';
        el.style.borderColor = '';
        if (!el.checkValidity()) {
          ok = false;
          const message = el.validationMessage || 'Please check this field.';
          err.textContent = message;
          el.style.borderColor = 'rgba(180,35,24,.6)';
        }
      });
      return ok;
    };

    fields.forEach((id) => {
      const el = form.querySelector(`#${CSS.escape(id)}`);
      const err = getErrorEl(id);
      if (!el || !err) return;

      on(el, 'blur', () => {
        err.textContent = '';
        el.style.borderColor = '';
        if (!el.checkValidity()) {
          err.textContent = el.validationMessage || 'Please check this field.';
          el.style.borderColor = 'rgba(180,35,24,.6)';
        }
      });
      on(el, 'input', () => { err.textContent = ''; el.style.borderColor = ''; });
      on(el, 'change', () => { err.textContent = ''; el.style.borderColor = ''; });
    });

    const doctorSelect = form.querySelector('#doctor');
    if (doctorSelect) {
      on(doctorSelect, 'change', () => { syncPreferredTimesWithDoctor(); });
    }

    syncPreferredTimesWithDoctor();

    const doctorCards = $$('.doctor-appointment');
    doctorCards.forEach((btn) => {
      on(btn, 'click', () => {
        const doctorKey = btn.getAttribute('data-doctor');
        const doctorValue = doctorKey === 'mohnish' ? 'Dr. Mohnish Dighe' : 'Dr. Ashlesha Shimpi-Dighe';
        const doctorSelect = form.querySelector('#doctor');
        if (doctorSelect) doctorSelect.value = doctorValue;
        const el = document.getElementById('appointment');
        el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      });
    });

    on(form, 'submit', (e) => {
      e.preventDefault();
      if (!validate()) {
        const firstErr = form.querySelector('.error[data-for]')?.textContent?.length
          ? form.querySelector('.error[data-for]:not(:empty)')
          : form.querySelector('.error:not(:empty)');
        if (firstErr) {
          const key = firstErr.getAttribute('data-for');
          const input = key ? form.querySelector(`#${CSS.escape(key)}`) : null;
          input?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
          input?.focus?.();
        }
        return;
      }

      if (success) success.textContent = '';

      const values = Object.fromEntries(fields.map((id) => [id, form.querySelector(`#${CSS.escape(id)}`)?.value?.trim() || '']));

      const selectedDoctorKey = getDoctorKeyFromLabel(values.doctor);
      const doctorMeta = DOCTORS[selectedDoctorKey] || DOCTORS.ashlesha;

      const message = [
        'Hello SP Super Speciality Clinic team,',
        '',
        'I would like to book an appointment.',
        `Selected Doctor: ${doctorMeta.name}`,
        `Parent Name: ${values.parentName}`,
        `Child Name: ${values.childName}`,
        `Child Age: ${values.childAge}`,
        `Gender: ${values.gender}`,
        `Mobile: ${values.mobile}`,
        `Email: ${values.email}`,
        `City: ${values.city}`,
        `Preferred Date: ${values.preferredDate}`,
        `Preferred Time: ${values.preferredTime}`,
        '',
        `Reason: ${values.reason}`,
        `Problem Details: ${values.problem}`,
        '',
        'Thank you.',
      ].join('\n');

      const textToSend = encodeURIComponent(message);
      const targetNumber = doctorMeta.whatsappNumber || WAPP_FALLBACK_NUMBER;
      const url = `https://wa.me/${targetNumber}?text=${textToSend}`;

      if (success) success.textContent = 'Request prepared. Opening WhatsApp…';
      window.open(url, '_blank', 'noopener');
    });
  }

  // -----------------------------
  // AI chat widget (canned responses)
  // -----------------------------
  function initAIChat() {
    const windowEl = $('#ai-window');
    const body = document.body;
    const fab = $('#ai-fab');
    const openBtn = $('#open-ai');
    const closeBtn = $('#ai-close');
    const minimizeBtn = $('#ai-minimize');
    const bodyEl = $('#ai-body');
    const form = $('#ai-form');
    const input = $('#ai-text');
    const quickButtons = $$('.ai-quick .qr');

    if (!windowEl) return;

    const typingHtml = () => `
      <div class="msg bot">
        <div class="bubble" aria-label="Assistant is typing">
          <div class="typing-dots" aria-hidden="true">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    `;

    const addMessage = (text, role = 'bot') => {
      if (!bodyEl) return;
      const div = document.createElement('div');
      div.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
      div.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
      bodyEl.appendChild(div);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    };

    const canned = (question) => {
      const q = question.toLowerCase();

      const clinicTimings = 'Clinic consultation hours: 6:30 PM – 8:30 PM.';
      const contact = 'Mobile/WhatsApp: +91 9850823550. Phone: 020-42899083. Alternate: +91 9762801248.';
      const location = 'Clinic location: SP Super Speciality Clinic, Khinvasara Trade Centre, 101, 1st Floor, Datta Mandir Road, Near Dange Chowk, Wakad, Pune – 411057.';
      const book = 'To book an appointment, use the Appointment Booking form on this page (select the doctor). After submission, it prepares a WhatsApp request for fast availability review.';

      const ashlesha = [
        'Dr. Ashlesha Shimpi-Dighe — Availability: 6:30 PM – 8:30 PM.',
        'Qualifications: MBBS, DNB (General Surgery), MCh (Pediatric Surgery).',
        'Designation: Consultant Pediatric & Neonatal Surgeon.',
        'About: Pediatric and neonatal surgical care for infants/newborns, children, and adolescents—covering congenital anomalies, neonatal surgical emergencies, pediatric GI and urological conditions, minimally invasive pediatric surgery, and childhood surgical diseases.',
        'Areas of expertise: Pediatric Surgery, Neonatal Surgery, Congenital Anomalies, Pediatric Urology, Minimally Invasive Pediatric Surgery, Newborn Surgical Care, General Pediatric Surgical Disorders.',
        'Book: Use the Appointment Booking form (select Ashlesha) or WhatsApp booking.',
      ].join(' ');

      const mohnish = [
        'Dr. Mohnish Dighe — Availability: 10:00 AM – 2:00 PM.',
        'Qualifications: MBBS, DNB (General Surgery), DNB (Neurosurgery).',
        'Designation: Consultant Neurosurgeon.',
        'About: Evaluation and surgical management of disorders affecting the brain, spine, and nervous system, with experience in neuro-trauma and spinal disorders—focused on evidence-based and patient-first care.',
        'Areas of expertise: Neurosurgery, Spine Surgery, Brain Disorders, Neuro-Trauma Management, Surgical Treatment of Neurological Conditions, General Neurosurgical Consultation.',
        'Book: Use the Appointment Booking form (select Mohnish) or WhatsApp booking.',
      ].join(' ');

      if (q.includes('timing') || q.includes('hour') || q.includes('clinic timings') || q.includes('6:30') || q.includes('8:30')) return clinicTimings;
      if (q.includes('ashlesha') || q.includes('ashlesha shimpi')) return ashlesha;
      if (q.includes('mohnish')) return mohnish;
      if (q.includes('book') || q.includes('appointment') || q.includes('whatsapp request') || q.includes('form')) return book;
      if (q.includes('contact') || q.includes('phone') || q.includes('mobile') || q.includes('whatsapp') || q.includes('number')) return contact;
      if (q.includes('location') || q.includes('address') || q.includes('where')) return location;

      if (q.includes('doctor') || q.includes('special') || q.includes('qualification') || q.includes('degrees') || q.includes('mch') || q.includes('pediatric') || q.includes('neonatal')) {
        return 'We have two doctors. Ask about "Ashlesha" or "Mohnish" for doctor-specific details, or ask about "clinic timings", "location", or "book appointment".';
      }

      return 'I can help with clinic timings, doctor availability (Ashlesha/Mohnish), qualifications, location, contact numbers, and how to book an appointment.';
    };

    const setOpen = (open) => {
      if (open) windowEl.classList.add('open');
      else windowEl.classList.remove('open');
      windowEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    on(fab, 'click', (e) => { e.preventDefault(); setOpen(true); input?.focus?.(); });
    on(openBtn, 'click', (e) => { e.preventDefault(); setOpen(true); input?.focus?.(); });
    on(closeBtn, 'click', (e) => { e.preventDefault(); setOpen(false); });
    on(minimizeBtn, 'click', (e) => { e.preventDefault(); setOpen(false); });

    const sendToAssistant = async (question) => {
      if (!bodyEl) return;
      const q = (question || '').trim();
      if (!q) return;

      addMessage(q, 'user');
      bodyEl.insertAdjacentHTML('beforeend', typingHtml());
      bodyEl.scrollTop = bodyEl.scrollHeight;

      const typingMs = prefersReducedMotion() ? 0 : 650;
      await new Promise((r) => setTimeout(r, typingMs));

      const typingMsg = bodyEl.querySelector('.typing-dots')?.closest('.msg');
      typingMsg?.remove();

      addMessage(canned(q), 'bot');
    };

    quickButtons.forEach((b) =>
      on(b, 'click', () => { sendToAssistant(b.textContent.trim()); })
    );

    on(form, 'submit', (e) => {
      e.preventDefault();
      const q = input?.value?.trim();
      if (!q) return;
      input.value = '';
      sendToAssistant(q);
    });

    setOpen(windowEl.classList.contains('open'));
  }

  // -----------------------------
  // Testimonials (ratings 1–5)
  // ← STAR RATING FIX IS HERE ←
  // -----------------------------
  function initTestimonials() {
    const form = $('#review-form');
    const list = $('#review-list');
    if (!form || !list) return;

    const success = $('#review-success');
    const nameEl = $('#reviewName');
    const ratingInputs = $$('input[name="reviewRating"]');
    const textEl = $('#reviewText');

    const STORAGE_KEY = 'sp_clinic_reviews_v1';

    const escapeHtml = (str) =>
      String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const getSelectedRating = () => {
      const checked = ratingInputs.find((i) => i.checked);
      return checked ? Number(checked.value) : null;
    };

    // ── UPDATED: ratingMessages for updateRatingUiValue ──
    const ratingMessages = {
      1: '⭐ 1 — Poor',
      2: '⭐⭐ 2 — Fair',
      3: '⭐⭐⭐ 3 — Good',
      4: '⭐⭐⭐⭐ 4 — Very Good',
      5: '⭐⭐⭐⭐⭐ 5 — Excellent!'
    };

    const updateRatingUiValue = () => {
      const liveEl = document.getElementById('review-rating-value');
      if (!liveEl) return;
      const rating = getSelectedRating();
      liveEl.textContent = rating ? ratingMessages[rating] : 'Tap a star to rate';
    };

    // ── UPDATED: star paint functions ──
    const starLabels = Array.from(form.querySelectorAll('.star-lbl'));

    const paintStars = (n) => {
      starLabels.forEach((lbl, i) => {
        lbl.classList.remove('selected', 'hovered');
        if (i < n) lbl.classList.add('selected');
      });
    };

    const paintHover = (n) => {
      starLabels.forEach((lbl, i) => {
        lbl.classList.remove('selected', 'hovered');
        if (i < n) lbl.classList.add('hovered');
      });
    };

    // Hover preview
    starLabels.forEach((lbl, i) => {
      on(lbl, 'mouseenter', () => paintHover(i + 1));
      on(lbl, 'mouseleave', () => paintStars(getSelectedRating() || 0));
    });

    // Radio change — paint + update text
    ratingInputs.forEach((input) => {
      on(input, 'change', () => {
        paintStars(parseInt(input.value));
        updateRatingUiValue();
      });
    });

    // Label click (belt + suspenders, works on mobile too)
    starLabels.forEach((lbl, i) => {
      on(lbl, 'click', () => {
        ratingInputs[i].checked = true;
        paintStars(i + 1);
        updateRatingUiValue();
      });
    });

    // Reset stars when form resets
    on(form, 'reset', () => {
      setTimeout(() => {
        paintStars(0);
        updateRatingUiValue();
      }, 0);
    });

    // Initial UI value
    updateRatingUiValue();

    // ── Review card render (unchanged) ──
    const renderStars = (rating) => {
      const r = Math.max(1, Math.min(5, Number(rating) || 0));
      const full = '★'.repeat(r);
      const empty = '★'.repeat(5 - r);
      return `
        <div class="review-stars" aria-label="Rated ${r} out of 5">
          <span class="stars-full" aria-hidden="true">${full}</span>
          <span class="stars-empty" aria-hidden="true">${empty}</span>
        </div>
      `;
    };

    const ratingAccentClass = (rating) => {
      const r = Math.max(1, Math.min(5, Number(rating) || 0));
      if (r >= 5) return 'accent-5';
      if (r === 4) return 'accent-4';
      if (r === 3) return 'accent-3';
      if (r === 2) return 'accent-2';
      return 'accent-1';
    };

    const renderReview = (rev) => {
      const name = escapeHtml(rev.name || 'Anonymous');
      const rating = Number(rev.rating) || 5;
      const text = escapeHtml(rev.text || '');
      const date = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : '';
      const accentClass = ratingAccentClass(rating);

      return `
        <div class="review-card ${accentClass}" role="article" aria-label="Review">
          <div class="review-top">
            <div class="review-name">${name}</div>
            <div class="review-date muted">${escapeHtml(date)}</div>
          </div>
          ${renderStars(rating)}
          <div class="review-text">"${text}"</div>
        </div>
      `;
    };

    const loadAll = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const saveAll = (arr) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch {
        // ignore
      }
    };

    const render = () => {
      const reviews = loadAll()
        .slice()
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (!reviews.length) {
        list.innerHTML = `<div class="muted" style="font-weight:750">No reviews yet. Submit the form to add one.</div>`;
        return;
      }

      list.innerHTML = reviews.map(renderReview).join('');
    };

    // Initial render
    render();

    const getErrorEl = (fieldId) => form.querySelector(`.error[data-for="${CSS.escape(fieldId)}"]`);

    const validate = () => {
      let ok = true;

      const nameErr = getErrorEl('reviewName');
      const ratingErr = getErrorEl('reviewRating');
      const textErr = getErrorEl('reviewText');

      if (nameErr) nameErr.textContent = '';
      if (ratingErr) ratingErr.textContent = '';
      if (textErr) textErr.textContent = '';

      if (nameEl && !nameEl.value.trim()) {
        ok = false;
        if (nameErr) nameErr.textContent = 'Please enter your name.';
      }

      const rating = getSelectedRating();
      if (ratingErr && (rating === null || rating < 1 || rating > 5)) {
        ok = false;
        ratingErr.textContent = 'Please select a rating (1 to 5).';
      }

      if (textEl && !textEl.value.trim()) {
        ok = false;
        if (textErr) textErr.textContent = 'Please write your review.';
      }

      return ok;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      success.textContent = '';

      if (!validate()) return;

      const rating = getSelectedRating();
      const review = {
        name: nameEl.value.trim(),
        rating,
        text: textEl.value.trim(),
        createdAt: Date.now(),
      };

      const all = loadAll();
      all.push(review);
      saveAll(all);

      form.reset();
      render();

      success.textContent = 'Review submitted. Thank you!';
    });
  }

  // -----------------------------
  // Modals (Newsletter + Appointment)
  // -----------------------------
  function initModals() {
    const newsletterOverlay = $('#newsletter-modal');
    const appointmentOverlay = $('#appointment-modal');

    const closeButtons = $$('[data-close-modal]');

    const modalState = {
      newsletter: false,
      appointment: false,
    };

    const setBodyOverflow = (locked) => {
      document.body.style.overflow = locked ? 'hidden' : '';
    };

    const openModal = (key) => {
      const overlay = key === 'newsletter' ? newsletterOverlay : appointmentOverlay;
      if (!overlay) return;

      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      overlay.dataset.open = '1';

      modalState[key] = true;

      const anyOpen = modalState.newsletter || modalState.appointment;
      setBodyOverflow(anyOpen);

      // Focus close button
      const closeBtn = overlay.querySelector('.modal-close');
      closeBtn?.focus?.();
    };

    const closeModal = (key) => {
      const overlay = key === 'newsletter' ? newsletterOverlay : appointmentOverlay;
      if (!overlay) return;

      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      delete overlay.dataset.open;

      modalState[key] = false;
      const anyOpen = modalState.newsletter || modalState.appointment;
      setBodyOverflow(anyOpen);
    };

    // Close buttons
    closeButtons.forEach((btn) => {
      on(btn, 'click', () => {
        const key = btn.getAttribute('data-close-modal');
        closeModal(key);
      });
    });

    // Click outside
    [newsletterOverlay, appointmentOverlay].forEach((overlay) => {
      if (!overlay) return;
      on(overlay, 'click', (e) => {
        if (e.target === overlay) {
          const id = overlay.id;
          closeModal(id.includes('newsletter') ? 'newsletter' : 'appointment');
        }
      });
    });

    // Escape
    on(document, 'keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (modalState.appointment) return closeModal('appointment');
      if (modalState.newsletter) return closeModal('newsletter');
    });

    // Newsletter trigger after a delay
    const LS_NEWSLETTER = 'sp_clinic_newsletter_dismissed_v1';

    const shouldShowNewsletter = () => {
      try {
        return !window.localStorage.getItem(LS_NEWSLETTER);
      } catch {
        return true;
      }
    };

    const showNewsletterAfterDelay = () => {
      if (!newsletterOverlay) return;
      if (!shouldShowNewsletter()) return;

      const delayMs = prefersReducedMotion() ? 1200 : 19000;
      window.setTimeout(() => {
        // avoid opening if appointment already open
        if (modalState.appointment) return;
        openModal('newsletter');
      }, delayMs);
    };

    // Newsletter form
    const newsletterForm = $('#newsletter-form');
    const newsletterEmail = $('#newsletter-email');
    const newsletterError = $('#newsletter-error');

    if (newsletterForm && newsletterEmail && newsletterError) {
      on(newsletterForm, 'submit', (e) => {
        e.preventDefault();
        const emailVal = newsletterEmail.value.trim();

        if (!emailVal || !newsletterEmail.checkValidity()) {
          newsletterError.textContent = 'Please enter a valid email address.';
          return;
        }

        newsletterError.textContent = '';

        // Mark as dismissed/subscribed
        try {
          window.localStorage.setItem(LS_NEWSLETTER, '1');
        } catch {
          // ignore
        }

        newsletterForm.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
        newsletterError.textContent = '';

        newsletterError.textContent = 'Subscribed successfully!';

        // Close after a short moment
        window.setTimeout(() => closeModal('newsletter'), prefersReducedMotion() ? 0 : 900);
      });

      // Not now button also closes and dismisses
      const notNowBtn = newsletterOverlay?.querySelector('[data-close-modal="newsletter"]');
      notNowBtn?.addEventListener?.('click', () => {
        try {
          window.localStorage.setItem(LS_NEWSLETTER, '1');
        } catch {
          // ignore
        }
      });
    }

    // Appointment modal open handlers
    const appointmentOpeners = $$('[data-open-modal="appointment"], a[href="#appointment"], .doctor-appointment');
    appointmentOpeners.forEach((el) => {
      on(el, 'click', (e) => {
        // Prevent anchor scroll if the CTA is in-page
        if (el.tagName === 'A' && el.getAttribute('href')?.includes('#appointment')) {
          e.preventDefault();
        }
        if (el.classList && el.classList.contains('doctor-appointment')) e.preventDefault();
        openModal('appointment');

        // Pre-fill department if the doctor selection exists
        const openerDoctorKey = el.getAttribute('data-doctor');
        if (openerDoctorKey) {
          const deptSelect = $('#ap-dept');
          const map = {
            ashlesha: 'Pediatric Surgery',
            mohnish: 'Neurosurgery / Spine',
          };
          if (deptSelect && map[openerDoctorKey]) deptSelect.value = map[openerDoctorKey];
        }
      });
    });

    // Appointment modal submission (prepare WhatsApp request)
    const apForm = $('#appointment-modal-form');
    const apSuccess = $('#appointment-modal-success');
    const apFields = {
      name: $('#ap-name'),
      email: $('#ap-email'),
      phone: $('#ap-phone'),
      dept: $('#ap-dept'),
      date: $('#ap-date'),
    };

    if (apForm) {
      const setApError = (fieldKey, msg) => {
        const err = apForm.querySelector(`.error[data-for="${fieldKey === 'dept' ? 'ap-dept' : `ap-${fieldKey}`}"]`);
        if (err) err.textContent = msg;
      };

      const clearApErrors = () => {
        $$('span.error', apForm).forEach((s) => (s.textContent = ''));
        if (apSuccess) apSuccess.textContent = '';
      };

      on(apForm, 'submit', (e) => {
        e.preventDefault();
        clearApErrors();

        const name = apFields.name?.value?.trim() || '';
        const email = apFields.email?.value?.trim() || '';
        const phone = apFields.phone?.value?.trim() || '';
        const dept = apFields.dept?.value?.trim() || '';
        const date = apFields.date?.value?.trim() || '';

        let ok = true;

        if (!name) {
          ok = false;
          setApError('name', 'Please enter your name.');
        }
        if (!email || !apFields.email.checkValidity()) {
          ok = false;
          setApError('email', 'Please enter a valid email.');
        }
        if (!phone) {
          ok = false;
          setApError('phone', 'Please enter a valid phone number.');
        }
        if (!dept) {
          ok = false;
          setApError('dept', 'Please select a department.');
        }
        if (!date) {
          ok = false;
          setApError('date', 'Please select a date.');
        }

        if (!ok) return;

        const wa = '919850823550';
        const message = [
          'Hello SP Super Speciality Clinic team,',
          '',
          'I would like to book an appointment.',
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Department: ${dept}`,
          `Preferred Date: ${date}`,
          '',
          'Thank you.',
        ].join('\n');

        const url = `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;

        if (apSuccess) apSuccess.textContent = 'Request prepared. Opening WhatsApp…';

        window.open(url, '_blank', 'noopener');

        window.setTimeout(() => closeModal('appointment'), prefersReducedMotion() ? 0 : 650);
      });
    }

    showNewsletterAfterDelay();
  }

  // -----------------------------
  // Reveal-on-scroll animations
  // -----------------------------
  function initRevealOnScroll() {
    const targets = $$('[data-reveal], .reveal');
    if (!targets.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => {
      // normalize: if element already has class reveal, hook animation
      el.classList.add('reveal');
      obs.observe(el);
    });
  }

  // -----------------------------
  // Init
  // -----------------------------
  const init = () => {
    initMobileNav();
    initFaq();
    initAppointmentForm();
    initTestimonials();
    initAIChat();
    initModals();
    initRevealOnScroll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

// ===== GALLERY LIGHTBOX =====
(function () {
  const tiles = document.querySelectorAll('.gallery-tile');
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  const lbCounter = document.getElementById('lb-counter');

  if (!lightbox || !tiles.length) return;

  const images = Array.from(tiles).map(t => ({
    src: t.querySelector('img').src,
    alt: t.querySelector('img').alt
  }));

  let current = 0;

  function openLightbox(index) {
    current = index;
    lbImg.src = images[current].src;
    lbImg.alt = images[current].alt;
    lbCounter.textContent = (current + 1) + ' / ' + images.length;
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function goTo(index) {
    lbImg.classList.add('fade-out');
    setTimeout(function () {
      current = (index + images.length) % images.length;
      lbImg.src = images[current].src;
      lbImg.alt = images[current].alt;
      lbCounter.textContent = (current + 1) + ' / ' + images.length;
      lbImg.classList.remove('fade-out');
    }, 220);
  }

  tiles.forEach(function (tile, i) {
    tile.addEventListener('click', function () { openLightbox(i); });
    tile.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('role', 'button');
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', function () { goTo(current - 1); });
  lbNext.addEventListener('click', function () { goTo(current + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // Touch swipe support
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) diff > 0 ? goTo(current + 1) : goTo(current - 1);
  }, { passive: true });
})();