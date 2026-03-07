const statusEl = document.getElementById('status');
const apiStatusEl = document.getElementById('api-status');
const sampleCountEl = document.getElementById('sample-count');
const latestValueEl = document.getElementById('latest-value');
const latestTimeEl = document.getElementById('latest-time');
const refreshBtn = document.getElementById('refresh');
const runSelect = document.getElementById('run-select');
const runCompareSelect = document.getElementById('run-compare-select');
const compareControls = document.getElementById('compare-controls');
const metricTabs = document.querySelectorAll('.tabs[aria-label="Metric tabs"] .tab');

const ctx = document.getElementById('chart');
let chart;
let selectedMetric = document.querySelector('.tabs[aria-label="Metric tabs"] .tab.active')?.dataset.metric || 'temp';
let selectedRunId = null;
let selectedRunIdB = null;

function updateControls() {
  const isCompare = selectedMetric.startsWith('compare-');
  if (compareControls) {
    compareControls.style.display = isCompare ? 'contents' : 'none';
  }
  if (!isCompare) {
    selectedRunIdB = null;
  }
}

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

function buildCompareSeries(rows) {
  const labels = rows.map((r, i) => `#${r.tickIndex ?? i}`);
  let label = 'Difference';
  let data = [];

  if (selectedMetric === 'compare-temp') {
    label = 'Temp Difference';
    data = rows.map((r) => Number(r?.tempDifference ?? 0));
  } else if (selectedMetric === 'compare-accel') {
    label = 'Accel Magnitude Difference';
    data = rows.map((r) => Number(r?.accelerationMagnitudeDifference ?? 0));
  } else if (selectedMetric === 'compare-gyro') {
    label = 'Gyro Angle Difference';
    data = rows.map((r) => Number(r?.gyroAngleDifference ?? 0));
  }

  return {
    labels,
    datasets: [{
      label,
      data,
      borderColor: '#4de1c1',
      backgroundColor: 'rgba(77, 225, 193, 0.15)',
      fill: true,
      tension: 0.25,
      pointRadius: 2
    }]
  };
}

function renderChart(ticks) {
  const { labels, datasets } = selectedMetric.startsWith('compare-')
    ? buildCompareSeries(ticks)
    : buildSeries(ticks);

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

  if (selectedMetric === 'compare-temp') {
    latestValueEl.textContent = latest.tempDifference ?? '--';
  } else if (selectedMetric === 'compare-accel') {
    latestValueEl.textContent = latest.accelerationMagnitudeDifference ?? '--';
  } else if (selectedMetric === 'compare-gyro') {
    latestValueEl.textContent = latest.gyroAngleDifference ?? '--';
  } else if (selectedMetric === 'temp') {
    latestValueEl.textContent = latest.temp ?? '--';
  } else if (selectedMetric === 'accel') {
    const a = latest.accel || {};
    latestValueEl.textContent = `${a.x ?? 0}, ${a.y ?? 0}, ${a.z ?? 0}`;
  } else if (selectedMetric === 'gyro') {
    const g = latest.gyro || {};
    latestValueEl.textContent = `${g.x ?? 0}, ${g.y ?? 0}, ${g.z ?? 0}`;
  }
  latestTimeEl.textContent = selectedMetric.startsWith('compare-')
    ? `#${latest.tickIndex ?? '--'}`
    : formatLabel(latest, '--');
}

async function fetchData() {
  setStatus('Connecting…', true);

  try {
    let res;
    if (selectedMetric.startsWith('compare-')) {
      if (!selectedRunId || !selectedRunIdB) {
        sampleCountEl.textContent = '0';
        renderChart([]);
        updateLatest([]);
        setStatus('Live', true);
        return;
      }
      res = await fetch(`/api/data/compareRuns/${encodeURIComponent(selectedRunId)}/${encodeURIComponent(selectedRunIdB)}`);
    } else {
      const tickUrl = selectedRunId ? `/api/data/Tick/${encodeURIComponent(selectedRunId)}` : '/api/data/Tick';
      res = await fetch(tickUrl);
      if (res.status === 404 && selectedRunId) {
        // Fallback to query filter if route is not wired for :runId
        res = await fetch(`/api/data/Tick?runId=${encodeURIComponent(selectedRunId)}`);
      }
    }
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
runSelect.addEventListener('change', () => {
  selectedRunId = runSelect.value || null;
  fetchData();
});
runCompareSelect.addEventListener('change', () => {
  selectedRunIdB = runCompareSelect.value || null;
  fetchData();
});
metricTabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    metricTabs.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMetric = btn.dataset.metric;
    updateControls();
    fetchData();
  });
});
async function loadRuns() {
  runSelect.innerHTML = '';
  runCompareSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'All runs';
  runSelect.appendChild(placeholder);
  const placeholderB = document.createElement('option');
  placeholderB.value = '';
  placeholderB.textContent = 'All runs';
  runCompareSelect.appendChild(placeholderB);

  try {
    const res = await fetch('/api/data/Run');
    if (!res.ok) return;
    const runs = await res.json();
    if (!Array.isArray(runs)) return;

    runs.forEach((run) => {
      const opt = document.createElement('option');
      opt.value = run._id || run.id || '';
      const labelId = opt.value ? opt.value.slice(-6) : 'run';
      const start = run.startTime ? new Date(run.startTime) : null;
      const end = run.endTime ? new Date(run.endTime) : null;
      const startLabel = start && !Number.isNaN(start.getTime())
        ? start.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : 'start ?';
      const endLabel = end && !Number.isNaN(end.getTime())
        ? end.toLocaleString([], { hour: '2-digit', minute: '2-digit' })
        : 'end ?';
      const timeLabel = `${startLabel}–${endLabel}`;
      opt.textContent = `${run.runType || 'run'} ${labelId} • ${timeLabel}`;
      runSelect.appendChild(opt.cloneNode(true));
      runCompareSelect.appendChild(opt);
    });
  } catch {
    // ignore
  }
}

updateControls();
loadRuns().then(fetchData);
setInterval(fetchData, 180000);
