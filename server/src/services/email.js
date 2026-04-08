const { Resend } = require('resend');

let resend = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = 'AutoPostule <onboarding@resend.dev>';

/**
 * Envoie un email de candidature (lettre de motivation)
 */
async function sendCandidatureEmail({ to, candidatName, companyName, jobTitle, lettreContent, objet }) {
  const client = getResend();
  if (!client) throw new Error('RESEND_API_KEY non configurée');

  const subject = objet || `Candidature — ${jobTitle || 'Alternance'} — ${candidatName}`;

  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 40px 30px; color: #1a1a1a; line-height: 1.7;">
      ${lettreContent.split('\n').map(line =>
        line.trim() === '' ? '<br/>' : `<p style="margin: 0 0 8px 0;">${line}</p>`
      ).join('')}
    </div>
  `;

  const { data, error } = await client.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject,
    html: htmlContent,
    text: lettreContent,
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Envoie un email de relance
 */
async function sendRelanceEmail({ to, candidatName, companyName, jobTitle, relanceContent }) {
  const client = getResend();
  if (!client) throw new Error('RESEND_API_KEY non configurée');

  const subject = `Relance — ${jobTitle || 'Candidature'} — ${candidatName}`;

  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 40px 30px; color: #1a1a1a; line-height: 1.7;">
      ${relanceContent.split('\n').map(line =>
        line.trim() === '' ? '<br/>' : `<p style="margin: 0 0 8px 0;">${line}</p>`
      ).join('')}
    </div>
  `;

  const { data, error } = await client.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject,
    html: htmlContent,
    text: relanceContent,
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Vérifie que Resend est configuré
 */
function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

module.exports = { sendCandidatureEmail, sendRelanceEmail, isEmailConfigured };
