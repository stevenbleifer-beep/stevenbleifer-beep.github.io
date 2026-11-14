/* Library page: renders letterboxd-feed.json and goodreads-feed.json.
 * The feeds originate from third-party RSS, so nothing from them is ever
 * treated as HTML: text goes in via textContent and URLs must be https. */
(function () {
    'use strict';

    function safeUrl(u) {
        try {
            var url = new URL(String(u));
            return url.protocol === 'https:' ? url.href : '';
        } catch (e) { return ''; }
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }

    function extLink(href, text, cls) {
        var a = el('a', cls, text);
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        return a;
    }

    function starRating(num) {
        var full = Math.min(5, Math.max(0, Math.floor(num)));
        var half = (num % 1 >= 0.5 && full < 5) ? 1 : 0;
        var s = '';
        for (var i = 0; i < full; i++) s += '★';
        if (half) s += '½';
        for (var j = 0; j < 5 - full - half; j++) s += '☆';
        return s;
    }

    function message(container, text, profileUrl) {
        container.textContent = '';
        var p = el('p', 'feed-error', text + ' ');
        if (profileUrl) p.appendChild(extLink(profileUrl, 'Visit profile →'));
        container.appendChild(p);
    }

    function render(opts) {
        var container = document.getElementById(opts.id);
        if (!container) return;
        fetch(opts.file + '?v=' + Date.now(), { credentials: 'omit' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var items = data && data.ok && Array.isArray(data[opts.key]) ? data[opts.key] : [];
                if (!items.length) { message(container, opts.empty); return; }
                var ul = el('ul', 'media-list');
                items.slice(0, 20).forEach(function (item) {
                    var li = el('li');
                    var cover = el('div', 'cover');
                    var src = safeUrl(item[opts.image]);
                    if (src) {
                        var img = el('img');
                        img.src = src;
                        img.alt = '';
                        img.loading = 'lazy';
                        img.referrerPolicy = 'no-referrer';
                        cover.appendChild(img);
                    }
                    li.appendChild(cover);

                    var body = el('div', 'body');
                    var href = safeUrl(item.link);
                    var title = String(item.title || 'Untitled');
                    body.appendChild(href ? extLink(href, title, 'title') : el('span', 'title', title));
                    if (item.author) body.appendChild(el('p', 'author', String(item.author)));
                    var rating = parseFloat(item.rating) || 0;
                    if (rating) {
                        var meta = el('p', 'meta');
                        meta.appendChild(el('span', 'stars', starRating(rating)));
                        body.appendChild(meta);
                    }
                    if (item.watched && /^\d{4}-\d{2}-\d{2}$/.test(item.watched)) {
                        var d = new Date(item.watched + 'T12:00:00');
                        body.appendChild(el('p', 'meta', d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })));
                    }
                    li.appendChild(body);
                    ul.appendChild(li);
                });
                container.textContent = '';
                container.appendChild(ul);
                var more = el('p', 'mt-24');
                more.appendChild(extLink(opts.profile, opts.more));
                container.appendChild(more);
            })
            .catch(function () { message(container, opts.failed, opts.profile); });
    }

    render({
        id: 'letterboxd-feed', file: 'letterboxd-feed.json', key: 'films', image: 'poster',
        profile: 'https://letterboxd.com/stevenfred/', more: 'View all on Letterboxd →',
        empty: 'No films found yet.', failed: 'Couldn\'t load Letterboxd feed.'
    });
    render({
        id: 'goodreads-feed', file: 'goodreads-feed.json', key: 'books', image: 'cover',
        profile: 'https://www.goodreads.com/user/show/168719369-steven-bleifer', more: 'View all on Goodreads →',
        empty: 'No books found yet.', failed: 'Couldn\'t load Goodreads feed.'
    });
})();
