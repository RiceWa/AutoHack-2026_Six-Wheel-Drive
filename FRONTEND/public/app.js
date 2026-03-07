const statusEl = document.getElementById('status');
const apiStatusEl = document.getElementById('api-status');
const sampleCountEl = document.getElementById('sample-count');
const latestValueEl = document.getElementById('latest-value');
const latestTimeEl = document.getElementById('latest-time');
const refreshBtn = document.getElementById('refresh');
const metricTabs = document.querySelectorAll('.tabs[aria-label="Metric tabs"] .tab');

const ctx = document.getElementById('chart');
let chart;
let selectedMetric = document.querySelector('.tabs[aria-label="Metric tabs"] .tab.active')?.dataset.metric || 'temp';

function setStatus(text, ok = true) {
  statusEl.textContent = text;
  apiStatusEl.textContent = ok ? 'online' : 'offline';
  apiStatusEl.style.color = ok ? '#4de1c1' : '#ff7a7a';
}

function formatLabel(tick, fallback) {
  if (tick?.timestamp) {
    const date = new Date(tick.timestamp);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  if (typeof tick?.tick === 'number') return `#${tick.tick}`;
  return fallback;
}

function buildSeries(ticks) {
  const labels = ticks.map((t, i) => formatLabel(t, `#${i + 1}`));
  let datasets = [];

  if (selectedMetric === 'temp') {
    datasets = [{
      label: 'Temp',
      data: ticks.map((t) => Number(t?.temp ?? 0)),
      borderColor: '#4de1c1',
      backgroundColor: 'rgba(77, 225, 193, 0.15)',
      fill: true
    }];
  } else if (selectedMetric === 'accel') {
    datasets = [
      { label: 'Accel X', data: ticks.map((t) => Number(t?.accel?.x ?? 0)), borderColor: '#4de1c1' },
      { label: 'Accel Y', data: ticks.map((t) => Number(t?.accel?.y ?? 0)), borderColor: '#7aa2ff' },
      { label: 'Accel Z', data: ticks.map((t) => Number(t?.accel?.z ?? 0)), borderColor: '#ffb86c' }
    ];
  } else if (selectedMetric === 'gyro') {
    datasets = [
      { label: 'Gyro X', data: ticks.map((t) => Number(t?.gyro?.x ?? 0)), borderColor: '#4de1c1' },
      { label: 'Gyro Y', data: ticks.map((t) => Number(t?.gyro?.y ?? 0)), borderColor: '#7aa2ff' },
      { label: 'Gyro Z', data: ticks.map((t) => Number(t?.gyro?.z ?? 0)), borderColor: '#ffb86c' }
    ];
  }

  datasets = datasets.map((d) => ({
    ...d,
    backgroundColor: d.backgroundColor ?? 'rgba(77, 225, 193, 0.08)',
    tension: 0.25,
    pointRadius: 2
  }));

  return { labels, datasets };
}

function renderChart(ticks) {
  const { labels, datasets } = buildSeries(ticks);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#93a0b3' }
        }
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

  if (selectedMetric === 'temp') {
    latestValueEl.textContent = latest.temp ?? '--';
  } else if (selectedMetric === 'accel') {
    const a = latest.accel || {};
    latestValueEl.textContent = `${a.x ?? 0}, ${a.y ?? 0}, ${a.z ?? 0}`;
  } else if (selectedMetric === 'gyro') {
    const g = latest.gyro || {};
    latestValueEl.textContent = `${g.x ?? 0}, ${g.y ?? 0}, ${g.z ?? 0}`;
  }
  latestTimeEl.textContent = formatLabel(latest, '--');
}

async function fetchData() {
  setStatus('Connecting…', true);

  try {
    const res = await fetch('/api/data/Tick');
    if (res.status === 404) {
      sampleCountEl.textContent = '0';
      renderChart([]);
      updateLatest([]);
      setStatus('Live', true);
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const samples = Array.isArray(payload) ? payload : [];

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
metricTabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    metricTabs.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMetric = btn.dataset.metric;
    fetchData();
  });
});
fetchData();
setInterval(fetchData, 5000);
