# Edit Plan (Responsiveness + Interactivity Fix)

## Information Gathered
- `script.js` is **empty (0 bytes)**, so no interactivity is implemented at runtime.
- `index.html` contains interactive elements that require JS:
  - Mobile nav toggle button: `.nav-toggle` and nav `.primary-nav`.
  - FAQ accordion: buttons `.faq-q` with content `.faq-a`.
  - Appointment booking form: `#appointment-form` and inputs with ids.
  - AI assistant widget: `.ai-window` with controls `#open-ai`, `#ai-close`, `#ai-minimize`, quick reply buttons `.qr`, form `#ai-form`.

## Plan
### File: `script.js`
Implement all interactivity and responsiveness logic:
1. **Mobile navigation**
   - Toggle `.nav-open` on `<body>` when `.nav-toggle` is clicked.
   - Set `aria-expanded` accordingly.
   - Close menu when:
     - a nav link is clicked, or
     - clicking outside the menu.
2. **FAQ accordion**
   - On `.faq-q` click:
     - Toggle the associated `.faq-a` (the next sibling).
     - Update `aria-expanded` and button icon (`+`/`−`) for feedback.
     - Ensure only one section may be open at a time (recommended) or allow multiple (choose consistent behavior).
3. **Appointment form**
   - Add input validation:
     - Use HTML5 validity where possible.
     - Show messages in the corresponding `.error[data-for="..."]` spans.
   - On submit:
     - If valid, generate a WhatsApp deep link to `https://wa.me/<doctor-number>?text=<message>`
     - Put parent/child details + preferred slot + reason/problem into the message.
     - Display a success area `#form-success` and open WhatsApp in a new tab.
4. **AI chat widget**
   - Toggle chat visibility by adding `.open` to `#ai-window`.
   - Minimize should hide the window but keep the FAB visible.
   - Close hides the window.
   - Quick reply buttons should send canned responses:
     - Clinic timings
     - Doctor specialization
     - Book appointment
     - Contact number
   - Chat input submission should render user message + assistant response.
   - Implement “typing dots” briefly before the canned response.

### Optional (only if needed)
- Ensure accessibility attributes are consistent (aria-live regions, focus handling).

## Dependent Files to be edited
- `script.js` (only; currently empty).

## Followup steps
- Open `index.html` in browser.
- Test on mobile width (~375px):
  - Menu button toggles.
  - FAQ expand/collapse works.
  - Appointment form validates and opens WhatsApp.
  - AI widget opens/closes; quick replies render responses.


