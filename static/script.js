let currentMode = '';
let isPlaying = false;
let scheduledStops = [];
let audioContext = null;

// TRANSLATION
function translateText() {
  const text = document.getElementById('textInput')?.value.trim();
  if (!text) {
    alert("Please enter some text or Morse code.");
    return;
  }

  fetch('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
    .then(response => response.json())
    .then(data => {
      const result = data.result;
      const outputElement = document.getElementById('output');
      if (outputElement) outputElement.innerText = result;
      updateHistory(text, result);
      currentMode = /^[.\- /]+$/.test(result) ? 'morse' : 'text';
    })
    .catch(err => {
      console.error('Error during translation:', err);
      alert('Translation failed. Please try again.');
    });
}

// COPY TO CLIPBOARD
function copyToClipboard() {
  const output = document.getElementById('output')?.innerText;
  if (!output) return;

  navigator.clipboard.writeText(output)
    .then(() => alert('Copied to clipboard!'))
    .catch(() => alert('Failed to copy!'));
}

// UPDATE HISTORY + SAVE TO localStorage
function updateHistory(input, result) {
  const itemText = `"${input}" → ${result}`;
  const list = document.getElementById('historyList');

  if (list) {
    const item = createHistoryItem(itemText);
    list.prepend(item);
  }

  let history = JSON.parse(localStorage.getItem('translationHistory')) || [];
  history.unshift(itemText);
  localStorage.setItem('translationHistory', JSON.stringify(history));
}

// CREATE A HISTORY LIST ITEM WITH DELETE BUTTON
function createHistoryItem(text) {
  const li = document.createElement('li');
  li.classList.add('history-item');

  const span = document.createElement('span');
  span.textContent = text;

  const delBtn = document.createElement('button');
  delBtn.textContent = 'delete';
  delBtn.className = 'delete-button';
  delBtn.onclick = function () {
    li.remove();
    deleteHistoryItem(text);
  };

  li.appendChild(span);
  li.appendChild(delBtn);

  return li;
}

// DELETE SINGLE ITEM FROM localStorage
function deleteHistoryItem(text) {
  let history = JSON.parse(localStorage.getItem('translationHistory')) || [];
  history = history.filter(item => item !== text);
  localStorage.setItem('translationHistory', JSON.stringify(history));
}

// LOAD HISTORY from localStorage
function loadHistory() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
  historyList.innerHTML = '';
  history.forEach(item => {
    const li = createHistoryItem(item);
    historyList.appendChild(li);
  });
}

// CLEAR ALL HISTORY
function clearHistory() {
  localStorage.removeItem('translationHistory');
  const historyList = document.getElementById('historyList');
  if (historyList) historyList.innerHTML = '';
}

// PLAY MORSE
function playMorse(morse) {
  stopAudio(); // Clear any previous audio

  const dotDuration = 100;
  const dashDuration = dotDuration * 3;
  const spaceDuration = dotDuration * 7;

  isPlaying = true;
  document.getElementById('stopButton').style.display = 'inline';

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let time = audioContext.currentTime;

  function scheduleBeep(duration) {
    if (!isPlaying) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, time);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(time);
    oscillator.stop(time + duration / 1000);
    scheduledStops.push(oscillator);

    time += (duration + dotDuration) / 1000;
  }

  for (const char of morse) {
    if (!isPlaying) break;
    if (char === '.') scheduleBeep(dotDuration);
    else if (char === '-') scheduleBeep(dashDuration);
    else if (char === ' ') time += dotDuration / 1000;
    else if (char === '/') time += spaceDuration / 1000;
  }

  const hideButtonDelay = (time - audioContext.currentTime) * 1000;
  const timeoutId = setTimeout(() => {
    stopAudio();
  }, hideButtonDelay);
  scheduledStops.push({ stop: () => clearTimeout(timeoutId) });
}

// PLAY TEXT or MORSE
function playCurrentMorse() {
  const output = document.getElementById('output')?.innerText.trim();
  if (!output) return;

  if (isPlaying) return;

  if (currentMode === 'morse') {
    playMorse(output);
  } else if (currentMode === 'text') {
    isPlaying = true;
    document.getElementById('stopButton').style.display = 'inline';

    const utterance = new SpeechSynthesisUtterance(output);
    utterance.onend = stopAudio;
    speechSynthesis.speak(utterance);
    scheduledStops.push(utterance);
  } else {
    alert("Unable to play audio: unknown output format.");
  }
}

// STOP AUDIO
function stopAudio() {
  isPlaying = false;

  if (audioContext) {
    scheduledStops.forEach(obj => {
      try {
        if (typeof obj.stop === 'function') obj.stop();
      } catch (e) { }
    });
    audioContext.close();
    audioContext = null;
  }

  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  scheduledStops = [];
  document.getElementById('stopButton').style.display = 'none';
}


// copy history button in history page
function copyAllHistory() {
  const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
  if (history.length === 0) {
    alert("History is empty.");
    return;
  }

  const historyText = history.join('\n');

  navigator.clipboard.writeText(historyText)
    .then(() => alert("Translation history copied to clipboard!"))
    .catch(() => alert("Failed to copy history."));
}

// THEME TOGGLER
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle('dark-mode');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isDark ? '🌙' : '🌤️';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ON PAGE LOAD
window.onload = function () {
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isDark ? '🌙' : '🌤️';

  loadHistory();
};

// responsive navbar hamburger option
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');

  // Ensure display is properly handled
  if (navLinks.classList.contains('active')) {
    navLinks.style.display = "flex";
  } else {
    navLinks.style.display = "none";
  }
}