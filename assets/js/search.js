(() => {
  if (!window.store || !window.store.length || typeof lunr === "undefined")
    return;

  const docs = window.store;
  const docsById = {};
  docs.forEach((doc) => (docsById[doc.id] = doc));

  const idx = lunr(function () {
    this.ref("id");
    this.field("title", { boost: 15 });
    this.field("tags");
    this.field("content", { boost: 10 });
    docs.forEach((doc) => {
      this.add({
        id: doc.id,
        title: doc.title,
        tags: (doc.tags || []).join(" "),
        content: doc.content,
      });
    });
  });

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function runSearch(query) {
    if (!query || query.trim() === "") return [];
    const terms = query.trim().split(/\s+/);
    const q = terms.map((term) => term + "*").join(" ");
    let results = [];
    try {
      results = idx.search(q);
    } catch (e) {
      console.warn("Search error", e);
      results = [];
    }
    return { results, terms: terms.map((t) => t.toLowerCase()) };
  }

  function renderList(resultsObj, target) {
    if (!target) return;
    const { results } = resultsObj;
    // target.classList.add("search-results");
    if (!results.length) {
      target.innerHTML = "<div class='search-none'>No results found.</div>";
      return;
    }
    let html = "";
    results.forEach((res) => {
      const item = docsById[res.ref];
      if (!item) return;
      const urlObj = new URL(item.url, window.location.origin);
      const rel = urlObj.pathname; // drop hash/query; previews fetch clean page
      const emoji = item.emoji || "";
      html += `<p><span class="growth-emoji-only">${emoji}</span><a href="${rel}">${item.title}</a></p>`;
    });
    target.innerHTML = html;
  }

  // Search page results
  const params = new URLSearchParams(window.location.search);
  const query = params.get("query");
  if (query) {
    const resObj = runSearch(query);
    renderList(resObj, document.getElementById("results"));
    const input = document.getElementById("search-input");
    if (input) input.value = query;
  } else {
    const target = document.getElementById("results");
    if (target)
      target.innerHTML =
        '<div class="search-empty">You have to type something to search...</div>';
  }
})();

// Search box expand/collapse functionality
(() => {
  const searchForm = document.getElementById("search");
  const searchToggle = document.getElementById("search-toggle");
  const searchInput = document.getElementById("search-input");

  if (!searchForm || !searchToggle || !searchInput) return;

  searchToggle.addEventListener("click", () => {
    const isExpanded = searchForm.classList.contains("expanded");
    if (isExpanded) {
      searchForm.classList.remove("expanded");
      searchInput.value = "";
      searchInput.blur();
    } else {
      searchForm.classList.add("expanded");
      setTimeout(() => searchInput.focus(), 300);
    }
  });

  // Close on clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchForm.contains(e.target) &&
      searchForm.classList.contains("expanded")
    ) {
      searchForm.classList.remove("expanded");
      searchInput.value = "";
    }
  });

  // Prevent closing when clicking inside the search form
  searchForm.addEventListener("click", (e) => {
    e.stopPropagation();
  });
})();
