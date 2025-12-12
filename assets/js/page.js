let pages = [window.location.pathname];
let switchDirectionWindowWidth = 900;
let animationLength = 200;

function stackNote(href, level) {
  level = Number(level) || pages.length;
  href = URI(href);
  uri = URI(window.location);
  pages.push(href.path());
  uri.setQuery("stackedNotes", pages.slice(1, pages.length));

  old_pages = pages.slice(0, level - 1);
  state = { pages: old_pages, level: level };
  window.history.pushState(state, "", uri.href());
}

function unstackNotes(level) {
  let container = document.querySelector(".grid");
  let children = Array.prototype.slice.call(container.children);

  for (let i = level; i < children.length; i++) {
    container.removeChild(children[i]);
  }
  pages = pages.slice(0, level);
}

function updateLinkStatuses() {
  links = Array.prototype.slice.call(document.querySelectorAll("a"));
  links.forEach(function (e) {
    if (pages.indexOf(e.getAttribute("href")) > -1) {
      e.classList.add("active");
    } else {
      e.classList.remove("active");
    }
  });
}

/**
 * Inserts a note at the given level, first removing any notes up to that level.
 * @param {string} href
 * @param {string} text
 * @param {number} level
 */
function insertNote(href, text, level) {
  level = Number(level) || pages.length;
  unstackNotes(level);
  let container = document.querySelector(".grid");
  let fragment = document.createElement("template");
  fragment.innerHTML = text;
  let element = fragment.content.querySelector(".page");
  container.appendChild(element);

  stackNote(href, level);

  setTimeout(
    function (element, level) {
      element.dataset.level = level + 1;
      initializePage(element, level + 1);
      element.scrollIntoView();
      if (window.MathJax) {
        window.MathJax.typeset();
      }
    }.bind(null, element, level),
    10
  );
}

/**
 * Fetches note at href then inserts the note at the given level
 * @param {string} href
 * @param {number} level 
 */
function fetchNote(href, level) {
  if (pages.indexOf(href) > -1) return;
  level = Number(level) || pages.length;

  const request = new Request(href);
  fetch(request)
    .then((response) => response.text())
    .then((text) => {
      insertNote(href, text, level);
    });
}

function initializePage(page, level) {
  level = level || pages.length;

  links = Array.prototype.slice.call(page.querySelectorAll("a"));

  links.forEach(async function (element) {
    var rawHref = element.getAttribute("href");
    element.dataset.level = level;

    if (
      rawHref &&
      !(
        // Internal Links Only
        (
          rawHref.indexOf("http://") === 0 ||
          rawHref.indexOf("https://") === 0 ||
          rawHref.indexOf("#") === 0 ||
          rawHref.includes(".pdf") ||
          rawHref.includes(".svg")
        )
      )
    ) {
      var prefetchLink = element.href.split("#")[0];
      async function myFetch() {
        try {
          let response = await fetch(prefetchLink);
          let ct = await response.headers.get("content-type") || "";
          if (ct.includes("text/html")) {
            let text = await response.text();
            element._prefetchedText = text;
            element.dataset.prefetched = "1";
            // Hover to see preview (only if we have prefetched content)
            element.addEventListener("mouseenter", function () {
              if (this._prefetchedText) showPreview(this._prefetchedText, element);
            });
            element.addEventListener("mouseleave", function () {
              hidePreview();
            });
          }
        } catch (err) {
          // ignore; fallback handled in click handler
        }
        updateLinkStatuses();
      }
      myFetch();

      // Click handler with fallback: stack if we can fetch HTML, otherwise navigate normally
      element.addEventListener("click", async function (e) {
        if (e.ctrlKey || e.metaKey) return; // allow new tab/window
        e.preventDefault();
        const href = this.getAttribute("href");
        let html = this._prefetchedText;
        try {
          if (!html) {
            const resp = await fetch(prefetchLink);
            const ct = (await resp.headers.get("content-type")) || "";
            if (!ct.includes("text/html")) throw new Error("non-html");
            html = await resp.text();
          }
          insertNote(href, html, this.dataset.level);
          hidePreview();
        } catch (err) {
          window.location.href = href; // fallback to normal navigation
        }
      });
    }
  });
}

/* Setup global preview container */
const previewContainer1 = document.createElement('div');
previewContainer1.classList.add('preview-container');

const previewContainer2 = document.createElement('div');
previewContainer1.appendChild(previewContainer2)
previewContainer2.classList.add('preview-container-2')

const previewContainerArrow = document.createElement('div');
previewContainerArrow.classList.add('preview-container-arrow');
previewContainer1.appendChild(previewContainerArrow);

const previewContainer3 = document.createElement('div');
previewContainer2.appendChild(previewContainer3)
previewContainer3.classList.add('preview-container-3')

const previewContainer4 = document.createElement('div');
previewContainer3.appendChild(previewContainer4)
previewContainer4.classList.add('preview-container-4')
document.getElementsByTagName('body')[0].appendChild(previewContainer1);

/**
 * Show preview container and add preview html. Position content anchor to the given element.
 * @param {string} previewHtml : ;
 * @param {HTMLElement} anchorElement 
 */
function showPreview(previewHtml, anchorElement) {
  let fragment = document.createElement("template");
  fragment.innerHTML = previewHtml;
  let element = fragment.content.querySelector(".page");
  previewContainer4.appendChild(element);

  const previewContainer1Style = getComputedStyle(previewContainer1);
  const previewContainer3Style = getComputedStyle(previewContainer3);
  const previewContainer4Style = getComputedStyle(previewContainer4);

  // Read css properties
  const previewContainerWidth = parseInt(previewContainer1Style.getPropertyValue('--preview-width'), 10);
  const previewContainerHeight = parseInt(previewContainer1Style.getPropertyValue('--preview-max-height'), 10);
  const marginLeft = parseFloat(previewContainer3Style.getPropertyValue('margin-left'), 10);
  const marginTop = parseFloat(previewContainer3Style.getPropertyValue('margin-top'), 10);
  const scale = parseFloat(previewContainer4Style.getPropertyValue('--preview-scale'));
  const arrowBaseWidth = parseInt(previewContainer4Style.getPropertyValue('--arrowBaseWidth'), 10);
  const arrowLength = parseInt(previewContainer4Style.getPropertyValue('--arrowLength'), 10);

  const { x, y, direction, arrowTop } = calculatePreviewElementPosition(previewContainerWidth, previewContainerHeight, marginLeft, marginTop, scale, arrowBaseWidth, arrowLength, anchorElement);
  previewContainer1.style['transform'] = `translate3d(${x}px, ${y}px, 0)`;
  previewContainerArrow.classList.remove('left', 'right');
  previewContainerArrow.classList.add(direction);
  previewContainerArrow.style['top'] = `${arrowTop}px`;

  previewContainer1.classList.add('active');
}

/**
 * @param {number} width
 * @param {number} height
 * @param {number} marginLeft
 * @param {number} marginTop
 * @param {number} scale
 * @param {number} arrowBaseWidth
 * @param {number} arrowLength
 * @param {HTMLElement} anchorElement 
 */
function calculatePreviewElementPosition(width, height, marginLeft, marginTop, scale, arrowBaseWidth, arrowLength, anchorElement) {

  const previewContainerWidth = (width + (marginLeft / scale)) * scale;
  const previewContainerHeight = (height + (marginTop / scale));
  const verticalPadding = 20; // Minimum padding from top/bottom of viewport

  const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

  const { x: anchorX, y: anchorY, width: anchorWidth, height: anchorHeight } = anchorElement.getBoundingClientRect();

  // Vertical positioning with boundary checking
  let previewContainerY = anchorY - (previewContainerHeight / 2) + (anchorHeight / 2);

  // Ensure preview stays within viewport bounds
  if (previewContainerY < verticalPadding) {
    previewContainerY = verticalPadding;
  } else if (previewContainerY + previewContainerHeight > windowHeight - verticalPadding) {
    previewContainerY = windowHeight - previewContainerHeight - verticalPadding;
  }

  let direction = 'left';
  let arrowTop = anchorY - previewContainerY - arrowBaseWidth + (anchorHeight / 2);

  // Clamp arrow position to stay within preview bounds
  const minArrowTop = arrowBaseWidth;
  const maxArrowTop = previewContainerHeight - (arrowBaseWidth * 3);
  arrowTop = Math.max(minArrowTop, Math.min(maxArrowTop, arrowTop));

  // Horizontal positioning
  let previewContainerX = 0;
  if (anchorX < windowWidth / 2) {
    // Left side link, show preview to the right
    previewContainerX = Math.min(windowWidth - previewContainerWidth - 10, anchorX + anchorWidth + 10);
    direction = 'right';
  } else {
    // Right side link, show preview to the left
    previewContainerX = Math.max(10, anchorX - previewContainerWidth - 10);
    direction = 'left';
  }

  return {
    x: previewContainerX,
    y: previewContainerY,
    direction,
    arrowTop
  };
}

/** Hide preview container and remove any children */
function hidePreview() {
  previewContainer1.classList.remove('active');
  Array.from(previewContainer4.children).map(e => previewContainer4.removeChild(e));
}

window.addEventListener("popstate", function (event) {
  // TODO: check state and pop pages if possible, rather than reloading.
  window.location = window.location; // this reloads the page.
});

window.onload = function () {
  initializePage(document.querySelector(".page"));

  let stacks = [];
  uri = URI(window.location);
  if (uri.hasQuery("stackedNotes")) {
    stacks = uri.query(true).stackedNotes;
    if (!Array.isArray(stacks)) {
      stacks = [stacks];
    }
    for (let i = 0; i < stacks.length; i++) {
      fetchNote(stacks[i], i + 1);
    }
  }
};
