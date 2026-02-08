// Popup script to handle UI interactions and save settings

document.addEventListener('DOMContentLoaded', async () => {
    // Load saved settings
    const settings = await chrome.storage.sync.get({
        hideReels: true,
        hideStories: true,
        hideSuggested: true,
        enableBlacklist: false,
        blacklistWords: []
    });

    // Set toggle states
    document.getElementById('toggleReels').checked = settings.hideReels;
    document.getElementById('toggleStories').checked = settings.hideStories;
    document.getElementById('toggleSuggested').checked = settings.hideSuggested;
    document.getElementById('toggleBlacklist').checked = settings.enableBlacklist;

    // Load blacklist words
    updateWordList(settings.blacklistWords);

    // Toggle event listeners
    document.getElementById('toggleReels').addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ hideReels: e.target.checked });
        notifyContentScript();
    });

    document.getElementById('toggleStories').addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ hideStories: e.target.checked });
        notifyContentScript();
    });

    document.getElementById('toggleSuggested').addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ hideSuggested: e.target.checked });
        notifyContentScript();
    });

    document.getElementById('toggleBlacklist').addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ enableBlacklist: e.target.checked });
        notifyContentScript();
    });

    // Add word button
    document.getElementById('addWordBtn').addEventListener('click', addWord);
    
    // Add word on Enter key
    document.getElementById('wordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addWord();
        }
    });

    function addWord() {
        const input = document.getElementById('wordInput');
        const word = input.value.trim().toLowerCase();
        
        if (!word) return;

        chrome.storage.sync.get({ blacklistWords: [] }, (result) => {
            const words = result.blacklistWords;
            if (!words.includes(word)) {
                words.push(word);
                chrome.storage.sync.set({ blacklistWords: words }, () => {
                    updateWordList(words);
                    input.value = '';
                    notifyContentScript();
                });
            } else {
                alert('Word already in blacklist');
            }
        });
    }

    function removeWord(word) {
        chrome.storage.sync.get({ blacklistWords: [] }, (result) => {
            const words = result.blacklistWords.filter(w => w !== word);
            chrome.storage.sync.set({ blacklistWords: words }, () => {
                updateWordList(words);
                notifyContentScript();
            });
        });
    }

    function updateWordList(words) {
        const wordList = document.getElementById('wordList');
        
        if (words.length === 0) {
            wordList.innerHTML = '<div class="empty-state">No words added yet</div>';
            return;
        }

        wordList.innerHTML = words.map(word => `
            <div class="word-item">
                <span class="word-text">${escapeHtml(word)}</span>
                <button class="remove-btn" data-word="${escapeHtml(word)}">Remove</button>
            </div>
        `).join('');

        // Add remove button listeners
        wordList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                removeWord(btn.getAttribute('data-word'));
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function notifyContentScript() {
        // Send message to content script to reload settings
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && (tabs[0].url.includes('facebook.com') || tabs[0].url.includes('fb.com'))) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadSettings' }).catch(err => {
                    console.log('FBCleaner: Content script not ready yet, settings will apply on next page load');
                });
            }
        });
    }
});

