const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  console.log("SMTP CHECK:", {
    host: host ? "OK" : "MISSING",
    port,
    user: user ? "OK" : "MISSING",
    pass: pass ? "OK" : "MISSING",
    from: from || "MISSING",
    to
  });

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP config missing in .env");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  await transporter.verify();
  console.log("SMTP VERIFIED SUCCESS");

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  console.log("EMAIL SENT:", info.messageId);

  return info;
};

module.exports = sendEmail;