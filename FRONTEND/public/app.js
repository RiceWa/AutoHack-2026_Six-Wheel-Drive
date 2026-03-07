const statusEl = document.getElementById('status');
const apiStatusEl = document.getElementById('api-status');
const sampleCountEl = document.getElementById('sample-count');
const latestValueEl = document.getElementById('latest-value');
const latestTimeEl = document.getElementById('latest-time');
const refreshBtn = document.getElementById('refresh');
const tabButtons = document.querySelectorAll('.tab');

const ctx = document.getElementById('chart');
let chart;
let selectedSensor = document.querySelector('.tab.active')?.dataset.sensor || 'sensor-1';

function setStatus(text, ok = true) {
  statusEl.textContent = text;
  apiStatusEl.textContent = ok ? 'online' : 'offline';
  apiStatusEl.style.color = ok ? '#4de1c1' : '#ff7a7a';
}

function normalizeSamples(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, idx) => {
    if (typeof item === 'number') {
      return { label: `#${idx + 1}`, value: item };
    }

    if (item && typeof item === 'object') {
      const value = Number(item.value ?? item.reading ?? item.data ?? 0);
      const label = item.timestamp || item.time || item.createdAt || `#${idx + 1}`;
      return { label, value };
    }

    return { label: `#${idx + 1}`, value: 0 };
  });
}

function renderChart(samples) {
  const labels = samples.map((s) => s.label);
  const data = samples.map((s) => s.value);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sensor value',
        data,
        borderColor: '#4de1c1',
        backgroundColor: 'rgba(77, 225, 193, 0.15)',
        fill: true,
        tension: 0.25,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: '#93a0b3' } },
        y: { ticks: { color: '#93a0b3' } }
      }
    }
  });
}

function updateLatest(samples) {
  const latest = samples[samples.length - 1];
  if (!latest) {
    latestValueEl.textContent = '--';
    latestTimeEl.textContent = '--';
    return;
  }

  latestValueEl.textContent = latest.value;
  latestTimeEl.textContent = latest.label;
}

async function fetchData() {
  setStatus('Connecting…', true);

  try {
    const res = await fetch(`/api/data?sensor=${encodeURIComponent(selectedSensor)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    let samples = normalizeSamples(payload);

    // If API returns mixed sensors, filter client-side as a fallback.
    samples = samples.filter((s) => {
      if (!s || typeof s !== 'object') return true;
      const sensor = s.sensor || s.device || s.source;
      return sensor ? String(sensor) === selectedSensor : true;
    });

    sampleCountEl.textContent = String(samples.length);
    renderChart(samples);
    updateLatest(samples);
    setStatus('Live', true);
  } catch (err) {
    setStatus('Offline', false);
    sampleCountEl.textContent = '0';
  }
}

refreshBtn.addEventListener('click', fetchData);
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSensor = btn.dataset.sensor;
    fetchData();
  });
});
fetchData();
setInterval(fetchData, 5000);
