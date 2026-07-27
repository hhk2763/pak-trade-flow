/**
 * PAK Trade Flow — weekly briefing delivery.
 *
 * Reference copy, version-controlled here but NOT executed by the Next.js app.
 * Paste it into the Apps Script project bound to your leads spreadsheet (the
 * one behind LEAD_WEBHOOK_URL).
 *
 * Two responsibilities:
 *   1. doPost  — branch on payload.action. "weekly-briefing" mails subscribers;
 *                anything else falls through to the existing lead-append path.
 *   2. Trigger — a weekly time-driven trigger that calls the Next.js
 *                /api/briefing/dispatch endpoint, which generates the briefing
 *                and POSTs it back here.
 *
 * SETUP
 *   1. Project Settings → Script Properties, add:
 *        BRIEFING_DISPATCH_URL  https://<your-domain>/api/briefing/dispatch
 *        BRIEFING_CRON_SECRET   <same value as the app's BRIEFING_CRON_SECRET>
 *   2. Merge doPost below with your existing doPost (see MERGE NOTE).
 *   3. Run setupWeeklyTrigger() once, and authorise the script when prompted.
 *   4. Run sendTestBriefing() to mail yourself a sample before going live.
 */

var LEADS_SHEET_NAME = 'Leads';
var EMAIL_COLUMN = 'email';
var SUBSCRIBE_COLUMN = 'subscribeWeekly';
var SENDER_NAME = 'PAK Trade Flow';

/**
 * MERGE NOTE: if your project already has a doPost that appends lead rows,
 * do not replace it — add the `action` branch at the top and keep your existing
 * body as the `else`. Lead payloads carry no `action` field, so they are
 * unaffected.
 */
function doPost(e) {
  var payload = JSON.parse(e.postData.contents);

  if (payload.action === 'weekly-briefing') {
    var sent = sendBriefingToSubscribers(payload);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, recipients: sent }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ---- existing lead-append behaviour goes here ----
  appendLeadRow(payload);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mails the briefing to every opted-in subscriber.
 *
 * Sends individually rather than by BCC so each message can carry its own
 * unsubscribe link, and so one bad address cannot block the whole batch.
 */
function sendBriefingToSubscribers(payload) {
  var recipients = getSubscriberEmails();
  if (recipients.length === 0) {
    Logger.log('No opted-in subscribers — nothing sent.');
    return 0;
  }

  var quota = MailApp.getRemainingDailyQuota();
  if (quota < recipients.length) {
    Logger.log('Mail quota too low: need ' + recipients.length + ', have ' + quota);
    recipients = recipients.slice(0, quota);
  }

  var subject = payload.subject || 'PAK Trade Flow — Weekly Briefing';
  var sent = 0;

  for (var i = 0; i < recipients.length; i++) {
    var email = recipients[i];
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        name: SENDER_NAME,
        body: buildPlainTextEmail(payload, email),
        htmlBody: buildHtmlEmail(payload, email)
      });
      sent++;
    } catch (err) {
      // One dead address must not stop the rest of the send.
      Logger.log('Failed to send to ' + email + ': ' + err);
    }
  }

  Logger.log('Weekly briefing sent to ' + sent + '/' + recipients.length + ' subscribers.');
  return sent;
}

/**
 * Reads opted-in, deduplicated addresses from the leads sheet.
 *
 * Columns are located by header name, so reordering or inserting columns in the
 * sheet does not break delivery.
 */
function getSubscriberEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADS_SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + LEADS_SHEET_NAME + '" not found.');

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (h) { return String(h).trim(); });
  var emailIdx = headers.indexOf(EMAIL_COLUMN);
  var subscribeIdx = headers.indexOf(SUBSCRIBE_COLUMN);

  if (emailIdx === -1) throw new Error('No "' + EMAIL_COLUMN + '" column in ' + LEADS_SHEET_NAME);

  var seen = {};
  var emails = [];

  for (var r = 1; r < values.length; r++) {
    var email = String(values[r][emailIdx] || '').trim().toLowerCase();
    if (!email || email.indexOf('@') === -1) continue;

    // Rows captured before the opt-in checkbox existed have no value in this
    // column. Treat that as "not subscribed" — never mail someone who was
    // never asked.
    if (subscribeIdx === -1) continue;
    if (!isTruthy(values[r][subscribeIdx])) continue;

    if (seen[email]) continue;
    seen[email] = true;
    emails.push(email);
  }

  return emails;
}

/** Sheets may store the checkbox as a boolean, "TRUE", "true", or 1. */
function isTruthy(value) {
  if (value === true) return true;
  var s = String(value).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1';
}

function buildPlainTextEmail(payload, email) {
  return [
    'PAK TRADE FLOW — WEEKLY BRIEFING',
    payload.periodLabel || '',
    '',
    payload.bodyText || '',
    '',
    '—',
    'Port Qasim & Karachi Port Trust commodity flow intelligence.',
    'Unsubscribe: reply to this email with "unsubscribe" (' + email + ')'
  ].join('\n');
}

function buildHtmlEmail(payload, email) {
  var body = escapeHtml(payload.bodyText || '').replace(/\n/g, '<br>');
  return [
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;',
    'margin:0 auto;padding:24px;color:#191c1c;">',
    '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6f7979;">',
    'PAK Trade Flow — Weekly Briefing</div>',
    '<div style="font-size:20px;font-weight:600;margin:4px 0 20px;">',
    escapeHtml(payload.periodLabel || ''), '</div>',
    '<div style="font-size:15px;line-height:1.6;">', body, '</div>',
    '<hr style="border:none;border-top:1px solid #dde4e3;margin:24px 0 12px;">',
    '<div style="font-size:12px;color:#6f7979;line-height:1.5;">',
    'Port Qasim &amp; Karachi Port Trust commodity flow intelligence.<br>',
    'Figures are compiled from reported 24-hour port tonnage.<br>',
    'Sent to ', escapeHtml(email), ' — reply with &quot;unsubscribe&quot; to stop.',
    '</div></div>'
  ].join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Placeholder for your existing lead-append logic. If your project already has
 * this, delete this function and keep yours.
 *
 * Note the leads sheet needs a `subscribeWeekly` header for delivery to find
 * anyone — the app now sends that field on every lead and contact submission.
 */
function appendLeadRow(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADS_SHEET_NAME);
  sheet.appendRow([
    payload.submittedAt || new Date().toISOString(),
    payload.name || '',
    payload.email || '',
    payload.commodityInterest || '',
    payload.message || '',
    payload.subscribeWeekly === true,
    payload.source || ''
  ]);
}

// ---------------------------------------------------------------------------
// Weekly trigger
// ---------------------------------------------------------------------------

/**
 * Calls the app, which generates the briefing and POSTs it back to doPost.
 * The app owns generation because that is where the port data and the DeepSeek
 * key live; this script only decides when, and who receives it.
 */
function requestWeeklyBriefing() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('BRIEFING_DISPATCH_URL');
  var secret = props.getProperty('BRIEFING_CRON_SECRET');

  if (!url || !secret) {
    throw new Error('Set BRIEFING_DISPATCH_URL and BRIEFING_CRON_SECRET in Script Properties.');
  }

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + secret },
    muteHttpExceptions: true
  });

  Logger.log('Dispatch responded ' + response.getResponseCode() + ': '
    + response.getContentText().slice(0, 500));
}

/** Run once. Replaces any existing trigger so repeat runs don't stack them. */
function setupWeeklyTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'requestWeeklyBriefing') {
      ScriptApp.deleteTrigger(existing[i]);
    }
  }

  ScriptApp.newTrigger('requestWeeklyBriefing')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .create();

  Logger.log('Weekly trigger created: Mondays ~07:00 in the script timezone.');
}

/** Mails the current briefing to you alone. Safe to run any time. */
function sendTestBriefing() {
  var props = PropertiesService.getScriptProperties();
  var response = UrlFetchApp.fetch(
    props.getProperty('BRIEFING_DISPATCH_URL') + '?force=1',
    {
      method: 'post',
      headers: { Authorization: 'Bearer ' + props.getProperty('BRIEFING_CRON_SECRET') },
      muteHttpExceptions: true
    }
  );

  var payload = JSON.parse(response.getContentText());
  var me = Session.getActiveUser().getEmail();

  MailApp.sendEmail({
    to: me,
    subject: '[TEST] ' + payload.subject,
    name: SENDER_NAME,
    body: buildPlainTextEmail({
      periodLabel: payload.facts.periodLabel,
      bodyText: payload.briefing.text
    }, me),
    htmlBody: buildHtmlEmail({
      periodLabel: payload.facts.periodLabel,
      bodyText: payload.briefing.text
    }, me)
  });

  Logger.log('Test briefing sent to ' + me + ' (source: ' + payload.briefing.source + ')');
}
