/* ============================================================
   Sidebar navigation — data-driven, with per-page section
   sub-links and scroll-spy. Rendered entirely from here so
   every page stays consistent.
   ============================================================ */
(function () {
  // ---- Navigation model (single source of truth) ----------------
  var NAV = [
    { title: "Introduction", items: [
      { href: "index.html",         icon: "⌂", label: "Overview & Architecture" },
      { href: "setup.html",         icon: "⚙", label: "Setup Guide (Windows)" },
      { href: "structure.html",     icon: "🗂", label: "Repository Map" }
    ]},
    { title: "Core Concepts", items: [
      { href: "cross-cutting.html", icon: "⚹", label: "Cross-Cutting Concerns" },
      { href: "patterns.html",      icon: "◈", label: "Design Patterns" }
    ]},
    { title: "Building Blocks", items: [
      { href: "gateway.html",       icon: "⊟", label: "API Gateway" },
      { href: "config-server.html", icon: "⛁", label: "Config Server" },
      { href: "observability.html", icon: "📊", label: "Observability" }
    ]},
    { title: "Delivery", items: [
      { href: "deployment.html",    icon: "🚀", label: "Deployment & Blue-Green" },
      { href: "cicd.html",          icon: "∞", label: "CI/CD & Argo" },
      { href: "tooling.html",       icon: "🛠", label: "Makefile & Bootstrap" }
    ]},
    { title: "Reference", items: [
      { href: "api-reference.html", icon: "≣", label: "API Reference" },
      { href: "commands.html",      icon: "⌨", label: "Command Cheat Sheet" },
      { href: "troubleshooting.html", icon: "🩺", label: "Troubleshooting & FAQ" }
    ]}
  ];

  var current = location.pathname.split('/').pop() || 'index.html';

  // GitHub profile — lists all the platform's repositories
  var REPO_URL = "https://github.com/dayasahu";

  // Look up the human label for the current page from the nav model
  function currentLabel() {
    for (var g = 0; g < NAV.length; g++) {
      for (var i = 0; i < NAV[g].items.length; i++) {
        if (NAV[g].items[i].href === current) return NAV[g].items[i].label;
      }
    }
    return "Documentation";
  }

  // ---- Collect section anchors on this page ----------------------
  function pageSections() {
    var out = [];
    document.querySelectorAll('main h2[id]').forEach(function (h) {
      // strip any trailing markup, keep plain text
      var label = h.textContent.trim();
      out.push({ id: h.id, label: label });
    });
    return out;
  }

  // ---- Build the sidebar -----------------------------------------
  function render() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var sections = pageSections();
    var html = '';

    NAV.forEach(function (group) {
      html += '<div class="nav-group">';
      html += '<div class="nav-group-title">' + group.title + '</div>';
      group.items.forEach(function (it) {
        var active = it.href === current;
        html += '<a href="' + it.href + '"' + (active ? ' class="active"' : '') + '>'
              + '<span class="ic">' + it.icon + '</span> ' + it.label + '</a>';
        // inject section sub-links under the active page
        if (active && sections.length) {
          html += '<div class="nav-sub">';
          sections.forEach(function (s) {
            html += '<a href="#' + s.id + '" class="sublink" data-sec="' + s.id + '">'
                  + s.label + '</a>';
          });
          html += '</div>';
        }
      });
      html += '</div>';
    });

    html += '<div class="nav-footer">'
          + '<span class="dot">●</span> MyOrg Platform Docs<br>'
          + 'Java 21 · Spring Boot 3.5 · Kubernetes'
          + '</div>';

    nav.innerHTML = html;
  }

  render();

  // ---- Slim sticky header (breadcrumb + GitHub link) -------------
  function renderHeader() {
    var content = document.querySelector('.content');
    if (!content) return;
    var label = currentLabel();
    var isHome = current === 'index.html';
    var crumb = isHome
      ? '<span class="here">Home</span>'
      : '<a href="index.html">Home</a><span class="sep">›</span><span class="here">' + label + '</span>';

    var bar = document.createElement('div');
    bar.className = 'topbar';
    bar.innerHTML =
      '<nav class="breadcrumb">' + crumb + '</nav>' +
      '<div class="topbar-actions">' +
        '<a class="gh-link" href="' + REPO_URL + '" target="_blank" rel="noopener">' +
          '<span>⤢</span> View on GitHub</a>' +
      '</div>';
    content.insertBefore(bar, content.firstChild);
  }
  renderHeader();

  // ---- Global site footer ----------------------------------------
  function renderFooter() {
    var content = document.querySelector('.content');
    if (!content) return;
    var year = new Date().getFullYear();
    var ft = document.createElement('footer');
    ft.className = 'site-footer';
    ft.innerHTML =
      '<div class="inner">' +
        '<span class="ft-left"><span class="dot">⬡</span> © ' + year + ' MyOrg Platform Docs</span>' +
        '<span class="ft-links">' +
          '<a href="' + REPO_URL + '" target="_blank" rel="noopener">GitHub</a>' +
          '<a href="https://www.linkedin.com/in/daya-sahu-a709b63a/" target="_blank" rel="noopener">LinkedIn</a>' +
        '</span>' +
      '</div>';
    content.appendChild(ft);
  }
  renderFooter();

  // ---- Scroll-spy: highlight the section in view -----------------
  var subLinks = Array.prototype.slice.call(document.querySelectorAll('.sublink'));
  var headings = subLinks
    .map(function (a) { return document.getElementById(a.dataset.sec); })
    .filter(Boolean);

  function spy() {
    if (!headings.length) return;
    var pos = window.scrollY + 120;
    var currentId = headings[0].id;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].offsetTop <= pos) currentId = headings[i].id;
    }
    subLinks.forEach(function (a) {
      a.classList.toggle('active', a.dataset.sec === currentId);
    });
  }
  if (headings.length) {
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  // ---- Mobile menu toggle + tap-to-close backdrop ----------------
  var toggle = document.getElementById('menuToggle');
  var sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    function openNav()  { sidebar.classList.add('open');  backdrop.classList.add('show'); }
    function closeNav() { sidebar.classList.remove('open'); backdrop.classList.remove('show'); }

    toggle.addEventListener('click', function () {
      sidebar.classList.contains('open') ? closeNav() : openNav();
    });
    backdrop.addEventListener('click', closeNav);
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }
})();
