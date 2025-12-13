// Add copy buttons to all code blocks
document.addEventListener('DOMContentLoaded', function() {
  const codeBlocks = document.querySelectorAll('pre');

  codeBlocks.forEach(function(codeBlock) {
    // Skip if button already exists
    if (codeBlock.querySelector('.copy-code-button') ||
        (codeBlock.parentElement && codeBlock.parentElement.querySelector('.copy-code-button'))) {
      return;
    }

    // Create copy button
    const button = document.createElement('button');
    button.className = 'copy-code-button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');

    // Add click handler
    button.addEventListener('click', function() {
      const code = codeBlock.querySelector('code');
      const text = code ? code.textContent : codeBlock.textContent;

      // Copy to clipboard
      navigator.clipboard.writeText(text).then(function() {
        // Show success feedback
        button.textContent = 'Copied!';
        button.classList.add('copied');

        // Reset after 2 seconds
        setTimeout(function() {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      }).catch(function(err) {
        console.error('Failed to copy:', err);
        button.textContent = 'Failed';
        setTimeout(function() {
          button.textContent = 'Copy';
        }, 2000);
      });
    });

    // Add button to .highlight wrapper if it exists, otherwise to pre
    const container = codeBlock.closest('.highlight') || codeBlock;
    container.appendChild(button);
  });
});
