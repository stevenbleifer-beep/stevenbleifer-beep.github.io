(function() {
    'use strict';

    var DEFAULTS = { focus: 25, short: 5, long: 15, every: 4, sound: true, auto: false, notify: false, awake: true };
    var LABELS = { focus: 'Focus', short: 'Short break', long: 'Long break' };
    var SETTINGS_KEY = 'sb_pomodoro_settings';
    var STATS_KEY = 'sb_pomodoro_stats';
    var CIRCUMFERENCE = 2 * Math.PI * 90;

    var root = document.getElementById('pomo');
    var ring = document.getElementById('ring');
    var timeEl = document.getElementById('time');
    var phaseEl = document.getElementById('phase');
    var dotsEl = document.getElementById('dots');
    var startBtn = document.getElementById('start');
    var hintEl = document.getElementById('hint');
    var taskEl = document.getElementById('task');
    var modeButtons = Array.prototype.slice.call(document.querySelectorAll('.mode-switch button'));
    var inputs = {
        focus: document.getElementById('set-focus'),
        short: document.getElementById('set-short'),
        long: document.getElementById('set-long'),
        every: document.getElementById('set-every'),
        sound: document.getElementById('set-sound'),
        auto: document.getElementById('set-auto'),
        notify: document.getElementById('set-notify'),
        awake: document.getElementById('set-awake')
    };

    var baseTitle = document.title;
    var settings = load(SETTINGS_KEY, DEFAULTS);
    var stats = todayStats();
    var mode = 'focus';
    var remaining = settings.focus * 60000;   // ms left in the current phase
    var endsAt = 0;                           // wall-clock ms when the phase ends
    var running = false;
    var completedInCycle = 0;
    var ticker = null;
    var audioCtx = null;
    var wakeLock = null;      // active WakeLockSentinel, if the screen is being held awake
    var wakePending = false;  // a request is in flight
    var wakeWanted = false;   // a timer is running, so the screen should stay on

    ring.style.strokeDasharray = CIRCUMFERENCE;

    /* ---------- storage ---------- */

    function load(key, fallback) {
        var out = {}, saved = null;
        try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { saved = null; }
        Object.keys(fallback).forEach(function(k) {
            out[k] = (saved && typeof saved[k] === typeof fallback[k]) ? saved[k] : fallback[k];
        });
        return out;
    }

    function save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    }

    function today() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function todayStats() {
        var s = load(STATS_KEY, { date: '', sessions: 0, minutes: 0 });
        if (s.date !== today()) { s = { date: today(), sessions: 0, minutes: 0 }; }
        return s;
    }

    /* ---------- durations ---------- */

    function clamp(value, lo, hi, fallback) {
        var n = parseInt(value, 10);
        if (isNaN(n)) { return fallback; }
        return Math.min(hi, Math.max(lo, n));
    }

    function duration(m) { return settings[m] * 60000; }

    /* ---------- rendering ---------- */

    function render() {
        var total = duration(mode);
        var left = Math.max(0, remaining);
        var mins = Math.floor(left / 60000);
        var secs = Math.floor((left % 60000) / 1000);
        var stamp = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

        timeEl.textContent = stamp;
        phaseEl.textContent = LABELS[mode];
        ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - (total ? left / total : 0));
        document.title = running ? stamp + ' — ' + LABELS[mode] + ' · Steven Bleifer' : baseTitle;

        startBtn.textContent = running ? 'Pause' : (left < total ? 'Resume' : 'Start');

        modeButtons.forEach(function(b) {
            b.setAttribute('aria-selected', String(b.dataset.mode === mode));
        });
        root.dataset.mode = mode;
    }

    function renderDots() {
        dotsEl.innerHTML = '';
        for (var i = 0; i < settings.every; i++) {
            var dot = document.createElement('span');
            if (i < completedInCycle) { dot.className = 'done'; }
            dotsEl.appendChild(dot);
        }
    }

    function renderStats() {
        document.getElementById('stat-sessions').textContent = stats.sessions;
        document.getElementById('stat-minutes').textContent = stats.minutes;
        document.getElementById('stat-cycle').textContent = Math.max(0, settings.every - completedInCycle);
    }

    function hint(text) { hintEl.textContent = text; }

    /* ---------- screen wake lock ---------- */

    // iOS only grants a wake lock to a visible page, and in practice wants a user
    // gesture — starting a timer is one, so that is where the hold begins.
    function requestWake() {
        if (!settings.awake || !('wakeLock' in navigator)) { return; }
        if (wakeLock || wakePending || document.hidden) { return; }
        wakePending = true;
        navigator.wakeLock.request('screen').then(function(lock) {
            wakePending = false;
            // Bail out if the timer stopped while the request was in flight.
            if (!wakeWanted || !settings.awake) { lock.release().catch(function() {}); return; }
            wakeLock = lock;
            lock.addEventListener('release', function() { wakeLock = null; });
        }).catch(function() {
            // Denied, unsupported, or Low Power Mode — the timer still runs.
            wakePending = false;
        });
    }

    function releaseWake() {
        if (!wakeLock) { return; }
        var lock = wakeLock;
        wakeLock = null;
        lock.release().catch(function() {});
    }

    /* ---------- timer ---------- */

    function tick() {
        remaining = endsAt - Date.now();
        if (remaining <= 0) {
            remaining = 0;
            render();
            finish();
            return;
        }
        render();
    }

    function start() {
        if (running) { return; }
        if (remaining <= 0) { remaining = duration(mode); }
        endsAt = Date.now() + remaining;
        running = true;
        ticker = setInterval(tick, 250);
        wakeWanted = true;
        requestWake();
        render();
        hint('Space to start or pause · R to reset');
    }

    function pause() {
        if (!running) { return; }
        remaining = Math.max(0, endsAt - Date.now());
        running = false;
        clearInterval(ticker);
        ticker = null;
        wakeWanted = false;
        releaseWake();
        render();
    }

    function toggle() { running ? pause() : start(); }

    // Manual switches leave the cycle position alone — only a finished phase moves it.
    function setMode(next) {
        pause();
        mode = next;
        remaining = duration(mode);
        render();
    }

    function reset() {
        pause();
        remaining = duration(mode);
        render();
        hint('Timer reset.');
    }

    // Called when a phase runs out on its own.
    function finish() {
        pause();

        var finished = mode;
        if (finished === 'focus') {
            completedInCycle += 1;
            stats.sessions += 1;
            stats.minutes += settings.focus;
            save(STATS_KEY, stats);
        }

        var next;
        if (finished === 'focus') {
            next = completedInCycle >= settings.every ? 'long' : 'short';
        } else {
            if (finished === 'long') { completedInCycle = 0; }
            next = 'focus';
        }

        chime(finished);
        notify(finished, next);

        mode = next;
        remaining = duration(mode);
        renderDots();
        renderStats();
        render();

        if (settings.auto) { start(); }
        hint(finished === 'focus' ? 'Nice — time for a break.' : 'Break over. Back to it.');
    }

    function skip() {
        var wasFocus = mode === 'focus';
        pause();
        if (wasFocus) {
            mode = completedInCycle >= settings.every ? 'long' : 'short';
        } else {
            if (mode === 'long') { completedInCycle = 0; }
            mode = 'focus';
        }
        remaining = duration(mode);
        renderDots();
        renderStats();
        render();
        hint('Skipped ahead — that round was not counted.');
    }

    /* ---------- alerts ---------- */

    function chime(finished) {
        if (!settings.sound) { return; }
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) { return; }
            if (!audioCtx) { audioCtx = new Ctx(); }
            if (audioCtx.state === 'suspended') { audioCtx.resume(); }

            // Three short tones — rising after focus, falling after a break.
            var notes = finished === 'focus' ? [660, 880, 1100] : [880, 740, 620];
            notes.forEach(function(freq, i) {
                var at = audioCtx.currentTime + i * 0.18;
                var osc = audioCtx.createOscillator();
                var gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.0001, at);
                gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(at);
                osc.stop(at + 0.35);
            });
        } catch (e) { /* audio unavailable */ }
    }

    function notify(finished, next) {
        if (!settings.notify || !('Notification' in window) || Notification.permission !== 'granted') { return; }
        var task = taskEl.value.trim();
        var title = finished === 'focus' ? 'Focus session done' : 'Break over';
        var body = finished === 'focus'
            ? (task ? '“' + task + '” — ' + LABELS[next].toLowerCase() + ' next.' : LABELS[next] + ' next.')
            : 'Back to ' + (task ? '“' + task + '”.' : 'focus.');
        try { new Notification(title, { body: body, tag: 'sb-pomodoro' }); } catch (e) { /* ignore */ }
    }

    /* ---------- settings wiring ---------- */

    function applySettingsToInputs() {
        inputs.focus.value = settings.focus;
        inputs.short.value = settings.short;
        inputs.long.value = settings.long;
        inputs.every.value = settings.every;
        inputs.sound.checked = settings.sound;
        inputs.auto.checked = settings.auto;
        inputs.notify.checked = settings.notify;
        inputs.awake.checked = settings.awake;
    }

    function readDuration(key, lo, hi) {
        return function() {
            var next = clamp(inputs[key].value, lo, hi, DEFAULTS[key]);
            inputs[key].value = next;
            settings[key] = next;
            save(SETTINGS_KEY, settings);

            if (key === 'every') {
                if (completedInCycle > next) { completedInCycle = next; }
                renderDots();
                renderStats();
                return;
            }
            if (key === mode) {
                if (running) {
                    hint('Saved — the new length applies to the next ' + LABELS[mode].toLowerCase() + '.');
                } else {
                    remaining = duration(mode);
                    render();
                }
            }
        };
    }

    ['focus', 'short', 'long'].forEach(function(key) {
        inputs[key].addEventListener('change', readDuration(key, 1, 180));
    });
    inputs.every.addEventListener('change', readDuration('every', 2, 12));

    inputs.sound.addEventListener('change', function() {
        settings.sound = inputs.sound.checked;
        save(SETTINGS_KEY, settings);
        if (settings.sound) { chime('focus'); }
    });

    inputs.auto.addEventListener('change', function() {
        settings.auto = inputs.auto.checked;
        save(SETTINGS_KEY, settings);
    });

    inputs.awake.addEventListener('change', function() {
        settings.awake = inputs.awake.checked;
        save(SETTINGS_KEY, settings);
        // Ticking the box is itself a gesture, so a running timer can grab the lock now.
        if (settings.awake) { if (wakeWanted) { requestWake(); } }
        else { releaseWake(); }
    });

    inputs.notify.addEventListener('change', function() {
        if (!inputs.notify.checked) {
            settings.notify = false;
            save(SETTINGS_KEY, settings);
            return;
        }
        if (!('Notification' in window)) {
            inputs.notify.checked = false;
            hint('This browser does not support desktop notifications.');
            return;
        }
        if (Notification.permission === 'granted') {
            settings.notify = true;
            save(SETTINGS_KEY, settings);
            return;
        }
        if (Notification.permission === 'denied') {
            inputs.notify.checked = false;
            hint('Notifications are blocked for this site in your browser settings.');
            return;
        }
        Notification.requestPermission().then(function(result) {
            settings.notify = result === 'granted';
            inputs.notify.checked = settings.notify;
            save(SETTINGS_KEY, settings);
            if (!settings.notify) { hint('Notification permission was not granted.'); }
        });
    });

    document.getElementById('restore').addEventListener('click', function() {
        settings = Object.assign({}, DEFAULTS);
        save(SETTINGS_KEY, settings);
        applySettingsToInputs();
        completedInCycle = 0;
        pause();
        remaining = duration(mode);
        renderDots();
        renderStats();
        render();
        hint('Defaults restored.');
    });

    /* ---------- controls ---------- */

    startBtn.addEventListener('click', toggle);
    document.getElementById('reset').addEventListener('click', reset);
    document.getElementById('skip').addEventListener('click', skip);

    modeButtons.forEach(function(b) {
        b.addEventListener('click', function() {
            if (b.dataset.mode === mode && !running) { return; }
            setMode(b.dataset.mode);
            hint('Switched to ' + LABELS[mode].toLowerCase() + '.');
        });
    });

    document.addEventListener('keydown', function(e) {
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) { return; }
        if (e.metaKey || e.ctrlKey || e.altKey) { return; }
        if (e.code === 'Space') { e.preventDefault(); toggle(); }
        else if (e.key === 'r' || e.key === 'R') { reset(); }
    });

    // A backgrounded tab can throttle the interval; resync as soon as it returns.
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) { return; }
        if (running) { tick(); }
        // iOS releases the lock whenever the page is hidden; take it back on return.
        if (wakeWanted) { requestWake(); }
    });

    window.addEventListener('beforeunload', function(e) {
        if (!running) { return; }
        e.preventDefault();
        e.returnValue = '';
    });

    if (!('wakeLock' in navigator)) {
        inputs.awake.disabled = true;
        document.getElementById('awake-note').textContent =
            'This browser cannot keep the screen awake. On iPad, use Safari on iPadOS 16.4 or later.';
    }

    applySettingsToInputs();
    if (inputs.awake.disabled) { inputs.awake.checked = false; }
    remaining = duration(mode);
    renderDots();
    renderStats();
    render();
})();
