'use strict';
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let _t = null;
const getTransporter = () => {
  if (_t) return _t;
  if (!process.env.EMAIL_USER) return null;
  _t = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return _t;
};

const send = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) { logger.info(`[EMAIL] ${subject} → ${to} (not sent — EMAIL_USER not set)`); return; }
  try { await t.sendMail({ from: process.env.EMAIL_FROM || 'FinCore Bank <no-reply@fincore.io>', to, subject, html }); }
  catch (e) { logger.error(`[EMAIL] Failed: ${e.message}`); }
};

const wrap = (tag, body) => `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0}
.w{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
.h{background:#2563eb;padding:24px 32px}.h h1{margin:0;color:#fff;font-size:18px;font-weight:700}
.h p{margin:4px 0 0;color:#bfdbfe;font-size:12px}.b{padding:28px 32px}
.amt{font-size:28px;font-weight:800;color:#2563eb;text-align:center;margin:16px 0}
.meta{background:#f8fafc;border-radius:10px;padding:16px;margin:12px 0}
.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px}
.row:last-child{border-bottom:none}.lbl{color:#64748b}.val{font-weight:600;color:#0f172a}
.badge{padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}
.green{background:#dcfce7;color:#15803d}.blue{background:#dbeafe;color:#1d4ed8}
.f{background:#f8fafc;padding:14px 32px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0}
.upi{font-size:22px;font-weight:800;color:#2563eb;font-family:monospace;text-align:center;padding:16px;background:#eff6ff;border-radius:12px;margin:12px 0}
</style></head><body><div class="w">
<div class="h"><h1>🏦 FinCore Bank</h1><p>${tag}</p></div>
<div class="b">${body}</div>
<div class="f">Automated notification · FinCore Bank © ${new Date().getFullYear()}</div>
</div></body></html>`;

const fmt = n => '₹' + parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });

module.exports = {
  sendTransferSuccess: ({ to, firstName, amount, receiverName, referenceNumber, senderAccount, date }) =>
    send({ to, subject: `✅ Transfer of ${fmt(amount)} successful — ${referenceNumber}`,
      html: wrap('Transfer Confirmation', `<p style="font-size:15px;font-weight:600">Transfer Successful</p>
        <p style="color:#64748b;font-size:13px;margin:4px 0 12px">Hi ${firstName},</p>
        <div class="amt">${fmt(amount)}</div><div class="meta">
        <div class="row"><span class="lbl">Reference</span><span class="val" style="font-family:monospace;font-size:11px">${referenceNumber}</span></div>
        <div class="row"><span class="lbl">Recipient</span><span class="val">${receiverName || '—'}</span></div>
        <div class="row"><span class="lbl">From Account</span><span class="val" style="font-family:monospace">${senderAccount}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">${new Date(date).toLocaleString('en-IN')}</span></div>
        <div class="row"><span class="lbl">Status</span><span class="val"><span class="badge green">COMPLETED</span></span></div></div>
        <p style="font-size:12px;color:#94a3b8">If you did not initiate this, contact support immediately.</p>`) }),

  sendBeneficiaryAdded: ({ to, firstName, beneficiaryName, accountNumber, bankName }) =>
    send({ to, subject: `🔗 Beneficiary added — ${beneficiaryName}`,
      html: wrap('Beneficiary Added', `<p style="font-size:15px;font-weight:600">New Beneficiary Added</p>
        <p style="color:#64748b;font-size:13px;margin:4px 0 12px">Hi ${firstName},</p>
        <div class="meta">
        <div class="row"><span class="lbl">Name</span><span class="val">${beneficiaryName}</span></div>
        <div class="row"><span class="lbl">Account</span><span class="val" style="font-family:monospace">${accountNumber}</span></div>
        <div class="row"><span class="lbl">Bank</span><span class="val">${bankName}</span></div></div>
        <p style="font-size:12px;color:#94a3b8">If you did not add this beneficiary, contact support immediately.</p>`) }),

  sendProfileUpdated: ({ to, firstName }) =>
    send({ to, subject: '✏️ Your FinCore profile was updated',
      html: wrap('Profile Updated', `<p style="font-size:15px;font-weight:600">Profile Updated</p>
        <p style="color:#64748b;font-size:13px">Hi ${firstName}, your profile was updated on ${new Date().toLocaleString('en-IN')}.</p>
        <p style="font-size:12px;color:#94a3b8;margin-top:12px">If you did not make this change, contact support immediately.</p>`) }),

  sendScheduledCreated: ({ to, firstName, amount, executeAt, receiverAccount }) =>
    send({ to, subject: `🕐 Scheduled transfer of ${fmt(amount)} set up`,
      html: wrap('Scheduled Transfer', `<p style="font-size:15px;font-weight:600">Transfer Scheduled</p>
        <p style="color:#64748b;font-size:13px;margin:4px 0 12px">Hi ${firstName},</p>
        <div class="amt">${fmt(amount)}</div><div class="meta">
        <div class="row"><span class="lbl">To Account</span><span class="val" style="font-family:monospace">${receiverAccount}</span></div>
        <div class="row"><span class="lbl">Execute On</span><span class="val">${new Date(executeAt).toLocaleString('en-IN')}</span></div>
        <div class="row"><span class="lbl">Status</span><span class="val"><span class="badge blue">SCHEDULED</span></span></div></div>`) }),

  sendStandingCreated: ({ to, firstName, amount, frequency, dayOfMonth, receiverAccount }) => {
    const fl = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: `Monthly on day ${dayOfMonth}` }[frequency];
    return send({ to, subject: `🔁 Standing instruction — ${fmt(amount)} ${fl}`,
      html: wrap('Standing Instruction', `<p style="font-size:15px;font-weight:600">Standing Instruction Created</p>
        <p style="color:#64748b;font-size:13px;margin:4px 0 12px">Hi ${firstName},</p>
        <div class="amt">${fmt(amount)}</div><div class="meta">
        <div class="row"><span class="lbl">To Account</span><span class="val" style="font-family:monospace">${receiverAccount}</span></div>
        <div class="row"><span class="lbl">Frequency</span><span class="val">${fl}</span></div>
        <div class="row"><span class="lbl">Status</span><span class="val"><span class="badge green">ACTIVE</span></span></div></div>`) });
  },

  sendUpiActivated: ({ to, firstName, upiId }) =>
    send({ to, subject: `✅ Your UPI ID is ready — ${upiId}`,
      html: wrap('UPI Activated', `<p style="font-size:15px;font-weight:600">UPI ID Activated</p>
        <p style="color:#64748b;font-size:13px;margin:4px 0 12px">Hi ${firstName}, your FinCore UPI ID is now active.</p>
        <div class="upi">${upiId}</div>
        <p style="font-size:13px;color:#64748b;text-align:center">Share this ID to receive instant payments.</p>`) }),
};
