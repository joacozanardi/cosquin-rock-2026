
let currentDay = 'Dia 1';
let currentStage = 'Norte';
let itineraryDay = 'Dia 1';
let favorites = JSON.parse(localStorage.getItem('cr2026_favs')) || [];

let isTransitioning = false;

// --- Time Awareness Simulation ---
// Simulating Feb 15, 2026 at 19:00 (Day 1)
const SIMULATION_MODE = false;
// NOTE: In a real "Auto-Refresh" scenario, simulation mode is weird because the "now" is fixed.
// But to demonstrate the refresh, maybe the user wants to see the clock tick?
// If SIMULATED_DATE is static, "refresh" won't change anything unless we increment the simulation.
// For now, I'll keep it static as requested, but the refresh mechanism will work for real time.
const SIMULATED_DATE = new Date('2026-02-14T19:00:00');

function getCurrentTime() {
    return SIMULATION_MODE ? SIMULATED_DATE : new Date();
}
// ---------------------------------

function switchMainView(view) {
    if (isTransitioning) return;

    const explorer = document.getElementById('view-explorer');
    const itinerary = document.getElementById('view-itinerary');
    const isExplorerActive = explorer.style.display !== 'none';
    const targetIsExplorer = (view === 'Dia 1' || view === 'Dia 2');

    // Determine indices for direction calculation
    const viewOrder = { 'Dia 1': 0, 'Dia 2': 1, 'Itinerario': 2 };
    const currentViewName = !isExplorerActive ? 'Itinerario' : currentDay;

    if (currentViewName === view) return;

    const currentIndex = viewOrder[currentViewName];
    const newIndex = viewOrder[view];
    const direction = newIndex > currentIndex ? 'forward' : 'backward';

    isTransitioning = true;
    const activeEl = isExplorerActive ? explorer : itinerary;

    const exitClass = direction === 'forward' ? 'page-exit-left' : 'page-exit-right';
    const enterClass = direction === 'forward' ? 'page-enter-right' : 'page-enter-left';

    activeEl.classList.remove('fade-in', 'page-enter-left', 'page-enter-right');
    activeEl.classList.add(exitClass);

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
                renderContent(/* animate= */ true);
            }
            explorer.classList.remove('fade-in', 'page-exit-left', 'page-exit-right');
            explorer.classList.add(enterClass);
        } else {
            itinerary.style.display = 'block';
            renderItinerary(/* animate= */ true);
            itinerary.classList.remove('fade-in', 'page-exit-left', 'page-exit-right');
            itinerary.classList.add(enterClass);
        }

        setTimeout(() => {
            const newActive = targetIsExplorer ? explorer : itinerary;
            newActive.classList.remove(enterClass);
            isTransitioning = false;
        }, 250);

    }, 150);
}

function toggleFav(artist, time, stage, day, btnExample) {
    const id = `${day}-${stage}-${artist}-${time}`;
    const idx = favorites.findIndex(f => f.id === id);
    if (idx > -1) favorites.splice(idx, 1);
    else favorites.push({ id, artist, time, stage, day });

    localStorage.setItem('cr2026_favs', JSON.stringify(favorites));

    if (document.getElementById('view-explorer').style.display !== 'none' && btnExample) {
        btnExample.classList.toggle('active');
        return;
    }

    // Force re-render with animation false to keep it snappy but correct
    if (document.getElementById('view-itinerary').style.display === 'block') {
        renderItinerary(false);
    } else {
        renderContent(false);
    }
}

function parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const adjustedH = h < 6 ? h + 24 : h;
    return adjustedH * 60 + m;
}

function formatCountdown(minutes) {
    if (minutes < 60) return `En ${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `En ${h} ${h === 1 ? 'hora' : 'horas'}`;
    return `En ${h}h ${m}m`;
}

function getEventStatuses(events, day) {
    const now = getCurrentTime();
    const showTargetDate = day === 'Dia 1' ? 14 : 15;

    if (now.getDate() !== showTargetDate) {
        const status = now.getDate() > showTargetDate ? 'past' : 'future';
        return events.map(() => status);
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const adjustedCurrent = now.getHours() < 6 ? currentMinutes + (24 * 60) : currentMinutes;

    let activeIndex = -1;
    for (let i = 0; i < events.length; i++) {
        const evMinutes = parseTime(events[i].time);
        if (adjustedCurrent >= evMinutes) {
            activeIndex = i;
        }
    }

    return events.map((_, i) => {
        if (i < activeIndex) return 'past';
        if (i === activeIndex) return 'live';
        return 'future';
    });
}

function renderContent(animate = true) {
    const list = document.getElementById('mainTarget');
    const events = fullData[currentDay][currentStage] || [];
    const statuses = getEventStatuses(events, currentDay);

    const now = getCurrentTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const adjustedCurrent = now.getHours() < 6 ? currentMinutes + (24 * 60) : currentMinutes;

    list.innerHTML = events.map((ev, i) => {
        const isFav = favorites.some(f => f.id === `${currentDay}-${currentStage}-${ev.artist}-${ev.time}`);
        const status = statuses[i];

        let cardClass = 'card';
        if (status === 'past') cardClass += ' past';
        if (status === 'live') cardClass += ' live';
        // Add slide-up only if animate is true
        if (animate) cardClass += ' slide-up';

        // Retain animation delay style only if animating, else remove it or keep it (harmless without class)
        const animDelay = animate ? `style="animation-delay: ${i * 0.03}s"` : '';

        let badge = '';
        if (status === 'live') {
            badge = '<div class="live-badge">AHORA</div>';
        } else if (status === 'future') {
            const showTargetDate = currentDay === 'Dia 1' ? 14 : 15;
            if (now.getDate() === showTargetDate) {
                const showMinutes = parseTime(ev.time);
                const diff = showMinutes - adjustedCurrent;
                if (diff > 0) {
                    badge = `<div class="live-badge" style="background:var(--fav); animation:none; color:black">${formatCountdown(diff)}</div>`;
                }
            }
        }

        return `
            <div class="${cardClass}" ${animDelay} data-status="${status}">
                ${badge}
                <div class="card-info"><h4>${ev.artist}</h4><p>${currentStage}</p></div>
                <div class="card-actions">
                    <div class="time">${ev.time}</div>
                    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${ev.artist}','${ev.time}','${currentStage}','${currentDay}', this)">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </button>
                </div>
            </div>`;
    }).join('');

    // Only scroll if animating (first load/view switch) or if it's essential
    if (animate) setTimeout(scrollToCurrent, 100);
}

function scrollToCurrent() {
    const liveEl = document.querySelector('.card.live');
    if (liveEl) {
        liveEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function renderItinerary(animate = true) {
    const target = document.getElementById('itineraryTarget');
    let dayFavs = favorites.filter(f => f.day === itineraryDay);

    dayFavs.sort((a, b) => parseTime(a.time) - parseTime(b.time));

    if (dayFavs.length === 0) {
        target.innerHTML = '<p style="padding:40px; text-align:center; color:#999">No has marcado favoritos aún.</p>';
        return;
    }

    const now = getCurrentTime();
    const showTargetDate = itineraryDay === 'Dia 1' ? 14 : 15;
    const isSameDay = now.getDate() === showTargetDate;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const adjustedCurrent = now.getHours() < 6 ? currentMinutes + (24 * 60) : currentMinutes;

    let html = '';
    dayFavs.forEach((f, i) => {
        let cardClass = '';
        if (animate) cardClass += ' slide-up';

        const animDelay = animate ? `style="animation-delay: ${i * 0.03}s"` : '';
        let badge = '';

        if (isSameDay) {
            const showMinutes = parseTime(f.time);
            const diff = showMinutes - adjustedCurrent;
            if (diff < 0) {
                cardClass += ' past';
            } else {
                badge = `<div class="live-badge" style="background:var(--fav); animation:none; color:black">${formatCountdown(diff)}</div>`;
            }
        } else {
            if (now.getDate() > showTargetDate) cardClass += ' past';
        }

        html += `
            <div class="card ${cardClass}" ${animDelay}>
                ${badge}
                <div class="card-info"><h4>${f.artist}</h4><p>${f.stage}</p></div>
                <div class="card-actions"><div class="time">${f.time}</div></div>
            </div>`;

        if (i < dayFavs.length - 1) {
            const next = dayFavs[i + 1];
            if (next.stage !== f.stage) {
                // Determine walking card animation
                const walkDelay = animate ? `style="animation-delay: ${(i * 0.03) + 0.015}s"` : '';
                const walkClass = animate ? 'walking-card slide-up' : 'walking-card';

                html += `
                    <div class="${walkClass}" ${walkDelay}>
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
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.toggle('active', b.innerText.includes(day === 'Dia 1' ? '14' : '15')));
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

// Auto-Refresh Every 60 Seconds
setInterval(() => {
    // Only refresh if the page is visible to save resources (optional, but good practice)
    if (!document.hidden) {
        if (document.getElementById('view-explorer').style.display !== 'none') {
            renderContent(false);
        } else if (document.getElementById('view-itinerary').style.display === 'block') {
            renderItinerary(false);
        }
    }
}, 60000);

// Registro Offline
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error', err));
    });
}

renderStages();
renderContent();
