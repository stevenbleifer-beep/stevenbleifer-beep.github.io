/* Home page search: a small hand-kept index of the site's pages.
 * Add new pages to the list below. Results are built with textContent,
 * so whatever is typed in the box is never interpreted as HTML. */
(function() {
    'use strict';
    var pages = [
        { url: 'index.html', title: 'Home', keywords: 'home about steven bleifer nyu stern pitt kpmg accounting audit' },
        { url: 'resume.html', title: 'Resume', keywords: 'resume education work experience skills awards kpmg ey ernst young nyu stern pitt accounting audit intern scholarship' },
        { url: 'contact.html', title: 'Contact', keywords: 'contact email message linkedin instagram' },
        { url: 'activity.html', title: 'Library', keywords: 'library activity movies books letterboxd goodreads film reading watching' },
        { url: 'study/', title: 'Study', keywords: 'study cpa isc information systems controls soc security learn ais accounting information systems flashcards practice test exam review nyu stern notes guides' },
        { url: 'pomodoro.html', title: 'Pomodoro', keywords: 'pomodoro timer focus study break tomato productivity clock countdown' },
        { url: 'radio.html', title: 'Wheel Radio', keywords: 'radio wheel car stations music player carplay bluetooth' },
        { url: 'claude-code.html', title: 'Projects', keywords: 'projects claude code built software side projects website study tools pomodoro vinyl hard drives ipod jailbreak automation' },
        { url: 'vinyl-internals.html', title: 'Vinyl internals', keywords: 'vinyl internals technical rsync atomic rename checksum sha256 mp4 parser bash shell quoting race condition code' },
        { url: 'vinyl.html', title: 'Vinyl', keywords: 'vinyl records turntable ripping rip alac apple lossless itunes music library audio project automation backup ipod classic streaming claude code offline' },
        { url: 'groovekeeper.html', title: 'GrooveKeeper', keywords: 'groovekeeper vinyl app mac swift swiftui core ml click detector restoration declick audacity editing envelope compare takes codex chatgpt claude code handover notarized vinylstudio replacement' },
        { url: 'itunes-remote.html', title: 'iTunes Remote', keywords: 'itunes remote ipod classic sync playlist applescript macbook pro headless daemon python appkit swift cover flow album art library xml itunes 10 aqua column browser airplay curator ai local model ollama qwen playlist generator' },
        { url: 'itunes-remote-internals.html', title: 'iTunes Remote Internals', keywords: 'itunes remote internals technical apple events lock osascript applescript xml journal sort rules artwork cache gzip eject cover flow grid tokens models claude code how it works curator embeddings ollama retrieval local llm' },
        { url: 'local-ai.html', title: 'Local AI', keywords: 'local ai llm models ollama lm studio llama.cpp opencode qwen llama 70b gemma speculative decoding mtp draft model benchmark agents aider codex claude code goose crush openrouter budget mac mini m1 max macbook air' },
        { url: 'displays.html', title: 'Displays', keywords: 'displays studio display speakers stereo aggregate device coreaudio latency delay echo brightness true tone night shift menu bar app volume keys mac audio midi setup thunderbolt' }
    ];
    var form = document.getElementById('site-search');
    var input = document.getElementById('site-search-input');
    var out = document.getElementById('site-search-results');
    if (!form || !input || !out) { return; }

    function line(cls, text) {
        var p = document.createElement('p');
        if (cls) { p.className = cls; }
        if (text) { p.textContent = text; }
        return p;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = input.value.trim().toLowerCase().slice(0, 80);
        out.textContent = '';
        if (!q) { out.hidden = true; return; }
        var hits = pages.filter(function(p) {
            return p.title.toLowerCase().indexOf(q) !== -1 || p.keywords.indexOf(q) !== -1;
        });
        if (!hits.length) {
            out.appendChild(line('muted', 'No results for "' + q + '".'));
        } else {
            hits.forEach(function(p) {
                var row = line('', '');
                var a = document.createElement('a');
                a.href = p.url;
                a.textContent = p.title;
                var path = document.createElement('span');
                path.className = 'faint';
                path.textContent = ' /' + p.url;
                row.appendChild(a);
                row.appendChild(path);
                out.appendChild(row);
            });
        }
        out.hidden = false;
    });
})();
