// Content script to hide/remove reels, stories, and suggested content from Facebook

(function () {
    let settings = {
        hideReels: true,
        hideStories: true,
        hideSuggested: true,
        enableBlacklist: false,
        blacklistWords: []
    };

    async function loadSettings() {
        try {
            settings = await chrome.storage.sync.get(settings);
        } catch (e) {
            console.warn('FBCleaner: Error loading settings:', e);
        }
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'reloadSettings') {
            runAll();
            return true;
        }
    });

    // Safety check before hiding an element
    function isSafeToHide(el) {
        if (!el || el === document.body || el.tagName === 'HTML') return false;
        if (el.id && /root|app|main/.test(el.id)) return false;
        const feed = el.querySelector('[role="feed"]');
        if (feed && feed.children.length > 5) return false;
        return true;
    }

    function hideElements(selector) {
        document.querySelectorAll(selector).forEach(el => {
            if (isSafeToHide(el)) el.style.display = 'none';
        });
    }

    // --- Reels ---
    function hideReels() {
        hideElements('a[href*="/reels/"]');
        hideElements('div[aria-label="Reels"]');
    }

    // --- Stories ---
    function isProfilePicture(el) {
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        if (ariaLabel.includes("'s story")) return true;

        for (const img of el.querySelectorAll('img')) {
            const br = window.getComputedStyle(img).borderRadius;
            if (br && (br.includes('50%') || br.includes('999')) && el.children.length <= 3) {
                return true;
            }
        }
        return false;
    }

    function hideStories() {
        // Hide the stories section container (not profile pictures)
        document.querySelectorAll('div[aria-label*="Stories" i]').forEach(el => {
            if (el.style.display === 'none' || !isSafeToHide(el) || isProfilePicture(el)) return;

            const storyItems = el.querySelectorAll('div[role="button"][aria-label*="story" i], a[href*="/stories/"]');
            if (storyItems.length >= 2 && el.children.length >= 2) {
                el.style.display = 'none';
            }
        });

        // Hide story viewing dialogs
        hideElements('div[role="dialog"][aria-label*="story" i]');

        // Hide story links inside posts, but not profile picture links
        document.querySelectorAll('a[href*="/stories/"]').forEach(link => {
            const btn = link.closest('div[role="button"]');
            if (btn && isProfilePicture(btn)) return;
            if (link.closest('div[role="article"]')) link.style.display = 'none';
        });
    }

    // --- Suggested / Follow ---
    function findPostContainer(startEl) {
        // Try standard selectors first
        let container = startEl.closest('div[role="article"]')
            || startEl.closest('div[data-pagelet*="FeedUnit"]')
            || startEl.closest('div[data-pagelet*="FeedStory"]');
        if (container) return container;

        // Walk up to find a direct child of the feed
        let el = startEl.parentElement;
        for (let i = 0; el && i < 25; i++, el = el.parentElement) {
            const parentRole = el.parentElement?.getAttribute('role');
            if (parentRole === 'feed' || parentRole === 'main') return el;
        }

        // Fallback: find a large container that looks like a post
        el = startEl.parentElement;
        for (let i = 0; el && i < 25; i++, el = el.parentElement) {
            if (el.tagName === 'DIV' && el.children.length >= 3) {
                const rect = el.getBoundingClientRect();
                if (rect.height > 200 && !el.querySelector('[role="feed"]')) return el;
            }
        }
        return null;
    }

    function hideSuggested() {
        for (const button of document.querySelectorAll('[role="button"]')) {
            const text = (button.innerText || button.textContent || '').trim();
            if (text !== 'Follow') continue;

            const container = findPostContainer(button);
            if (container && isSafeToHide(container)) {
                container.style.display = 'none';
            }
        }
    }

    // --- Blacklist ---
    function hideBlacklisted() {
        if (!settings.enableBlacklist || !settings.blacklistWords?.length) return;

        const words = settings.blacklistWords.map(w => w.toLowerCase().trim()).filter(Boolean);
        if (!words.length) return;

        const processed = new Set();

        document.querySelectorAll('div[role="article"]').forEach(post => {
            if (processed.has(post) || post.style.display === 'none' || !isSafeToHide(post)) return;

            const text = post.textContent?.toLowerCase() || '';
            if (words.some(w => text.includes(w))) {
                post.style.display = 'none';
                processed.add(post);
            }
        });
    }

    // --- Main ---
    async function runAll() {
        await loadSettings();
        if (settings.hideReels) hideReels();
        if (settings.hideStories) hideStories();
        if (settings.hideSuggested) hideSuggested();
        hideBlacklisted();
    }

    loadSettings().then(runAll);

    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runAll, 100);
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();
