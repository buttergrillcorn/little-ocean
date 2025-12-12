(function () {
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("pre code").forEach(function (code) {
      const cls = code.className || "";
      const match = cls.match(/language-([a-zA-Z0-9]+)/);
      if (match) {
        const lang = match[1].toUpperCase();
        const pre = code.closest("pre");
        if (pre) pre.setAttribute("data-lang", lang);
        const highlight = code.closest(".highlight");
        if (highlight) highlight.setAttribute("data-lang", lang);
      }
    });
  });
})();
