import React from 'react';
import QRCode from 'qrcode.react'; // install: npm i qrcode.react

// Usage: <ParticipantQRCode seminarId="123" email="a@b.com" />
export default function ParticipantQRCode({ seminarId, email, size = 200 }) {
  const payload = JSON.stringify({ seminar_id: seminarId, participant_email: email });
  return (
    <div style={{ textAlign: "center" }}>
      <QRCode value={payload} size={size} />
      <div style={{ marginTop: 6, fontSize: 12 }}>{email}</div>
    </div>
  );
}
