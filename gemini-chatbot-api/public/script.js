const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitButton = form.querySelector('button[type="submit"]');
const conversation = [];

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  const loadingMessage = appendLoadingMessage();
  input.disabled = true;
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation: [
          ...conversation,
          { role: 'user', text: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from server.');
    }

    const data = await response.json();
    if (typeof data.result !== 'string' || !data.result.trim()) {
      showMessage(loadingMessage, 'Sorry, no response received.');
      return;
    }

    loadingMessage.replaceChildren();
    renderMarkdown(loadingMessage, data.result);
    conversation.push(
      { role: 'user', text: userMessage },
      { role: 'model', text: data.result }
    );
  } catch {
    showMessage(loadingMessage, 'Failed to get response from server.');
  } finally {
    input.disabled = false;
    submitButton.disabled = false;
    input.focus();
  }
});

function appendMessage(sender, text) {
  const message = document.createElement('div');
  message.classList.add('message', sender);
  message.textContent = text;
  chatBox.appendChild(message);
  scrollToLatestMessage();
  return message;
}

function appendLoadingMessage() {
  const message = document.createElement('div');
  message.classList.add('message', 'bot', 'loading-message');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-label', 'AI is typing');

  const loadingIndicator = document.createElement('span');
  loadingIndicator.classList.add('loading-indicator');
  loadingIndicator.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 3; index += 1) {
    loadingIndicator.appendChild(document.createElement('span'));
  }

  message.appendChild(loadingIndicator);
  chatBox.appendChild(message);
  scrollToLatestMessage();
  return message;
}

function showMessage(element, text) {
  element.classList.remove('loading-message');
  element.removeAttribute('aria-label');
  element.textContent = text;
}

function renderMarkdown(container, markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      index += 1;
      const codeLines = [];
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = codeLines.join('\n');
      pre.appendChild(code);
      container.appendChild(pre);
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const element = document.createElement(`h${heading[1].length}`);
      appendInlineMarkdown(element, heading[2]);
      container.appendChild(element);
      index += 1;
      continue;
    }

    if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      container.appendChild(document.createElement('hr'));
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      const quote = document.createElement('blockquote');
      renderMarkdown(quote, quoteLines.join('\n'));
      container.appendChild(quote);
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const list = document.createElement(ordered ? 'ol' : 'ul');

      while (index < lines.length) {
        const item = lines[index].match(/^\s*([-*+]|\d+[.)])\s+(.+)$/);
        if (!item || /^\d/.test(item[1]) !== ordered) break;

        const listItem = document.createElement('li');
        appendInlineMarkdown(listItem, item[2]);
        list.appendChild(listItem);
        index += 1;
      }

      container.appendChild(list);
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\s{0,3}(?:#{1,6}\s|```|>|(?:-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[index]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    const paragraph = document.createElement('p');
    appendInlineMarkdown(paragraph, paragraphLines.join('\n'));
    container.appendChild(paragraph);
  }

  scrollToLatestMessage();
}

function appendInlineMarkdown(container, text) {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    container.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));

    const token = match[0];
    let element;

    if (token.startsWith('`')) {
      element = document.createElement('code');
      element.textContent = token.slice(1, -1);
    } else if (token.startsWith('**') || token.startsWith('__')) {
      element = document.createElement('strong');
      element.textContent = token.slice(2, -2);
    } else if (token.startsWith('~~')) {
      element = document.createElement('del');
      element.textContent = token.slice(2, -2);
    } else if (token.startsWith('*') || token.startsWith('_')) {
      element = document.createElement('em');
      element.textContent = token.slice(1, -1);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const safeUrl = getSafeLinkUrl(link[2]);
      if (!safeUrl) {
        container.appendChild(document.createTextNode(token));
        lastIndex = match.index + token.length;
        continue;
      }

      element = document.createElement('a');
      element.href = safeUrl;
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
      element.textContent = link[1];
    }

    container.appendChild(element);
    lastIndex = match.index + token.length;
  }

  container.appendChild(document.createTextNode(text.slice(lastIndex)));
}

function getSafeLinkUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

function scrollToLatestMessage() {
  chatBox.scrollTop = chatBox.scrollHeight;
}
