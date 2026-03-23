import nodemailer from "nodemailer";

// Strip any accidental surrounding quotes that some .env editors add
const clean = (val) => (val || "").replace(/^["']|["']$/g, "").trim();

const EMAIL_USER = clean(process.env.EMAIL_USER);
const EMAIL_PASS = clean(process.env.EMAIL_PASS);
const EMAIL_HOST = clean(process.env.EMAIL_HOST) || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT) || 587;
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";

// Diagnostic on startup — shows what was actually read (password masked)
console.log("📧 Email config →", {
  host:   EMAIL_HOST,
  port:   EMAIL_PORT,
  secure: EMAIL_SECURE,
  user:   EMAIL_USER || "(not set)",
  pass:   EMAIL_PASS ? `${"*".repeat(EMAIL_PASS.length - 2)}` : "(not set)",
});

const transporter = nodemailer.createTransport({
  host:   EMAIL_HOST,
  port:   EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.warn("⚠️  Email transporter not ready:", err.message);
    console.warn("    → Check EMAIL_USER and EMAIL_PASS in your .env");
    console.warn("    → For Gmail: use an App Password, not your login password");
    console.warn("    → Guide: https://myaccount.google.com/apppasswords");
  } else {
    console.log("✅ Email transporter ready —", EMAIL_USER);
  }
});

export default transporter;

// Export cleaned values so mailer.js can use them too
export { EMAIL_USER, EMAIL_PASS };
