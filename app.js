
let currentDay = 'Dia 1';
let currentStage = 'Norte';
let itineraryDay = 'Dia 1';
let favorites = JSON.parse(localStorage.getItem('cr2026_favs')) || [];

let isTransitioning = false;

function switchMainView(view) {
    if (isTransitioning) return;

    const explorer = document.getElementById('view-explorer');
    const itinerary = document.getElementById('view-itinerary');
    const isExplorerActive = explorer.style.display !== 'none';
    const targetIsExplorer = (view === 'Dia 1' || view === 'Dia 2');

    // Determine indices for direction calculation
    // Dia 1 = 0, Dia 2 = 1, Itinerario = 2
    const viewOrder = { 'Dia 1': 0, 'Dia 2': 1, 'Itinerario': 2 };
    const currentViewName = !isExplorerActive ? 'Itinerario' : currentDay;

    // Optimization
    if (currentViewName === view) return;

    const currentIndex = viewOrder[currentViewName];
    const newIndex = viewOrder[view];
    const direction = newIndex > currentIndex ? 'forward' : 'backward';

    isTransitioning = true;
    const activeEl = isExplorerActive ? explorer : itinerary;

    // Set exit animation
    const exitClass = direction === 'forward' ? 'page-exit-left' : 'page-exit-right';
    const enterClass = direction === 'forward' ? 'page-enter-right' : 'page-enter-left';

    // Clean previous classes
    activeEl.classList.remove('fade-in', 'page-enter-left', 'page-enter-right');
    activeEl.classList.add(exitClass);

    // Update buttons immediately
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (view === 'Itinerario') {
        document.getElementById('btn-itinerary').classList.add('active');
    } else {
        document.getElementById(view === 'Dia 1' ? 'btn-dia1' : 'btn-dia2').classList.add('active');
    }

    setTimeout(() => {
        activeEl.style.display = 'none';
        activeEl.classList.remove(exitClass);

        if (targetIsExplorer) {
            explorer.style.display = 'block';
            if (currentDay !== view || !isExplorerActive) {
                currentDay = view;
                currentStage = Object.keys(fullData[currentDay])[0];
                renderStages();
                renderContent();
            }
            explorer.classList.remove('fade-in', 'page-exit-left', 'page-exit-right');
            explorer.classList.add(enterClass);
        } else {
            itinerary.style.display = 'block';
            renderItinerary();
            itinerary.classList.remove('fade-in', 'page-exit-left', 'page-exit-right');
            itinerary.classList.add(enterClass);
        }

        // Cleanup enter class after animation to avoid conflicts on next transition
        setTimeout(() => {
            const newActive = targetIsExplorer ? explorer : itinerary;
            newActive.classList.remove(enterClass);
            isTransitioning = false;
        }, 250);

    }, 150); // Matches exit duration
}

function toggleFav(artist, time, stage, day, btnExample) {
    const id = `${day}-${stage}-${artist}-${time}`;
    const idx = favorites.findIndex(f => f.id === id);
    if (idx > -1) favorites.splice(idx, 1);
    else favorites.push({ id, artist, time, stage, day });

    localStorage.setItem('cr2026_favs', JSON.stringify(favorites));

    // If we are in the main explorer (list) view, avoid re-rendering to prevent animations
    // Just toggle the class on the button itself if passed
    if (document.getElementById('view-explorer').style.display !== 'none' && btnExample) {
        btnExample.classList.toggle('active');
        return;
    }

    // If we are in Itinerary, we MUST re-render to remove the card or update list
    if (document.getElementById('view-itinerary').style.display === 'block') {
        renderItinerary();
    } else {
        // Fallback for search or other cases where we might want to re-render but usually above covers it
        renderContent();
    }
}

function renderContent() {
    const list = document.getElementById('mainTarget');
    const events = fullData[currentDay][currentStage] || [];
    list.innerHTML = events.map((ev, i) => {
        const isFav = favorites.some(f => f.id === `${currentDay}-${currentStage}-${ev.artist}-${ev.time}`);
        return `
            <div class="card slide-up" style="animation-delay: ${i * 0.03}s">
                <div class="card-info"><h4>${ev.artist}</h4><p>${currentStage}</p></div>
                <div class="card-actions">
                    <div class="time">${ev.time}</div>
                    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${ev.artist}','${ev.time}','${currentStage}','${currentDay}', this)">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </button>
                </div>
            </div>`;
    }).join('');
}

function parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    // Treat 00:00 to 05:00 as next day (hours 24 to 29)
    const adjustedH = h < 6 ? h + 24 : h;
    return adjustedH * 60 + m;
}

function renderItinerary() {
    const target = document.getElementById('itineraryTarget');
    let dayFavs = favorites.filter(f => f.day === itineraryDay);

    // Improved sorting: late night shows (e.g. 01:00) come after evening shows (e.g. 23:00)
    dayFavs.sort((a, b) => parseTime(a.time) - parseTime(b.time));

    if (dayFavs.length === 0) {
        target.innerHTML = '<p style="padding:40px; text-align:center; color:#999">No has marcado favoritos aún.</p>';
        return;
    }

    let html = '';
    dayFavs.forEach((f, i) => {
        html += `
            <div class="card slide-up" style="animation-delay: ${i * 0.03}s">
                <div class="card-info"><h4>${f.artist}</h4><p>${f.stage}</p></div>
                <div class="card-actions"><div class="time">${f.time}</div></div>
            </div>`;

        if (i < dayFavs.length - 1) {
            const next = dayFavs[i + 1];
            if (next.stage !== f.stage) {
                html += `
                    <div class="walking-card slide-up" style="animation-delay: ${(i * 0.03) + 0.015}s">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 4v16M17 8l-4-4-4 4M17 16l-4 4-4-4"/></svg>
                        Caminar hacia escenario ${next.stage}
                    </div>`;
            }
        }
    });
    target.innerHTML = html;
}

function setItineraryDay(day) {
    itineraryDay = day;
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.toggle('active', b.innerText.includes(day === 'Dia 1' ? '15' : '16')));
    renderItinerary();
}

function renderStages() {
    const bar = document.getElementById('stageList');
    bar.innerHTML = Object.keys(fullData[currentDay]).map(s => `
        <button class="stage-btn ${s === currentStage ? 'active' : ''}" onclick="setStage('${s}')">${s}</button>
    `).join('');
}

function setStage(s) { currentStage = s; renderStages(); renderContent(); }

function doSearch() {
    const q = document.getElementById('artistSearch').value.toLowerCase();
    const list = document.getElementById('mainTarget');
    if (q.length < 2) { renderContent(); return; }

    let matches = [];
    for (let s in fullData[currentDay]) {
        fullData[currentDay][s].forEach(ev => {
            if (ev.artist.toLowerCase().includes(q)) matches.push({ ...ev, s });
        });
    }
    list.innerHTML = matches.map((m, i) => {
        const isFav = favorites.some(f => f.id === `${currentDay}-${m.s}-${m.artist}-${m.time}`);
        return `
            <div class="card slide-up" style="animation-delay: ${i * 0.03}s">
                <div class="card-info"><h4>${m.artist}</h4><p>${m.s}</p></div>
                <div class="card-actions">
                    <div class="time">${m.time}</div>
                    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${m.artist}','${m.time}','${m.s}','${currentDay}', this)">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </button>
                </div>
            </div>`;
    }).join('');
}

// Registro Offline (Solo funciona en https)
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error', err));
    });
}

renderStages();
renderContent();
