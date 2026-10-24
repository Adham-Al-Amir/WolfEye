/* ==============================================================================
   WolfEye - Tactical Analytics Charts (Chart.js Integration)
   Wolfteam Neon Yellow & Cyber Aesthetics
   ============================================================================== */

class TacticalChartsManager {
  constructor() {
    this.occupancyChart = null;
    this.thermalChart = null;
    this.energyChart = null;
  }

  init(logs) {
    if (!window.Chart) {
      console.warn("Chart.js not loaded, skipping analytics graphs.");
      return;
    }

    // Configure Chart.js global tactical dark defaults
    Chart.defaults.color = '#718096';
    Chart.defaults.font.family = "'Rajdhani', sans-serif";
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';

    this.renderOccupancyChart(logs);
    this.renderThermalChart(logs);
  }

  renderOccupancyChart(logs) {
    const canvas = document.getElementById('occupancyChartCanvas');
    if (!canvas) return;

    // Take the latest 12 logs in chronological order
    const dataSubset = [...logs].reverse().slice(-12);
    const labels = dataSubset.map(l => {
      const d = new Date(l.created_at);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });
    const counts = dataSubset.map(l => l.people_count);

    if (this.occupancyChart) {
      this.occupancyChart.data.labels = labels;
      this.occupancyChart.data.datasets[0].data = counts;
      this.occupancyChart.update();
      return;
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(255, 208, 0, 0.45)');
    gradient.addColorStop(1, 'rgba(255, 208, 0, 0.0)');

    this.occupancyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Students Tracked (YOLO11)',
          data: counts,
          borderColor: '#ffd000',
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#ffd000',
          pointBorderColor: '#000',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#ffd000',
              font: { family: "'Orbitron', sans-serif", size: 11 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 12, 16, 0.95)',
            borderColor: '#ffd000',
            borderWidth: 1,
            titleFont: { family: "'Orbitron', sans-serif" },
            bodyColor: '#ffd000'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 208, 0, 0.08)' },
            ticks: { stepSize: 5 }
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' }
          }
        }
      }
    });
  }

  renderThermalChart(logs) {
    const canvas = document.getElementById('thermalChartCanvas');
    if (!canvas) return;

    const dataSubset = [...logs].reverse().slice(-12);
    const labels = dataSubset.map(l => {
      const d = new Date(l.created_at);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });
    const temps = dataSubset.map(l => l.temperature_c || 24.5);

    if (this.thermalChart) {
      this.thermalChart.data.labels = labels;
      this.thermalChart.data.datasets[0].data = temps;
      this.thermalChart.update();
      return;
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    this.thermalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Classroom Temp (°C) [LM35]',
          data: temps,
          borderColor: '#00f0ff',
          backgroundColor: gradient,
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#00f0ff',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#00f0ff',
              font: { family: "'Orbitron', sans-serif", size: 11 }
            }
          }
        },
        scales: {
          y: {
            min: 18,
            max: 50,
            grid: { color: 'rgba(0, 240, 255, 0.08)' }
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' }
          }
        }
      }
    });
  }

  update(logs) {
    this.renderOccupancyChart(logs);
    this.renderThermalChart(logs);
  }
}

window.tacticalCharts = new TacticalChartsManager();
