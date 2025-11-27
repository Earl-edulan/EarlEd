// src/pages/AttendanceScanner.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { recordTimeIn, recordTimeOut } from '../lib/db'; // import the helpers you added
import { useLocation } from 'react-router-dom';

export default function AttendanceScanner() {
  // camera scanner state
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("Ready to scan or enter details below.");
  const [manualEmail, setManualEmail] = useState("");
  const [manualSeminarId, setManualSeminarId] = useState("");
  const qrRegionId = "html5qr-code-full-region";
  const qrRef = useRef(null);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (qrRef.current) {
        try { qrRef.current.stop(); } catch (e) {}
        qrRef.current = null;
      }
    };
  }, []);

const location = useLocation();
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const sem = params.get('seminar');
  if (sem) setManualSeminarId(sem);
}, [location]);

  // parse QR payload: we expect JSON like { seminar_id: "123", participant_email: "a@b.com" }
  const parsePayload = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.seminar_id && parsed.participant_email) return parsed;
      // if text is "seminarId|email" fallback
      if (text.includes("|")) {
        const [seminar_id, participant_email] = text.split("|");
        return { seminar_id, participant_email };
      }
      return null;
    } catch (err) {
      // not JSON; maybe "seminarId|email"
      if (text.includes("|")) {
        const [seminar_id, participant_email] = text.split("|");
        return { seminar_id, participant_email };
      }
      return null;
    }
  };

  const onScanSuccess = async (decodedText) => {
    // stop scanning briefly to avoid duplicate scans
    if (qrRef.current) {
      try { await qrRef.current.stop(); } catch (e) {}
      setScanning(false);
    }

    const payload = parsePayload(decodedText);
    if (!payload) {
      setMessage("Invalid QR — expected { seminar_id, participant_email } or seminarId|email");
      return;
    }

    setMessage(`Scanned for ${payload.participant_email} (seminar ${payload.seminar_id}) — checking...`);

    // Decide IN vs OUT based on DB row
    // We'll try to fetch the attendance row indirectly by calling recordTimeIn first then recordTimeOut if needed.
    // Safer flow: fetch record then check fields, but helpers combine logic so we use a small strategy:
    // 1) Try recordTimeIn -> if it created a row or updated time_in but time_out is null => that's IN
    // 2) Otherwise, try recordTimeOut -> if it updates time_out => OUT
    const inRes = await recordTimeIn(payload.seminar_id, payload.participant_email);
    if (inRes.error) {
      console.error(inRes.error);
      setMessage("Error recording attendance IN.");
      return;
    }

    const hasTimeOut = Array.isArray(inRes.data) ? !!inRes.data[0]?.time_out : !!inRes.data?.time_out;
    const hasTimeIn = Array.isArray(inRes.data) ? !!inRes.data[0]?.time_in : !!inRes.data?.time_in;

    if (hasTimeIn && !hasTimeOut) {
      setMessage(`✅ ${payload.participant_email} checked IN at ${new Date().toLocaleTimeString()}`);
      return;
    }

    // If recordTimeIn returned an existing row with both fields or only time_out, attempt time_out
    const outRes = await recordTimeOut(payload.seminar_id, payload.participant_email);
    if (outRes.error) {
      console.error(outRes.error);
      setMessage("Error recording attendance OUT.");
      return;
    }
    setMessage(`✅ ${payload.participant_email} checked OUT at ${new Date().toLocaleTimeString()}`);
  };

  const startScanner = async () => {
    setMessage("Starting camera...");
    setScanning(true);

    const config = { fps: 10, qrbox: { width: 300, height: 200 } };
    const html5QrCode = new Html5Qrcode(qrRegionId);
    qrRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => onScanSuccess(decodedText),
        (errorMessage) => {
          // scanning failure per frame, ignore
        }
      );
      setMessage("Scanning... point the camera to the QR code.");
    } catch (err) {
      console.error(err);
      setMessage("Camera access denied or not available. Use manual entry below.");
      setScanning(false);
      try { html5QrCode.stop(); } catch (e) {}
      qrRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (qrRef.current) {
      try { await qrRef.current.stop(); } catch (e) {}
      qrRef.current = null;
    }
    setScanning(false);
    setMessage("Scanner stopped.");
  };

  // Manual fallback: will perform IN then OUT same logic as scan flow
  const manualCheckInOut = async () => {
    if (!manualSeminarId || !manualEmail) {
      setMessage("Enter seminar id and participant email.");
      return;
    }
    setMessage("Processing manual entry...");
    // same logic: try IN first, if already in, then OUT
    const inRes = await recordTimeIn(manualSeminarId, manualEmail);
    if (inRes.error) {
      setMessage("Error recording IN (manual).");
      return;
    }
    const hasTimeOut = Array.isArray(inRes.data) ? !!inRes.data[0]?.time_out : !!inRes.data?.time_out;
    const hasTimeIn = Array.isArray(inRes.data) ? !!inRes.data[0]?.time_in : !!inRes.data?.time_in;

    if (hasTimeIn && !hasTimeOut) {
      setMessage(`✅ ${manualEmail} checked IN (manual).`);
      return;
    }
    const outRes = await recordTimeOut(manualSeminarId, manualEmail);
    if (outRes.error) {
      setMessage("Error recording OUT (manual).");
      return;
    }
    setMessage(`✅ ${manualEmail} checked OUT (manual).`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Attendance Scanner</h2>
      <p style={{ color: "#444" }}>{message}</p>

      <div id={qrRegionId} style={{ width: "100%", maxWidth: 640, marginBottom: 12 }}></div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {!scanning ? (
          <button onClick={startScanner} style={{ padding: "0.6rem 1rem" }}>Start Camera</button>
        ) : (
          <button onClick={stopScanner} style={{ padding: "0.6rem 1rem" }}>Stop Camera</button>
        )}
      </div>

      <hr />

      <h3>Manual Entry</h3>
      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input placeholder="seminar id" value={manualSeminarId} onChange={(e) => setManualSeminarId(e.target.value)} />
        <input placeholder="participant email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={manualCheckInOut}>Check In / Out</button>
        </div>
      </div>
    </div>
  );
}
