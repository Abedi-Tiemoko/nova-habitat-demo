(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const properties = window.NOVA_PROPERTIES || [];

  const icon = (name) => {
    const icons = {
      bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11V6a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3v4M3 11h18v7M5 18v2M19 18v2M12 11V8a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v3"/></svg>',
      bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3ZM7 12V6a3 3 0 0 1 6 0M7 20l-1 2M17 20l1 2"/></svg>',
      area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M8 8l-4-4M16 8l4-4M8 16l-4 4M16 16l4 4"/></svg>',
      pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/></svg>'
    };
    return icons[name] || '';
  };

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem('nova-favorites') || '[]'); }
    catch { return []; }
  }

  function saveFavorites(items) {
    localStorage.setItem('nova-favorites', JSON.stringify(items));
    updateFavoriteCount();
  }

  function toggleFavorite(id, button) {
    const items = getFavorites();
    const index = items.indexOf(id);
    if (index >= 0) items.splice(index, 1); else items.push(id);
    saveFavorites(items);
    if (button) {
      button.classList.toggle('is-favorite', items.includes(id));
      button.setAttribute('aria-pressed', String(items.includes(id)));
    }
  }

  function updateFavoriteCount() {
    const count = getFavorites().length;
    $$('.favorite-count').forEach(el => { el.textContent = count; });
  }

  function propertyCard(property) {
    const favorite = getFavorites().includes(property.id);
    const bedroomMeta = property.beds > 0
      ? `<span>${icon('bed')} ${property.beds} ch.</span>`
      : '<span class="property-professional">Professionnel</span>';
    return `
      <article class="property-card" data-type="${property.type}" data-transaction="${property.transaction}" data-location="${property.location}" data-price="${property.price}">
        <div class="property-media">
          <a href="bien.html?id=${property.id}" aria-label="Voir ${property.title}">
            <img src="${property.image}" alt="${property.title}" loading="lazy">
          </a>
          <span class="property-badge">${property.badge}</span>
          <button class="favorite-btn ${favorite ? 'is-favorite' : ''}" type="button" data-favorite="${property.id}" aria-label="Ajouter ${property.title} aux favoris" aria-pressed="${favorite}">
            ${icon('heart')}
          </button>
        </div>
        <div class="property-body">
          <div class="property-topline">
            <span>${property.transaction}</span>
            <strong>${property.priceLabel}</strong>
          </div>
          <h3><a href="bien.html?id=${property.id}">${property.title}</a></h3>
          <p class="property-location">${icon('pin')} ${property.location}</p>
          <div class="property-meta">
            ${bedroomMeta}
            <span>${icon('bath')} ${property.baths} sdb.</span>
            <span>${icon('area')} ${property.area} m²</span>
          </div>
        </div>
      </article>`;
  }

  function bindFavoriteButtons(root = document) {
    $$('[data-favorite]', root).forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(Number(button.dataset.favorite), button);
      });
    });
  }

  function renderFeatured() {
    const container = $('#featured-properties');
    if (!container) return;
    container.innerHTML = properties.slice(0, 3).map(propertyCard).join('');
    bindFavoriteButtons(container);
  }

  function renderListings(list = properties) {
    const container = $('#properties-grid');
    if (!container) return;
    const resultCount = $('#result-count');
    container.innerHTML = list.length
      ? list.map(propertyCard).join('')
      : '<div class="empty-state"><strong>Aucun bien ne correspond à ces critères.</strong><p>Essayez d’élargir votre recherche ou réinitialisez les filtres.</p></div>';
    if (resultCount) resultCount.textContent = `${list.length} bien${list.length > 1 ? 's' : ''}`;
    bindFavoriteButtons(container);
  }

  function setupFilters() {
    const form = $('#property-filters');
    if (!form) return;

    const apply = () => {
      const type = $('#filter-type')?.value || '';
      const transaction = $('#filter-transaction')?.value || '';
      const location = ($('#filter-location')?.value || '').toLowerCase().trim();
      const budget = Number($('#filter-budget')?.value || 0);

      const filtered = properties.filter(p => {
        const typeOk = !type || p.type === type;
        const transactionOk = !transaction || p.transaction === transaction;
        const locationOk = !location || p.location.toLowerCase().includes(location);
        const budgetOk = !budget || p.price <= budget;
        return typeOk && transactionOk && locationOk && budgetOk;
      });
      renderListings(filtered);
    };

    form.addEventListener('submit', event => { event.preventDefault(); apply(); });
    form.addEventListener('change', apply);
    $('#filter-location')?.addEventListener('input', apply);
    $('#reset-filters')?.addEventListener('click', () => {
      form.reset();
      renderListings(properties);
    });
    renderListings(properties);
  }

  function setupHeroSearch() {
    const form = $('#hero-search');
    if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const params = new URLSearchParams();
      const transaction = $('#hero-transaction')?.value;
      const type = $('#hero-type')?.value;
      const location = $('#hero-location')?.value;
      if (transaction) params.set('transaction', transaction);
      if (type) params.set('type', type);
      if (location) params.set('location', location);
      window.location.href = `biens.html${params.toString() ? `?${params}` : ''}`;
    });
  }

  function applyQueryFilters() {
    const form = $('#property-filters');
    if (!form) return;
    const params = new URLSearchParams(window.location.search);
    const map = [
      ['transaction', '#filter-transaction'],
      ['type', '#filter-type'],
      ['location', '#filter-location']
    ];
    map.forEach(([param, selector]) => {
      const value = params.get(param);
      const field = $(selector);
      if (value && field) field.value = value;
    });
    form.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function renderPropertyDetail() {
    const root = $('#property-detail');
    if (!root) return;
    const id = Number(new URLSearchParams(window.location.search).get('id') || 1);
    const p = properties.find(item => item.id === id) || properties[0];
    document.title = `${p.title} | Nova Habitat`;

    const fav = getFavorites().includes(p.id);
    root.innerHTML = `
      <section class="property-detail-hero">
        <div class="property-gallery">
          <figure class="gallery-main"><img src="${p.gallery[0]}" alt="${p.title}"></figure>
          ${p.gallery.slice(1,4).map((img, i) => `<figure class="gallery-small"><img src="${img}" alt="Vue ${i + 2} — ${p.title}" loading="lazy"></figure>`).join('')}
        </div>
      </section>
      <section class="property-detail-main container">
        <div class="property-detail-copy">
          <div class="eyebrow">${p.transaction} · ${p.type}</div>
          <div class="property-title-row">
            <div>
              <h1>${p.title}</h1>
              <p class="property-location large">${icon('pin')} ${p.location}</p>
            </div>
            <button class="favorite-btn detail-favorite ${fav ? 'is-favorite' : ''}" type="button" data-favorite="${p.id}" aria-label="Ajouter aux favoris" aria-pressed="${fav}">${icon('heart')}</button>
          </div>
          <div class="detail-price">${p.priceLabel}</div>
          <div class="detail-meta">
            ${p.beds ? `<span>${icon('bed')}<strong>${p.beds}</strong> chambres</span>` : '<span><strong>Usage</strong> professionnel</span>'}
            <span>${icon('bath')}<strong>${p.baths}</strong> salles d’eau</span>
            <span>${icon('area')}<strong>${p.area}</strong> m²</span>
          </div>
          <p class="detail-intro">${p.intro}</p>
          <div class="detail-section">
            <h2>À propos de ce bien</h2>
            <p>${p.description}</p>
          </div>
          <div class="detail-section">
            <h2>Prestations</h2>
            <ul class="feature-list">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>
          </div>
          <div class="demo-disclaimer">Annonce fictive créée pour démontrer l’expérience d’un site immobilier professionnel.</div>
        </div>
        <aside class="inquiry-card">
          <span class="eyebrow">Visite privée</span>
          <h2>Vous souhaitez en savoir plus&nbsp;?</h2>
          <p>Demandez une visite ou échangez avec un conseiller. Cette interaction est simulée pour la démonstration.</p>
          <form class="demo-form" data-demo-form>
            <label>Nom complet<input type="text" name="name" required placeholder="Votre nom"></label>
            <label>Téléphone<input type="tel" name="phone" required placeholder="+225 ..."></label>
            <label>Email<input type="email" name="email" required placeholder="vous@exemple.com"></label>
            <button class="btn btn-dark btn-full" type="submit">Demander une visite</button>
          </form>
          <button class="btn btn-whatsapp btn-full" type="button" data-demo-whatsapp>WhatsApp Business</button>
        </aside>
      </section>`;
    bindFavoriteButtons(root);
    bindDemoInteractions(root);
  }

  function showToast(message) {
    let toast = $('#demo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'demo-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__novaToast);
    window.__novaToast = setTimeout(() => toast.classList.remove('show'), 3600);
  }

  function bindDemoInteractions(root = document) {
    $$('[data-demo-form]', root).forEach(form => {
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.checkValidity()) return form.reportValidity();
        form.reset();
        showToast('Démo : la demande a bien été simulée. Sur un vrai site, elle serait envoyée à l’agence.');
      });
    });
    $$('[data-demo-whatsapp]', root).forEach(button => {
      button.addEventListener('click', () => {
        showToast('Démo WhatsApp : ce bouton sera connecté au numéro WhatsApp Business du client.');
      });
    });
  }

  function setupNavigation() {
    const header = $('.site-header');
    const toggle = $('.nav-toggle');
    const nav = $('.site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('nav-open', open);
      });
      $$('.site-nav a').forEach(link => link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }));
    }
    const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function setupReveal() {
    const items = $$('.reveal');
    if (!items.length || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    items.forEach(el => observer.observe(el));
  }

  function setupEstimateForm() {
    const form = $('#estimate-form');
    if (!form) return;
    const steps = $$('.estimate-step', form);
    let current = 0;
    const show = index => {
      steps.forEach((step, i) => step.hidden = i !== index);
      const progress = $('#estimate-progress');
      if (progress) progress.style.width = `${((index + 1) / steps.length) * 100}%`;
      $('#estimate-step-label').textContent = `Étape ${index + 1} / ${steps.length}`;
    };
    $$('[data-next]', form).forEach(button => button.addEventListener('click', () => {
      const visible = steps[current];
      const required = $$('input[required], select[required], textarea[required]', visible);
      const invalid = required.find(field => !field.checkValidity());
      if (invalid) return invalid.reportValidity();
      current = Math.min(current + 1, steps.length - 1);
      show(current);
    }));
    $$('[data-prev]', form).forEach(button => button.addEventListener('click', () => {
      current = Math.max(current - 1, 0);
      show(current);
    }));
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.checkValidity()) return form.reportValidity();
      form.reset();
      current = 0;
      show(current);
      showToast('Démo : estimation reçue. Sur un vrai site, le prospect serait transmis à l’agence.');
    });
    show(0);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    renderFeatured();
    setupHeroSearch();
    setupFilters();
    applyQueryFilters();
    renderPropertyDetail();
    bindDemoInteractions();
    setupEstimateForm();
    setupReveal();
    updateFavoriteCount();
  });
})();
