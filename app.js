/* ==============================================================================
   WolfEye - Master Application Controller
   Tactical Wolfteam Yellow/Black Command Dashboard
   ============================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let currentTab = 'live';
  let logsData = [];
  let alertsData = [];
  let logSearchQuery = '';
  let logFilterLed = 'all';
  let currentPage = 1;
  const rowsPerPage = 10;

  // DOM Elements - Splash Screen
  const splashScreen = document.getElementById('splashScreen');
  const mainApp = document.getElementById('mainApp');
  const btnEnterSystem = document.getElementById('btnEnterSystem');
  const splashFill = document.getElementById('splashFill');
  const splashPercent = document.getElementById('splashPercent');
  const splashTerminal = document.getElementById('splashTerminal');

  // DOM Elements - Clock & Sound
  const liveClock = document.getElementById('liveClock');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // DOM Elements - Gauges
  const gaugePeopleCount = document.getElementById('gaugePeopleCount');
  const gaugePeopleCircle = document.getElementById('gaugePeopleCircle');
  const badgePeopleStatus = document.getElementById('badgePeopleStatus');

  const gaugeLedState = document.getElementById('gaugeLedState');
  const gaugeLedCircle = document.getElementById('gaugeLedCircle');
  const gaugeLedSeconds = document.getElementById('gaugeLedSeconds');
  const badgeLedStatus = document.getElementById('badgeLedStatus');
  const statEnergySaved = document.getElementById('statEnergySaved');

  const gaugeTempValue = document.getElementById('gaugeTempValue');
  const gaugeTempCircle = document.getElementById('gaugeTempCircle');
  const badgeTempStatus = document.getElementById('badgeTempStatus');

  const gaugeGasValue = document.getElementById('gaugeGasValue');
  const gaugeGasCircle = document.getElementById('gaugeGasCircle');
  const badgeGasStatus = document.getElementById('badgeGasStatus');

  // DOM Elements - Navigation Tabs
  const navTabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const alertsBadgeNav = document.getElementById('alertsBadgeNav');

  // DOM Elements - Monitoring Logs Table
  const logsTableBody = document.getElementById('logsTableBody');
  const logsSearchInput = document.getElementById('logsSearchInput');
  const filterLedState = document.getElementById('filterLedState');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  const pageInfo = document.getElementById('pageInfo');
  const logsTotalCount = document.getElementById('logsTotalCount');
  const btnAddManualLog = document.getElementById('btnAddManualLog');

  // DOM Elements - Alerts
  const alertsTableBody = document.getElementById('alertsTableBody');
  const btnSimGasAlert = document.getElementById('btnSimGasAlert');
  const btnSimTempAlert = document.getElementById('btnSimTempAlert');
  const bannerActiveAlerts = document.getElementById('bannerActiveAlerts');

  // DOM Elements - Firebase Settings Modal
  const btnFirebaseStatus = document.getElementById('btnFirebaseStatus');
  const modalFirebase = document.getElementById('modalFirebase');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnSaveFirebaseKey = document.getElementById('btnSaveFirebaseKey');
  const inputFirebaseApiKey = document.getElementById('inputFirebaseApiKey');

  // ============================================================================
  // 1. SPLASH SCREEN BOOT SEQUENCE & EPIC TRANSITION
  // ============================================================================
  const bootLogs = [
    { text: "INITIALIZING WOLFEYE OS v2.4 (TACTICAL COMMAND)", time: 200, status: "OK" },
    { text: "CALIBRATING AI NEURAL VISION ENGINE [YOLO11-N]", time: 600, status: "READY" },
    { text: "CONNECTING TO FIREBASE FIRESTORE [wolfeye-eff54]", time: 1100, status: "LINKED" },
    { text: "INITIALIZING SENSORS: MQ-5 GAS (D4) & LM35 (A0)", time: 1600, status: "ONLINE" },
    { text: "ARDUINO RELAY CONTROLLER AT PORT COM5: SYNCED", time: 2000, status: "ONLINE" },
    { text: "ALL SUBSYSTEMS ARMED. TARGET LOCK ACTIVE.", time: 2400, status: "READY" }
  ];

  let bootIndex = 0;
  function runBootTerminal() {
    if (bootIndex < bootLogs.length) {
      const item = bootLogs[bootIndex];
      const p = document.createElement('div');
      p.className = 'terminal-line';
      p.innerHTML = `<span class="t-prefix">></span> <span class="t-info">${item.text}</span> <span class="t-ok">[${item.status}]</span>`;
      splashTerminal.appendChild(p);
      splashTerminal.scrollTop = splashTerminal.scrollHeight;

      bootIndex++;
      const nextDelay = bootIndex < bootLogs.length ? (bootLogs[bootIndex].time - item.time) : 400;
      setTimeout(runBootTerminal, Math.max(150, nextDelay));
    }
  }

  // Smooth progress bar 0% -> 100%
  let progress = 0;
  const progressTimer = setInterval(() => {
    progress += Math.floor(Math.random() * 5) + 3;
    if (progress >= 100) {
      progress = 100;
      clearInterval(progressTimer);
      if (btnEnterSystem) {
        btnEnterSystem.style.display = 'inline-flex';
        btnEnterSystem.focus();
      }
    }
    if (splashFill) splashFill.style.width = `${progress}%`;
    if (splashPercent) splashPercent.textContent = `${progress}%`;
  }, 70);

  setTimeout(runBootTerminal, 200);

  // Epic Shutter / Aperture Transition from Splash into Dashboard
  function engageDashboard() {
    if (window.tacticalSound) {
      window.tacticalSound.playApertureWhoosh();
    }

    // Trigger iris shockwave
    const shutter = document.querySelector('.iris-shutter');
    if (shutter) {
      shutter.classList.add('shockwave-active');
    }

    // Add unlocked class to splash screen
    splashScreen.classList.add('unlocked');

    setTimeout(() => {
      splashScreen.style.display = 'none';
      mainApp.classList.add('visible');
      // Initialize charts when dashboard is open
      if (window.tacticalCharts && logsData.length) {
        window.tacticalCharts.init(logsData);
      }
    }, 750);
  }

  if (btnEnterSystem) {
    btnEnterSystem.addEventListener('click', engageDashboard);
  }

  // Also unlock on clicking the big WolfEye logo
  const splashLogo = document.getElementById('splashLogoImg');
  if (splashLogo) {
    splashLogo.addEventListener('click', engageDashboard);
  }

  // Auto enter after 3.2s if user doesn't click
  setTimeout(() => {
    if (!splashScreen.classList.contains('unlocked') && progress >= 100) {
      engageDashboard();
    }
  }, 3400);

  // ============================================================================
  // 2. LIVE CLOCK & AUDIO FX CONTROLS
  // ============================================================================
  function updateClock() {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    if (liveClock) liveClock.textContent = `${timeStr} UTC+3`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      const isMuted = window.tacticalSound.toggleMute();
      if (soundIcon) {
        soundIcon.innerHTML = isMuted 
          ? `<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`
          : `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
      }
      if (!isMuted) window.tacticalSound.playClick();
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      if (window.tacticalSound) window.tacticalSound.playClick();
    });
  }

  // ============================================================================
  // 3. CIRCULAR GAUGES & REAL-TIME STATUS (The Core Requested Feature)
  // ============================================================================
  const CIRCLE_CIRCUMFERENCE = 440; // 2 * PI * 70 = ~440

  function setGaugeArc(circleElement, fraction) {
    if (!circleElement) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    const offset = CIRCLE_CIRCUMFERENCE - (clamped * CIRCLE_CIRCUMFERENCE);
    circleElement.style.strokeDashoffset = offset;
  }

  function renderLiveStatus(data) {
    // 1. People Count Gauge (Capacity: 35)
    const count = data.people_count ?? 0;
    if (gaugePeopleCount) gaugePeopleCount.textContent = count;
    setGaugeArc(gaugePeopleCircle, count / 35);

    if (badgePeopleStatus) {
      if (count === 0) {
        badgePeopleStatus.textContent = "EMPTY";
        badgePeopleStatus.className = "card-status-badge badge-normal";
      } else if (count > 25) {
        badgePeopleStatus.textContent = "HIGH DENSITY";
        badgePeopleStatus.className = "card-status-badge badge-warning";
      } else {
        badgePeopleStatus.textContent = "OPTIMAL";
        badgePeopleStatus.className = "card-status-badge badge-normal";
      }
    }

    // 2. LED Lighting State Gauge
    const ledOn = !!data.led_is_on;
    if (gaugeLedState) {
      gaugeLedState.textContent = ledOn ? "ON" : "OFF";
      gaugeLedState.style.color = ledOn ? "var(--wolf-yellow)" : "#718096";
    }

    if (gaugeLedCircle) {
      setGaugeArc(gaugeLedCircle, ledOn ? 1.0 : 0.0);
      if (ledOn) {
        gaugeLedCircle.classList.add('led-glowing-active');
      } else {
        gaugeLedCircle.classList.remove('led-glowing-active');
      }
    }

    if (badgeLedStatus) {
      badgeLedStatus.textContent = ledOn ? "ILLUMINATED" : "STANDBY (OFF)";
      badgeLedStatus.className = ledOn ? "card-status-badge badge-warning" : "card-status-badge badge-normal";
    }

    const ledSec = data.led_on_seconds ?? 0;
    if (gaugeLedSeconds) {
      const mins = Math.floor(ledSec / 60);
      const secs = ledSec % 60;
      gaugeLedSeconds.textContent = `${mins}m ${secs}s`;
    }

    // Calculate energy saved (assuming 400W classroom fixtures when off)
    if (statEnergySaved) {
      const kwhSaved = ((3600 - (ledSec % 3600)) * 0.4 / 3600).toFixed(2);
      statEnergySaved.textContent = `${kwhSaved} kWh`;
    }

    // 3. Ambient Temperature Gauge (LM35 Sensor, 15°C to 50°C)
    const temp = data.temperature_c ?? 24.5;
    if (gaugeTempValue) gaugeTempValue.textContent = temp.toFixed(1);

    const tempFrac = (temp - 15) / (50 - 15);
    setGaugeArc(gaugeTempCircle, tempFrac);

    if (badgeTempStatus && gaugeTempCircle) {
      if (temp >= 45.0) {
        badgeTempStatus.textContent = "CRITICAL HEAT";
        badgeTempStatus.className = "card-status-badge badge-danger";
        gaugeTempCircle.className = "gauge-fill-circle danger";
      } else if (temp >= 35.0) {
        badgeTempStatus.textContent = "ELEVATED";
        badgeTempStatus.className = "card-status-badge badge-warning";
        gaugeTempCircle.className = "gauge-fill-circle";
      } else {
        badgeTempStatus.textContent = "COMFORTABLE";
        badgeTempStatus.className = "card-status-badge badge-normal";
        gaugeTempCircle.className = "gauge-fill-circle cyan";
      }
    }

    // 4. Gas Detection Gauge (MQ-5 Sensor, DO: 0=Safe, 1=Danger)
    const gasVal = data.gas_detected ?? 0;
    const isGasDanger = !!gasVal;

    if (gaugeGasValue) {
      gaugeGasValue.textContent = isGasDanger ? "1" : "0";
      gaugeGasValue.style.color = isGasDanger ? "var(--danger-red)" : "var(--success-green)";
    }

    if (gaugeGasCircle && badgeGasStatus) {
      if (isGasDanger) {
        setGaugeArc(gaugeGasCircle, 1.0);
        gaugeGasCircle.className = "gauge-fill-circle danger";
        badgeGasStatus.textContent = "GAS LEAK DANGER";
        badgeGasStatus.className = "card-status-badge badge-danger";
      } else {
        setGaugeArc(gaugeGasCircle, 0.2);
        gaugeGasCircle.className = "gauge-fill-circle success";
        badgeGasStatus.textContent = "AIR SAFE (0 PPM)";
        badgeGasStatus.className = "card-status-badge badge-normal";
      }
    }

    // Header ticker updates
    const tickerOccupancy = document.getElementById('tickerOccupancy');
    if (tickerOccupancy) tickerOccupancy.textContent = `${count} TARGETS`;
    const tickerTemp = document.getElementById('tickerTemp');
    if (tickerTemp) tickerTemp.textContent = `${temp.toFixed(1)}°C`;
  }

  // Subscribe to live status from Firebase / Service
  if (window.wolfEyeData) {
    window.wolfEyeData.onLiveStatus(renderLiveStatus);
  }

  // ============================================================================
  // 4. NAVIGATION MENU BAR TABS (Live / Logs / Alerts / Analytics)
  // ============================================================================
  navTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab === currentTab) return;

      currentTab = targetTab;
      navTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.add('active');
        }
      });

      if (window.tacticalSound) window.tacticalSound.playClick();

      // Refresh charts if switching to analytics
      if (targetTab === 'analytics' && window.tacticalCharts && logsData.length) {
        window.tacticalCharts.renderOccupancyChart(logsData);
        window.tacticalCharts.renderThermalChart(logsData);
      }
    });
  });

  // ============================================================================
  // 5. MONITORING LOGS HISTORY (Every 3-Minutes Synced)
  // ============================================================================
  function renderLogsTable() {
    if (!logsTableBody) return;

    let filtered = logsData.filter(log => {
      const matchSearch = log.id.toLowerCase().includes(logSearchQuery) ||
        (log.people_count && log.people_count.toString().includes(logSearchQuery)) ||
        (log.temperature_c && log.temperature_c.toString().includes(logSearchQuery));

      let matchLed = true;
      if (logFilterLed === 'on') matchLed = log.led_is_on === true;
      if (logFilterLed === 'off') matchLed = log.led_is_on === false;

      return matchSearch && matchLed;
    });

    if (logsTotalCount) logsTotalCount.textContent = `${filtered.length} Records`;

    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (btnPrevPage) btnPrevPage.disabled = (currentPage <= 1);
    if (btnNextPage) btnNextPage.disabled = (currentPage >= totalPages);

    if (pageRows.length === 0) {
      logsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color:#718096;">No telemetry logs found matching filter criteria.</td></tr>`;
      return;
    }

    logsTableBody.innerHTML = pageRows.map(log => {
      const date = new Date(log.created_at);
      const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      const ledBadge = log.led_is_on 
        ? `<span class="card-status-badge badge-warning" style="font-size:0.7rem;">ON</span>` 
        : `<span class="card-status-badge badge-normal" style="font-size:0.7rem;">OFF</span>`;
      const gasBadge = log.gas_detected 
        ? `<span class="card-status-badge badge-danger" style="font-size:0.7rem;">DANGER (1)</span>` 
        : `<span class="card-status-badge badge-normal" style="font-size:0.7rem;">SAFE (0)</span>`;

      return `
        <tr>
          <td class="td-id">#${log.id}</td>
          <td class="td-time">${timeStr}</td>
          <td class="td-count"><span>${log.people_count}</span> Students</td>
          <td>${ledBadge}</td>
          <td>${log.led_on_seconds}s</td>
          <td style="font-family:var(--font-hud); color:${(log.temperature_c >= 45 ? 'var(--danger-red)' : 'var(--cyber-cyan)')};">${log.temperature_c ? log.temperature_c.toFixed(1) : '--'} °C</td>
          <td>${gasBadge}</td>
        </tr>
      `;
    }).join('');
  }

  // Hook search and filters
  if (logsSearchInput) {
    logsSearchInput.addEventListener('input', (e) => {
      logSearchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1;
      renderLogsTable();
    });
  }

  if (filterLedState) {
    filterLedState.addEventListener('change', (e) => {
      logFilterLed = e.target.value;
      currentPage = 1;
      renderLogsTable();
    });
  }

  if (btnPrevPage) {
    btnPrevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderLogsTable();
        if (window.tacticalSound) window.tacticalSound.playClick();
      }
    });
  }

  if (btnNextPage) {
    btnNextPage.addEventListener('click', () => {
      currentPage++;
      renderLogsTable();
      if (window.tacticalSound) window.tacticalSound.playClick();
    });
  }

  // Export to CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (!logsData.length) return;
      const headers = ["ID", "Timestamp", "People Count", "LED Is On", "LED Seconds", "Temperature C", "Gas Detected"];
      const rows = logsData.map(l => [
        l.id,
        `"${l.created_at}"`,
        l.people_count,
        l.led_is_on ? 1 : 0,
        l.led_on_seconds,
        l.temperature_c,
        l.gas_detected
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `WolfEye_monitoring_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.tacticalSound) window.tacticalSound.playClick();
    });
  }

  // Export to JSON
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      if (!logsData.length) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logsData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `WolfEye_monitoring_logs_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (window.tacticalSound) window.tacticalSound.playClick();
    });
  }

  // Add Manual Test Log (Every 3-Min Simulator)
  if (btnAddManualLog) {
    btnAddManualLog.addEventListener('click', () => {
      if (window.wolfEyeData) {
        window.wolfEyeData.recordMonitoringLogEntry();
      }
    });
  }

  // Subscribe to logs updates
  if (window.wolfEyeData) {
    window.wolfEyeData.onLogs((logs) => {
      logsData = logs;
      renderLogsTable();
      if (window.tacticalCharts && currentTab === 'analytics') {
        window.tacticalCharts.update(logs);
      }
    });
  }

  // ============================================================================
  // 6. HAZARD & SAFETY ALERTS (Security & Alerts Table)
  // ============================================================================
  function renderAlertsTable() {
    if (!alertsTableBody) return;

    const activeCount = alertsData.filter(a => !a.resolved).length;
    if (alertsBadgeNav) {
      alertsBadgeNav.textContent = activeCount;
      if (activeCount > 0) {
        alertsBadgeNav.classList.remove('zero');
      } else {
        alertsBadgeNav.classList.add('zero');
      }
    }

    if (bannerActiveAlerts) {
      if (activeCount > 0) {
        bannerActiveAlerts.style.display = 'flex';
        const txt = document.getElementById('activeAlertsCountText');
        if (txt) txt.textContent = `${activeCount} ACTIVE HAZARD ALERT${activeCount > 1 ? 'S' : ''}`;
      } else {
        bannerActiveAlerts.style.display = 'none';
      }
    }

    if (alertsData.length === 0) {
      alertsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:25px; color:#718096;">No hazard alerts recorded. All systems operating safely.</td></tr>`;
      return;
    }

    alertsTableBody.innerHTML = alertsData.map(alert => {
      const d = new Date(alert.triggered_at);
      const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
      const isCritical = alert.severity === 'CRITICAL';
      const badgeClass = isCritical ? 'alert-type-badge critical' : 'alert-type-badge warning';
      const actionBtn = alert.resolved
        ? `<span style="color:var(--success-green); font-size:0.8rem; font-weight:700;">[ RESOLVED ]</span>`
        : `<button class="btn-resolve" onclick="window.resolveAlertById('${alert.id}')">Acknowledge</button>`;

      return `
        <tr>
          <td class="td-id">#${alert.id}</td>
          <td><span class="${badgeClass}">${alert.alert_type}</span></td>
          <td style="font-family:var(--font-hud); font-weight:700; color:${isCritical ? 'var(--danger-red)' : 'var(--warning-amber)'};">${alert.severity}</td>
          <td style="font-family:monospace; color:#fff;">${alert.measured_value ?? '--'}</td>
          <td class="td-time">${timeStr}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');
  }

  // Global handler for resolve button
  window.resolveAlertById = (id) => {
    if (window.wolfEyeData) {
      window.wolfEyeData.resolveAlert(id);
      if (window.tacticalSound) window.tacticalSound.playClick();
    }
  };

  // Simulate Gas Leak Alert
  if (btnSimGasAlert) {
    btnSimGasAlert.addEventListener('click', () => {
      if (window.wolfEyeData) {
        window.wolfEyeData.triggerAlert("GAS_LEAK", "CRITICAL", 1.0);
      }
    });
  }

  // Simulate High Temperature Alert
  if (btnSimTempAlert) {
    btnSimTempAlert.addEventListener('click', () => {
      if (window.wolfEyeData) {
        window.wolfEyeData.triggerAlert("HIGH_TEMPERATURE", "CRITICAL", 48.5);
      }
    });
  }

  // Subscribe to alerts
  if (window.wolfEyeData) {
    window.wolfEyeData.onAlerts((alerts) => {
      alertsData = alerts;
      renderAlertsTable();
    });
  }

  // ============================================================================
  // 7. FIREBASE SETTINGS MODAL & CONNECTION STATUS
  // ============================================================================
  if (btnFirebaseStatus && modalFirebase) {
    btnFirebaseStatus.addEventListener('click', () => {
      modalFirebase.classList.add('open');
      if (inputFirebaseApiKey && window.wolfEyeData) {
        inputFirebaseApiKey.value = window.wolfEyeData.apiKey;
      }
      if (window.tacticalSound) window.tacticalSound.playClick();
    });
  }

  if (btnCloseModal && modalFirebase) {
    btnCloseModal.addEventListener('click', () => {
      modalFirebase.classList.remove('open');
    });
  }

  if (btnSaveFirebaseKey && inputFirebaseApiKey) {
    btnSaveFirebaseKey.addEventListener('click', () => {
      const key = inputFirebaseApiKey.value.trim();
      if (window.wolfEyeData) {
        window.wolfEyeData.saveApiKey(key);
      }
      modalFirebase.classList.remove('open');
      if (window.tacticalSound) window.tacticalSound.playSyncBeep();
    });
  }

  // Close modal on escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalFirebase.classList.contains('open')) {
      modalFirebase.classList.remove('open');
    }
  });
});
