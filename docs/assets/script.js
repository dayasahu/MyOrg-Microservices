/* ============================================================
   MyOrg Platform — Navigation & Page Enhancement
   Pure CSS hover dropdowns · scroll-spy · mobile drawer
   ============================================================ */
(function () {

  // ── Navigation data ──────────────────────────────────────────
  var NAV = [
    { title: "Introduction", items: [
      { href: "index.html",         icon: "⌂", label: "Overview & Architecture",  sub: "Platform overview, diagram" },
      { href: "setup.html",         icon: "⚙", label: "Setup Guide",              sub: "Windows, tooling, first run" },
      { href: "structure.html",     icon: "🗂", label: "Repository Map",           sub: "Folders, files, modules" }
    ]},
    { title: "Core Concepts", items: [
      { href: "cross-cutting.html", icon: "⚹", label: "Cross-Cutting Concerns",   sub: "Auth, logging, tracing" },
      { href: "patterns.html",      icon: "◈", label: "Design Patterns",          sub: "Architecture decisions" }
    ]},
    { title: "Building Blocks", items: [
      { href: "gateway.html",       icon: "⊟", label: "API Gateway",              sub: "Routing, JWT, rate limits" },
      { href: "config-server.html", icon: "⛁", label: "Config Server",            sub: "Native mode, ConfigMaps" },
      { href: "observability.html", icon: "📊", label: "Observability",            sub: "LGTM, Alloy, dashboards" }
    ]},
    { title: "Delivery", items: [
      { href: "deployment.html",    icon: "🚀", label: "Deployment & Blue-Green",  sub: "Argo Rollouts, strategy" },
      { href: "cicd.html",          icon: "∞",  label: "CI/CD & Argo",             sub: "GitHub Actions pipeline" },
      { href: "tooling.html",       icon: "🛠", label: "Makefile & Bootstrap",     sub: "make up/down, scripts" }
    ]},
    { title: "Reference", items: [
      { href: "api-reference.html",   icon: "≣", label: "API Reference",           sub: "Endpoints, auth, schemas" },
      { href: "commands.html",        icon: "⌨", label: "Command Cheat Sheet",     sub: "kubectl, make, git" },
      { href: "troubleshooting.html", icon: "🩺", label: "Troubleshooting & FAQ",  sub: "Common errors & fixes" }
    ]}
  ];

  var current  = location.pathname.split('/').pop() || 'index.html';
  var REPO_URL    = 'https://github.com/dayasahu/MyOrg-Microservices';
  var REPO_NAME   = 'dayasahu / MyOrg-Microservices';
  var GITHUB_USER = 'dayasahu';
  var LINKEDIN    = 'https://www.linkedin.com/in/daya-sahu-a709b63a';

  // ── Analytics (GoatCounter) ───────────────────────────────────
  // Sign up free at https://www.goatcounter.com, then set your
  // site code below (the part before .goatcounter.com).
  // Leave blank to disable tracking.
  var GOATCOUNTER_CODE = '';

  function currentLabel() {
    for (var g = 0; g < NAV.length; g++)
      for (var i = 0; i < NAV[g].items.length; i++)
        if (NAV[g].items[i].href === current) return NAV[g].items[i].label;
    return 'Documentation';
  }

  function groupHasCurrent(group) {
    return group.items.some(function (it) { return it.href === current; });
  }

  function pageSections() {
    var out = [];
    document.querySelectorAll('main h2[id]').forEach(function (h) {
      out.push({ id: h.id, label: h.textContent.trim() });
    });
    return out;
  }

  // ── GitHub SVG icon (inline, no external request) ────────────
  var GH_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.7 7.7 0 012-.27 7.7 7.7 0 012 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

  // ── Render top navbar ─────────────────────────────────────────
  function renderTopNav() {
    var header = document.createElement('header');
    header.className = 'topnav';
    header.setAttribute('role', 'banner');

    var html =
      '<a class="topnav-brand" href="index.html" aria-label="MyOrg Platform home">' +
        '<span class="logo" aria-hidden="true">⬡</span>' +
        '<span class="brand-text">' +
          '<span class="brand-name">MyOrg Platform</span>' +
          '<span class="brand-sub">Microservices · Kubernetes</span>' +
        '</span>' +
      '</a>' +
      '<div class="topnav-sep" aria-hidden="true"></div>' +
      '<nav class="topnav-menu" aria-label="Main navigation">';

    NAV.forEach(function (group) {
      var hasActive = groupHasCurrent(group);
      html +=
        '<div class="nav-item' + (hasActive ? ' has-active' : '') + '">' +
          '<button class="nav-btn" type="button">' +
            group.title +
            '<span class="arrow" aria-hidden="true">▾</span>' +
          '</button>' +
          '<div class="dropdown" role="menu">';

      group.items.forEach(function (it) {
        var active = it.href === current;
        html +=
          '<a href="' + it.href + '" role="menuitem"' + (active ? ' class="active" aria-current="page"' : '') + '>' +
            '<span class="ic" aria-hidden="true">' + it.icon + '</span>' +
            '<span class="link-meta">' +
              '<span class="link-label">' + it.label + '</span>' +
            '</span>' +
          '</a>';
      });

      html += '</div></div>';
    });

    html +=
      '</nav>' +
      '<div class="topnav-right">' +
        '<a class="gh-btn" href="' + REPO_URL + '" target="_blank" rel="noopener noreferrer" aria-label="View ' + REPO_NAME + ' on GitHub">' +
          GH_ICON +
          '<span class="gh-btn-text">' +
            '<span class="gh-btn-label">View on GitHub</span>' +
            '<span class="gh-btn-repo">' + REPO_NAME + '</span>' +
          '</span>' +
        '</a>' +
        '<button class="topnav-toggle" id="drawerToggle" type="button" aria-label="Toggle menu" aria-expanded="false">' +
          '☰' +
        '</button>' +
      '</div>';

    header.innerHTML = html;
    document.body.insertBefore(header, document.body.firstChild);

    // Keyboard support: close open dropdowns on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.nav-item.open').forEach(function (el) {
          el.classList.remove('open');
        });
      }
    });
  }

  // ── Mobile drawer ─────────────────────────────────────────────
  function renderDrawer() {
    var drawer = document.createElement('nav');
    drawer.id = 'topnavDrawer';
    drawer.className = 'topnav-drawer';
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.setAttribute('aria-hidden', 'true');

    var html = '';
    NAV.forEach(function (group) {
      html += '<div class="drawer-group"><div class="drawer-group-title">' + group.title + '</div>';
      group.items.forEach(function (it) {
        var active = it.href === current;
        html +=
          '<a href="' + it.href + '"' + (active ? ' class="active" aria-current="page"' : '') + '>' +
            '<span class="ic" aria-hidden="true">' + it.icon + '</span>' + it.label +
          '</a>';
      });
      html += '</div>';
    });

    drawer.innerHTML = html;
    document.body.appendChild(drawer);

    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    var toggle = document.getElementById('drawerToggle');

    function openDrawer() {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      backdrop.classList.add('show');
      toggle.textContent = '✕';
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      backdrop.classList.remove('show');
      toggle.textContent = '☰';
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    backdrop.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  }

  // ── Breadcrumb bar ────────────────────────────────────────────
  function renderBreadcrumb() {
    var content = document.querySelector('.content');
    if (!content) return;

    var label  = currentLabel();
    var isHome = current === 'index.html';
    var crumb  = isHome
      ? '<span class="here">Home</span>'
      : '<a href="index.html">Docs</a><span class="sep" aria-hidden="true">›</span><span class="here">' + label + '</span>';

    var bar = document.createElement('div');
    bar.className = 'topbar';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Breadcrumb');
    bar.innerHTML =
      '<nav class="breadcrumb" aria-label="You are here">' + crumb + '</nav>';
    content.insertBefore(bar, content.firstChild);
  }

  // ── Right-rail page TOC ───────────────────────────────────────
  function renderPageToc(sections) {
    if (!sections.length) return;
    var toc = document.createElement('aside');
    toc.className = 'page-toc';
    toc.id = 'pageToc';
    toc.setAttribute('aria-label', 'On this page');

    var html = '<div class="page-toc-title">On this page</div>';
    sections.forEach(function (s) {
      html += '<a href="#' + s.id + '" data-sec="' + s.id + '">' + s.label + '</a>';
    });
    toc.innerHTML = html;
    document.body.appendChild(toc);
  }

  // ── Site footer ───────────────────────────────────────────────
  function renderFooter() {
    var content = document.querySelector('.content');
    if (!content) return;
    var year = new Date().getFullYear();
    var ft = document.createElement('footer');
    ft.className = 'site-footer';
    ft.setAttribute('role', 'contentinfo');
    ft.innerHTML =
      '<div class="inner">' +
        '<span class="ft-left"><span class="dot" aria-hidden="true">⬡</span> © ' + year + ' MyOrg Platform Docs</span>' +
        '<span class="ft-links">' +
          '<a href="' + REPO_URL + '" target="_blank" rel="noopener noreferrer">' + REPO_NAME + '</a>' +
          '<a href="https://www.linkedin.com/in/daya-sahu-a709b63a" target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
        '</span>' +
      '</div>';
    content.appendChild(ft);
  }

  // ── Scroll-spy ────────────────────────────────────────────────
  function initScrollSpy(sections) {
    if (!sections.length) return;

    var tocLinks = Array.prototype.slice.call(
      document.querySelectorAll('.page-toc a[data-sec]')
    );
    var headings = sections
      .map(function (s) { return document.getElementById(s.id); })
      .filter(Boolean);

    function spy() {
      var scrollY = window.scrollY + 110;
      var activeId = headings[0] ? headings[0].id : null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].offsetTop <= scrollY) activeId = headings[i].id;
      }
      tocLinks.forEach(function (a) {
        a.classList.toggle('active', a.dataset.sec === activeId);
      });
    }

    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  // ── Smooth active-link highlight on anchor click ──────────────
  function initAnchorHighlight() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        var id = a.getAttribute('href').slice(1);
        var el = document.getElementById(id);
        if (el) {
          el.classList.add('highlight-flash');
          setTimeout(function () { el.classList.remove('highlight-flash'); }, 1200);
        }
      });
    });
  }

  // ── GoatCounter analytics ─────────────────────────────────────
  function injectAnalytics() {
    if (!GOATCOUNTER_CODE) return;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count');
    s.src = '//gc.zgo.at/count.js';
    document.head.appendChild(s);
  }

  // ── Contact section (index.html only) ────────────────────────
  function renderContactSection() {
    var container = document.querySelector('.container');
    if (!container) return;
    // Only inject on the home page
    if (current !== 'index.html' && current !== '') return;

    var pageNav = container.querySelector('.page-nav');
    if (!pageNav) return;

    var section = document.createElement('div');
    section.innerHTML =
      '<h2 id="contact">Get in Touch</h2>' +
      '<p>Have a question about the platform, found a bug, or want to collaborate? ' +
      'Pick the channel that works best for you.</p>' +
      '<div class="contact-grid">' +

        '<a class="contact-card" href="' + REPO_URL + '/issues/new" target="_blank" rel="noopener noreferrer">' +
          '<div class="contact-card-icon" style="background:linear-gradient(135deg,#6d5afe,#06b6d4)">' +
            '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>' +
            '<path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>' +
          '</div>' +
          '<div class="contact-card-body">' +
            '<strong>Open a GitHub Issue</strong>' +
            '<span>Bug reports · feature requests · questions — tracked publicly in the repo.</span>' +
            '<span class="contact-card-cta">github.com/' + GITHUB_USER + '/MyOrg-Microservices/issues →</span>' +
          '</div>' +
        '</a>' +

        '<a class="contact-card" href="' + REPO_URL + '/discussions" target="_blank" rel="noopener noreferrer">' +
          '<div class="contact-card-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4)">' +
            '<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.5 2.75a.25.25 0 01.25-.25h8.5a.25.25 0 01.25.25v5.5a.25.25 0 01-.25.25h-3.5a.75.75 0 00-.53.22L3.5 11.44V9.25a.75.75 0 00-.75-.75h-1a.25.25 0 01-.25-.25v-5.5zM1.75 1A1.75 1.75 0 000 2.75v5.5C0 9.216.784 10 1.75 10H2v1.543a1.457 1.457 0 002.487 1.03L7.061 10h3.189A1.75 1.75 0 0012 8.25v-5.5A1.75 1.75 0 0010.25 1h-8.5zM14.5 4.75a.25.25 0 00-.25-.25h-.5a.75.75 0 000 1.5h.5v5.5a.25.25 0 01-.25.25H13a.75.75 0 00-.75.75v1.19l-2.22-2.22a.75.75 0 00-.53-.22h-1a.75.75 0 000 1.5h.69l2.78 2.78a1.457 1.457 0 002.487-1.03V13h.25A1.75 1.75 0 0016 11.25v-5.5A1.75 1.75 0 0014.25 3h-.5a.75.75 0 000 1.5h.5a.25.25 0 01.25.25v-.25z"/></svg>' +
          '</div>' +
          '<div class="contact-card-body">' +
            '<strong>GitHub Discussions</strong>' +
            '<span>Architecture ideas, general Q&amp;A, show-and-tell — a community space in the repo.</span>' +
            '<span class="contact-card-cta">github.com/' + GITHUB_USER + '/MyOrg-Microservices/discussions →</span>' +
          '</div>' +
        '</a>' +

        '<a class="contact-card" href="' + LINKEDIN + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="contact-card-icon" style="background:linear-gradient(135deg,#0a66c2,#0d8ecf)">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' +
          '</div>' +
          '<div class="contact-card-body">' +
            '<strong>Connect on LinkedIn</strong>' +
            '<span>Direct messages for professional enquiries, collaborations, or feedback.</span>' +
            '<span class="contact-card-cta">linkedin.com/in/daya-sahu-a709b63a →</span>' +
          '</div>' +
        '</a>' +

        '<a class="contact-card" href="https://github.com/' + GITHUB_USER + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="contact-card-icon" style="background:linear-gradient(135deg,#24292f,#57606a)">' +
            GH_ICON +
          '</div>' +
          '<div class="contact-card-body">' +
            '<strong>GitHub Profile</strong>' +
            '<span>Browse all public repositories, contributions, and activity.</span>' +
            '<span class="contact-card-cta">github.com/' + GITHUB_USER + ' →</span>' +
          '</div>' +
        '</a>' +

      '</div>' +

      // Analytics note
      '<div class="analytics-note callout info" style="margin-top:10px;">' +
        '<div>' +
          '<strong>Page view analytics</strong>' +
          'This site uses <a href="https://www.goatcounter.com" target="_blank" rel="noopener noreferrer">GoatCounter</a> — ' +
          'cookie-free, GDPR-friendly, no personal data collected. ' +
          'View the <a href="https://myorg-microservices.goatcounter.com" target="_blank" rel="noopener noreferrer">public stats dashboard</a> ' +
          'to see which pages are most visited.' +
        '</div>' +
      '</div>';

    container.insertBefore(section, pageNav);
  }

  // ── Bootstrap ────────────────────────────────────────────────
  renderTopNav();
  renderDrawer();
  renderBreadcrumb();
  renderFooter();
  injectAnalytics();

  var sections = pageSections();
  renderPageToc(sections);
  initScrollSpy(sections);
  initAnchorHighlight();
  renderContactSection();

})();
