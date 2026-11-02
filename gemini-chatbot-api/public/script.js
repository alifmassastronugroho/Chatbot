






let conversation = [];
let shownFacilityIds = [];
let selectedFiles = [];

let userLocation = {
  lat: -6.1754,
  lng: 106.8272
};

const INITIAL_SUGGESTIONS = [
  'Pesankan kunjungan ke gym',
  'Buatkan jadwal workout atau gym'
];

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const attachmentInput = document.getElementById('attachment-input');
const attachmentPreviewList = document.getElementById('attachment-preview-list');
const attachBtn = document.getElementById('attach-btn');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const moreBtn = document.getElementById('btn-more');
const dropdownMenu = document.getElementById('dropdown-menu');
const backBtn = document.getElementById('btn-back');
const menuReset = document.getElementById('menu-reset');
const menuTheme = document.getElementById('menu-theme');
const menuThemeText = document.getElementById('menu-theme-text');
const menuLocation = document.getElementById('menu-location');
const locationStatusText = document.getElementById('location-status-text');
const quickRepliesTray = document.getElementById('quick-replies-tray');
const metaThemeColor = document.getElementById('meta-theme-color');
const statusTime = document.getElementById('status-time');

const bookingModal = document.getElementById('booking-modal');
const bookingForm = document.getElementById('booking-form');
const modalClose = document.getElementById('modal-close');
const modalFacilityId = document.getElementById('modal-facility-id');
const bookingFacilityName = document.getElementById('booking-facility-name');
const bookingDate = document.getElementById('booking-date');
const bookingTime = document.getElementById('booking-time');


document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initGeolocation();
  initInitialChat();
  setupEventListeners();
});

function initClock() {
  const updateTime = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    statusTime.textContent = `${hours}:${formattedMinutes}`;
  };
  updateTime();
  setInterval(updateTime, 30000);
}

function getFormattedTimestamp() {
  const now = new Date();
  return now.toLocaleString('id-ID', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}


function initTheme() {
  const savedTheme = localStorage.getItem('fitbot_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fitbot_theme', theme);

  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
  }

  if (menuThemeText) {
    menuThemeText.textContent = `Mode gelap: ${theme === 'dark' ? 'Aktif' : 'Mati'}`;
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}


function initGeolocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        if (locationStatusText) {
          locationStatusText.textContent = `GPS: ${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}`;
        }
      },
      (error) => {
        console.warn('Geolocation permission not granted or error, using default location (Jakarta).', error);
        if (locationStatusText) {
          locationStatusText.textContent = 'Lokasi: Jakarta (bawaan)';
        }
      },
      { timeout: 7000 }
    );
  }
}


function initInitialChat() {
  chatBox.innerHTML = '';
  conversation = [];
  shownFacilityIds = [];
  quickRepliesTray.innerHTML = '';

  appendTimestamp(getFormattedTimestamp());

  const greetingText = "Halo, saya Gymmy! 👋 Saya asisten olahraga pribadi Anda. Ada yang bisa saya bantu?";
  const botRow = appendBotMessage(greetingText);

  const chipsContainer = document.createElement('div');
  chipsContainer.className = 'suggestion-chips-container';

  INITIAL_SUGGESTIONS.forEach((promptText) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'action-pill';
    pill.textContent = promptText;
    pill.addEventListener('click', () => {
      handleUserSubmit(promptText);
    });
    chipsContainer.appendChild(pill);
  });

  chatBox.appendChild(chipsContainer);
  scrollToBottom();
}

function appendTimestamp(text) {
  const divider = document.createElement('div');
  divider.className = 'chat-timestamp';
  divider.textContent = text;
  chatBox.appendChild(divider);
}

function appendUserMessage(text, files = []) {
  const row = document.createElement('div');
  row.className = 'message-row user';

  const group = document.createElement('div');
  group.className = 'message-group';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  if (text) {
    bubble.textContent = text;
  }
  if (files.length > 0) {
    if (text) bubble.classList.add('message-bubble-with-attachments');
    renderAttachments(bubble, files);
    const attachmentNotice = document.createElement('small');
    attachmentNotice.className = 'attachment-notice';
    attachmentNotice.textContent = 'Lampiran hanya ditampilkan, tidak dikirim untuk dianalisis.';
    bubble.appendChild(attachmentNotice);
  }

  group.appendChild(bubble);
  row.appendChild(group);
  chatBox.appendChild(row);
  scrollToBottom();
  return row;
}

function renderAttachments(container, files, removable = false) {
  const list = document.createElement('div');
  list.className = removable ? 'attachment-preview-list' : 'message-attachment-list';

  files.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = removable ? 'attachment-preview-item' : 'message-attachment-item';

    const typeLabel = document.createElement('span');
    typeLabel.className = 'attachment-type-label';
    typeLabel.textContent = file.type.startsWith('image/')
      ? 'Gambar'
      : file.type.startsWith('video/')
        ? 'Video'
        : 'File';

    const fileName = document.createElement('span');
    fileName.className = 'attachment-file-name';
    fileName.textContent = file.name;
    fileName.title = file.name;

    item.append(typeLabel, fileName);

    if (removable) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'attachment-remove-btn';
      removeButton.textContent = '×';
      removeButton.setAttribute('aria-label', `Hapus lampiran ${file.name}`);
      removeButton.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        renderSelectedAttachments();
      });
      item.appendChild(removeButton);
    }

    list.appendChild(item);
  });

  container.appendChild(list);
}

function renderSelectedAttachments() {
  attachmentPreviewList.replaceChildren();
  if (selectedFiles.length > 0) {
    renderAttachments(attachmentPreviewList, selectedFiles, true);
  }
}

function appendBotMessage(markdownText) {
  const row = document.createElement('div');
  row.className = 'message-row bot';

  const avatar = document.createElement('div');
  avatar.className = 'bot-mini-avatar';
  avatar.innerHTML = `
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M11 18h14" stroke="#007aff" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 13v10M5 15v6M28 13v10M31 15v6" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;

  const group = document.createElement('div');
  group.className = 'message-group';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  renderMarkdown(bubble, markdownText);

  group.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(group);
  chatBox.appendChild(row);
  scrollToBottom();
  return row;
}

function appendTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'message-row bot typing-row';
  row.id = 'typing-indicator-row';

  const avatar = document.createElement('div');
  avatar.className = 'bot-mini-avatar';
  avatar.innerHTML = `
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M11 18h14" stroke="#007aff" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 13v10M5 15v6M28 13v10M31 15v6" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;

  const bubble = document.createElement('div');
  bubble.className = 'typing-indicator-bubble';
  bubble.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
  return row;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator-row');
  if (indicator) {
    indicator.remove();
  }
}


function renderFacilityCard(facility) {
  if (facility.id && !shownFacilityIds.includes(facility.id)) {
    shownFacilityIds.push(facility.id);
  }

  const card = document.createElement('div');
  card.className = 'facility-card';

  const title = document.createElement('div');
  title.className = 'facility-card-title';
  title.textContent = `${facility.name} di ${facility.address}`;
  title.addEventListener('click', () => openBookingModal(facility));

  const infoRow = document.createElement('div');
  infoRow.className = 'facility-card-info';

  const distanceText = facility.distance !== undefined
    ? `${facility.distance} meter`
    : '';

  const priceText = facility.price || '';

  if (distanceText && priceText) {
    infoRow.innerHTML = `<span>${distanceText}</span> <span class="facility-info-bullet">•</span> <span>${priceText}</span>`;
  } else {
    infoRow.textContent = distanceText || priceText;
  }

  const tagsRow = document.createElement('div');
  tagsRow.className = 'facility-tags-row';

  const facilitiesList = Array.isArray(facility.facilities) ? facility.facilities : ['Gym'];
  facilitiesList.forEach((facName) => {
    const badge = document.createElement('span');
    badge.className = 'facility-tag-badge';

    const lower = facName.toLowerCase();
    let iconSvg = '';

    if (lower.includes('gym') || lower.includes('fitness')) {
      iconSvg = `
        <svg class="tag-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12"/>
        </svg>`;
    } else if (lower.includes('spa') || lower.includes('wellness') || lower.includes('sauna')) {
      iconSvg = `
        <svg class="tag-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>`;
    } else if (lower.includes('pool') || lower.includes('swim') || lower.includes('kolam')) {
      iconSvg = `
        <svg class="tag-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        </svg>`;
    } else {
      iconSvg = `
        <svg class="tag-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`;
    }

    badge.innerHTML = `${facName} ${iconSvg}`;
    tagsRow.appendChild(badge);
  });

  const bookBtn = document.createElement('button');
  bookBtn.type = 'button';
  bookBtn.className = 'facility-book-btn';
  bookBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
    <span>Pesan kunjungan</span>
  `;
  bookBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openBookingModal(facility);
  });

  card.appendChild(title);
  card.appendChild(infoRow);
  card.appendChild(tagsRow);
  card.appendChild(bookBtn);

  chatBox.appendChild(card);
  scrollToBottom();
}

function renderBookingCard(booking) {
  const card = document.createElement('div');
  card.className = 'booking-card';

  card.innerHTML = `
    <div class="booking-header">
      <svg class="booking-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <div class="booking-title">Pemesanan berhasil!</div>
    </div>
    <div class="booking-details-grid">
      <div>
        <div class="booking-field-label">Fasilitas</div>
        <div class="booking-field-value">${booking.facilityName || 'Gym'}</div>
      </div>
      <div>
        <div class="booking-field-label">Status</div>
        <div class="booking-field-value" style="color: #16a34a;">Dikonfirmasi</div>
      </div>
      <div>
        <div class="booking-field-label">Tanggal</div>
        <div class="booking-field-value">${booking.date || '-'}</div>
      </div>
      <div>
        <div class="booking-field-label">Waktu</div>
        <div class="booking-field-value">${booking.time || '-'}</div>
      </div>
    </div>
    <div style="font-size: 11.5px; color: var(--text-subtitle); margin-top: 2px;">
      ID pemesanan: <strong>${booking.id}</strong>
    </div>
  `;

  chatBox.appendChild(card);
  scrollToBottom();
}


function renderQuickReplies(replies) {
  quickRepliesTray.innerHTML = '';
  if (!Array.isArray(replies) || replies.length === 0) return;

  const chipsContainer = document.createElement('div');
  chipsContainer.className = 'suggestion-chips-container';

  replies.forEach((text) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'action-pill';
    pill.textContent = text;
    pill.addEventListener('click', () => {
      handleUserSubmit(text);
    });
    chipsContainer.appendChild(pill);
  });

  chatBox.appendChild(chipsContainer);
  scrollToBottom();
}


async function handleUserSubmit(userText) {
  const message = userText || userInput.value.trim();
  const files = userText ? [] : [...selectedFiles];
  if (!message && files.length === 0) return;

  appendUserMessage(message, files);
  userInput.value = '';
  selectedFiles = [];
  renderSelectedAttachments();
  userInput.focus();

  if (!message) {
    appendBotMessage('Lampiran hanya ditampilkan di chat dan belum dikirim ke Gymmy untuk dianalisis.');
    return;
  }

  appendTypingIndicator();
  setFormDisabled(true);

  try {
    const payload = {
      conversation: [
        ...conversation,
        { role: 'user', text: message }
      ],
      location: userLocation,
      shownIds: shownFacilityIds
    };

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = response.status === 429
        ? 'Kuota layanan AI sedang habis. Silakan coba lagi beberapa saat lagi.'
        : errorData.error || 'Terjadi kesalahan. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    removeTypingIndicator();

    const botReply = data.result || data.reply || '';

    if (botReply.trim()) {
      appendBotMessage(botReply);
      conversation.push(
        { role: 'user', text: message },
        { role: 'model', text: botReply }
      );
    } else {
      conversation.push({ role: 'user', text: message });
    }

    if (Array.isArray(data.cards) && data.cards.length > 0) {
      data.cards.forEach((card) => {
        if (card.type === 'facility') {
          renderFacilityCard(card);
        } else if (card.type === 'booking') {
          renderBookingCard(card);
        }
      });
    }

    if (Array.isArray(data.quickReplies) && data.quickReplies.length > 0) {
      renderQuickReplies(data.quickReplies);
    }

  } catch (error) {
    removeTypingIndicator();
    console.error('Chat error:', error);
    const errorMessage = error instanceof TypeError
      ? 'Tidak dapat terhubung ke Gymmy. Silakan coba lagi.'
      : error.message || 'Terjadi kesalahan. Silakan coba lagi.';
    appendBotMessage(`⚠️ ${errorMessage}`);
  } finally {
    setFormDisabled(false);
    userInput.focus();
    scrollToBottom();
  }
}

function setFormDisabled(disabled) {
  userInput.disabled = disabled;
  sendBtn.disabled = disabled;
  if (micBtn) micBtn.disabled = disabled;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}


function openBookingModal(facility) {
  modalFacilityId.value = facility.id;
  bookingFacilityName.value = `${facility.name} (${facility.address})`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  bookingDate.value = tomorrow.toISOString().slice(0, 10);
  bookingDate.min = new Date().toISOString().slice(0, 10);

  bookingModal.classList.remove('hidden');
}

function closeBookingModal() {
  bookingModal.classList.add('hidden');
}


function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micBtn.addEventListener('click', () => {
      userInput.placeholder = 'Pengenalan suara tidak didukung di peramban ini';
      setTimeout(() => {
        userInput.placeholder = 'Ketik pesan...';
      }, 3000);
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let isListening = false;

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
      isListening = true;
      micBtn.classList.add('recording');
      userInput.placeholder = 'Mendengarkan suara Anda...';
    } catch (e) {
      console.warn('Speech error:', e);
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    userInput.focus();
  };

  recognition.onspeechend = () => {
    recognition.stop();
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('recording');
    userInput.placeholder = 'Ketik pesan...';
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    isListening = false;
    micBtn.classList.remove('recording');
    userInput.placeholder = 'Ketik pesan...';
  };
}


function setupEventListeners() {
  attachBtn.addEventListener('click', () => {
    attachmentInput.click();
  });

  attachmentInput.addEventListener('change', () => {
    selectedFiles.push(...Array.from(attachmentInput.files || []));
    renderSelectedAttachments();
    attachmentInput.value = '';
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserSubmit();
  });

  themeToggleBtn.addEventListener('click', toggleTheme);

  backBtn.addEventListener('click', () => {
    if (confirm('Mulai percakapan baru dengan Gymmy?')) {
      initInitialChat();
    }
  });

  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target) && e.target !== moreBtn) {
      dropdownMenu.classList.add('hidden');
    }
  });

  menuReset.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
    initInitialChat();
  });

  menuTheme.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
    toggleTheme();
  });

  menuLocation.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
    const newCoords = prompt('Masukkan koordinat (lintang, bujur):', `${userLocation.lat}, ${userLocation.lng}`);
    if (newCoords) {
      const parts = newCoords.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        userLocation = { lat: parts[0], lng: parts[1] };
        locationStatusText.textContent = `GPS kustom: ${parts[0].toFixed(2)}, ${parts[1].toFixed(2)}`;
        appendBotMessage(`📍 Lokasi diperbarui ke (${parts[0]}, ${parts[1]}). Cari fasilitas lagi untuk melihat jarak terbaru!`);
      }
    }
  });

  modalClose.addEventListener('click', closeBookingModal);

  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
      closeBookingModal();
    }
  });

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const facilityName = bookingFacilityName.value.split('(')[0].trim();
    const facilityId = modalFacilityId.value;
    const date = bookingDate.value;
    const time = bookingTime.value;

    closeBookingModal();

    const bookingPrompt = `Pesankan kunjungan ke ${facilityName} (ID: ${facilityId}) pada tanggal ${date} pukul ${time}`;
    handleUserSubmit(bookingPrompt);
  });

  initSpeechRecognition();
}


function renderMarkdown(container, markdown) {
  if (!markdown) return;
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
    appendInlineMarkdown(paragraph, paragraphLines.join(' '));
    container.appendChild(paragraph);
  }
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
      if (link) {
        element = document.createElement('a');
        element.href = link[2];
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
        element.textContent = link[1];
      }
    }

    if (element) {
      container.appendChild(element);
    }
    lastIndex = match.index + token.length;
  }

  container.appendChild(document.createTextNode(text.slice(lastIndex)));
}
