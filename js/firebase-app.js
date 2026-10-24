/* ==============================================================================
   WolfEye - Firebase Cloud Firestore Connector & Real-Time Sync Service
   Production-ready integration with project: wolfeye-eff54
   Direct real-time connection to:
     - Document: classroom/live_status
     - Collection: monitoring_logs (3-min periodic telemetry)
     - Collection: alerts (real-time hazard events)
   ============================================================================== */

class WolfEyeDataService {
  constructor() {
    this.projectId = "wolfeye-eff54";
    this.firebaseConfig = {
      apiKey: "AIzaSyBc_ord6cuH03PDzxv17H1i9pVlprdl-mI",
      authDomain: "wolfeye-eff54.firebaseapp.com",
      projectId: "wolfeye-eff54",
      storageBucket: "wolfeye-eff54.firebasestorage.app",
      messagingSenderId: "226019434869",
      appId: "1:226019434869:web:4cee67f81d05e05c14733c"
    };

    this.db = null;
    this.isFirebaseConnected = false;
    this.connectionMode = "CONNECTING..."; // "FIRESTORE_LIVE", "FIRESTORE_REST", "SIMULATION"

    // Listeners registered by app UI
    this.liveStatusListeners = [];
    this.logsListeners = [];
    this.alertsListeners = [];

    // Current state (will be populated immediately from real Firestore)
    this.liveState = {
      people_count: 0,
      led_is_on: false,
      led_on_seconds: 0,
      temperature_c: 24.0,
      gas_detected: 0,
      gas_danger: false,
      updated_at: new Date().toLocaleTimeString()
    };

    this.monitoringLogs = [];
    this.alerts = [];

    // Polling interval for REST fallback/heartbeat
    this.pollInterval = null;

    // Start initialization
    this.init();
  }

  async init() {
    console.log(`[WolfEye Cloud] Connecting to Firebase Firestore: ${this.projectId}`);

    // First: Immediately fetch initial data via high-speed REST API
    await this.fetchRealFirestoreREST();

    // Second: Initialize Firebase Web SDK for real-time WebSocket listeners
    this.initFirebaseSDK();

    // Third: Keep periodic REST sync (every 2 seconds) as backup heartbeat — matches Arduino update rate
    this.pollInterval = setInterval(() => {
      this.pollRealFirestoreLiveStatus();
    }, 2000);
  }

  /* --------------------------------------------------------------------------
     1. Real-Time Firebase Web SDK Integration
     -------------------------------------------------------------------------- */
  initFirebaseSDK() {
    if (typeof firebase === 'undefined') {
      console.warn("[WolfEye Cloud] Firebase Web SDK not loaded, using REST API.");
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
      }
      this.db = firebase.firestore();
      console.log("[WolfEye Cloud] Firebase Firestore SDK initialized successfully.");

      // Subscribe to Live Document: classroom/live_status
      this.db.collection("classroom").doc("live_status")
        .onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            this.handleLiveStatusData(data);
            this.setConnectedState("FIRESTORE_LIVE");
            console.log("[WolfEye Cloud] ✅ Live status updated via real-time snapshot.");
          }
        }, (err) => {
          console.warn("[WolfEye Cloud] Live snapshot error (relying on REST):", err.message);
        });

      // Subscribe to Collection: monitoring_logs
      this.db.collection("monitoring_logs").orderBy("created_at", "desc").limit(40)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            list.push({
              id: doc.id.slice(0, 8),
              people_count: d.people_count ?? 0,
              led_is_on: !!d.led_is_on,
              led_on_seconds: d.led_on_seconds ?? 0,
              temperature_c: d.temperature_c !== undefined ? parseFloat(d.temperature_c) : 24.0,
              gas_detected: d.gas_detected ?? 0,
              created_at: d.created_at ? (d.created_at.toDate ? d.created_at.toDate().toISOString() : d.created_at) : new Date().toISOString()
            });
          });
          if (list.length > 0) {
            this.monitoringLogs = list;
            this.notifyLogs();
          }
        }, (err) => {
          console.warn("[WolfEye Cloud] Logs snapshot error:", err.message);
        });

      // Subscribe to Collection: alerts
      this.db.collection("alerts").orderBy("created_at", "desc").limit(30)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            list.push({
              id: doc.id.slice(0, 8),
              alert_type: d.alert_type || "HAZARD_ALERT",
              severity: d.severity || "CRITICAL",
              measured_value: d.measured_value,
              triggered_at: d.created_at ? (d.created_at.toDate ? d.created_at.toDate().toISOString() : d.created_at) : (d.triggered_at || new Date().toISOString()),
              resolved: false
            });
          });
          if (list.length > 0) {
            this.alerts = list;
            this.notifyAlerts();
          }
        }, (err) => {
          console.warn("[WolfEye Cloud] Alerts snapshot error:", err.message);
        });

    } catch (e) {
      console.warn("[WolfEye Cloud] SDK initialization fallback:", e);
    }
  }

  /* --------------------------------------------------------------------------
     2. Firestore Direct REST Fetching (Zero-Auth Public Read)
     -------------------------------------------------------------------------- */
  async fetchRealFirestoreREST() {
    try {
      // A) Live Status Document
      const liveRes = await fetch(`https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/classroom/live_status`);
      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        if (liveJson.fields) {
          const fields = this.parseFirestoreFields(liveJson.fields);
          this.handleLiveStatusData(fields);
          this.setConnectedState("FIRESTORE_REST");
        }
      }

      // B) Monitoring Logs Collection
      const logsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/monitoring_logs?pageSize=30`);
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        if (logsJson.documents && logsJson.documents.length) {
          this.monitoringLogs = logsJson.documents.map(doc => {
            const id = doc.name.split('/').pop().slice(0, 8);
            const f = this.parseFirestoreFields(doc.fields || {});
            return {
              id: id,
              people_count: f.people_count ?? 0,
              led_is_on: !!f.led_is_on,
              led_on_seconds: f.led_on_seconds ?? 0,
              temperature_c: f.temperature_c !== undefined ? parseFloat(f.temperature_c) : 24.0,
              gas_detected: f.gas_detected ?? 0,
              created_at: f.created_at || doc.createTime || new Date().toISOString()
            };
          });
          this.notifyLogs();
        }
      }

      // C) Alerts Collection
      const alertsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/alerts?pageSize=20`);
      if (alertsRes.ok) {
        const alertsJson = await alertsRes.json();
        if (alertsJson.documents && alertsJson.documents.length) {
          this.alerts = alertsJson.documents.map(doc => {
            const id = doc.name.split('/').pop().slice(0, 8);
            const f = this.parseFirestoreFields(doc.fields || {});
            return {
              id: id,
              alert_type: f.alert_type || "HAZARD_ALERT",
              severity: f.severity || "CRITICAL",
              measured_value: f.measured_value,
              triggered_at: f.created_at || f.triggered_at || doc.createTime || new Date().toISOString(),
              resolved: false
            };
          });
          this.notifyAlerts();
        }
      }

    } catch (e) {
      console.warn("[WolfEye Cloud] REST sync exception:", e);
    }
  }

  /* Polling heartbeat for classroom/live_status */
  async pollRealFirestoreLiveStatus() {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/classroom/live_status?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.fields) {
          const fields = this.parseFirestoreFields(json.fields);
          this.handleLiveStatusData(fields);
        }
      }
    } catch (e) {
      // Silent error on poll
    }
  }

  /* Convert Firestore REST Typed Fields into Plain Javascript Object */
  parseFirestoreFields(fields) {
    const obj = {};
    for (const [key, val] of Object.entries(fields)) {
      if ('stringValue' in val) obj[key] = val.stringValue;
      else if ('integerValue' in val) obj[key] = parseInt(val.integerValue, 10);
      else if ('doubleValue' in val) obj[key] = parseFloat(val.doubleValue);
      else if ('booleanValue' in val) obj[key] = val.booleanValue;
      else if ('timestampValue' in val) obj[key] = val.timestampValue;
      else if ('nullValue' in val) obj[key] = null;
    }
    return obj;
  }

  handleLiveStatusData(data) {
    this.liveState = {
      people_count: data.people_count ?? 0,
      led_is_on: !!data.led_is_on,
      led_on_seconds: data.led_on_seconds ?? 0,
      temperature_c: data.temperature_c !== undefined ? parseFloat(data.temperature_c) : 24.5,
      gas_detected: data.gas_detected ?? 0,
      gas_danger: !!data.gas_detected,
      updated_at: data.updated_at ? new Date(data.updated_at).toLocaleTimeString() : new Date().toLocaleTimeString()
    };
    this.notifyLiveStatus();
  }

  setConnectedState(mode) {
    this.isFirebaseConnected = true;
    this.connectionMode = mode;

    const pill = document.getElementById('btnFirebaseStatus');
    const text = document.getElementById('firebaseStatusText');
    if (pill && text) {
      pill.className = "firebase-pill";
      text.textContent = "FIREBASE LIVE SYNC";
    }
  }

  /* --------------------------------------------------------------------------
     3. Writing to Real Firestore (From Web App UI)
     -------------------------------------------------------------------------- */
  async recordMonitoringLogEntry() {
    const newLog = {
      people_count: this.liveState.people_count,
      led_is_on: this.liveState.led_is_on,
      led_on_seconds: this.liveState.led_on_seconds,
      temperature_c: this.liveState.temperature_c,
      gas_detected: this.liveState.gas_detected,
      created_at: new Date().toISOString()
    };

    // 1. If Firebase SDK db is active
    if (this.db) {
      try {
        const docRef = await this.db.collection("monitoring_logs").add({
          ...newLog,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("[WolfEye Firestore] Log written with ID:", docRef.id);
        if (window.tacticalSound) window.tacticalSound.playSyncBeep();
        return;
      } catch (e) {
        console.warn("[WolfEye Firestore] Write via SDK failed, trying REST:", e);
      }
    }

    // 2. Fallback REST Write
    try {
      await fetch(`https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/monitoring_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            people_count: { integerValue: newLog.people_count.toString() },
            led_is_on: { booleanValue: newLog.led_is_on },
            led_on_seconds: { integerValue: newLog.led_on_seconds.toString() },
            temperature_c: { doubleValue: newLog.temperature_c },
            gas_detected: { integerValue: newLog.gas_detected.toString() },
            created_at: { timestampValue: new Date().toISOString() }
          }
        })
      });
      console.log("[WolfEye Firestore] Log written via REST.");
      if (window.tacticalSound) window.tacticalSound.playSyncBeep();
    } catch (e) {
      console.warn("[WolfEye Firestore] Write failed:", e);
    }

    // Optimistic UI update
    this.monitoringLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      ...newLog
    });
    this.notifyLogs();
  }

  async triggerAlert(alertType, severity, measuredValue) {
    const alertData = {
      alert_type: alertType,
      severity: severity || "CRITICAL",
      measured_value: measuredValue,
      created_at: new Date().toISOString()
    };

    if (this.db) {
      try {
        await this.db.collection("alerts").add({
          ...alertData,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("[WolfEye Firestore] Alert written to real Firestore.");
      } catch (e) {
        console.warn("[WolfEye Firestore] Alert write via SDK failed:", e);
      }
    }

    // Update live state
    if (alertType === "GAS_LEAK") {
      this.liveState.gas_detected = 1;
      this.liveState.gas_danger = true;
      this.notifyLiveStatus();
    } else if (alertType === "HIGH_TEMPERATURE") {
      this.liveState.temperature_c = measuredValue;
      this.notifyLiveStatus();
    }

    // Optimistic UI
    this.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-4)}`,
      ...alertData,
      triggered_at: alertData.created_at,
      resolved: false
    });
    this.notifyAlerts();

    if (window.tacticalSound) window.tacticalSound.playAlertSiren();
  }

  resolveAlert(alertId) {
    const target = this.alerts.find(a => a.id === alertId);
    if (target) {
      target.resolved = true;
      if (target.alert_type === "GAS_LEAK") {
        this.liveState.gas_detected = 0;
        this.liveState.gas_danger = false;
        this.notifyLiveStatus();
      }
      this.notifyAlerts();
    }
  }

  /* --------------------------------------------------------------------------
     4. Observer Subscriptions
     -------------------------------------------------------------------------- */
  onLiveStatus(cb) {
    this.liveStatusListeners.push(cb);
    cb(this.liveState);
  }

  onLogs(cb) {
    this.logsListeners.push(cb);
    cb(this.monitoringLogs);
  }

  onAlerts(cb) {
    this.alertsListeners.push(cb);
    cb(this.alerts);
  }

  notifyLiveStatus() {
    this.liveStatusListeners.forEach(cb => cb(this.liveState));
  }

  notifyLogs() {
    this.logsListeners.forEach(cb => cb(this.monitoringLogs));
  }

  notifyAlerts() {
    this.alertsListeners.forEach(cb => cb(this.alerts));
  }

  saveApiKey(key) {
    this.firebaseConfig.apiKey = key;
    this.initFirebaseSDK();
  }
}

window.wolfEyeData = new WolfEyeDataService();
