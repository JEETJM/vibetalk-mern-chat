function Landing() {
  return (
    <div className="landing-page">
      <div className="landing-card">
        <div className="landing-logo">⚡</div>

        <h1>VibeTalk</h1>

        <p>
          Private real-time chat with voice, images, files, emoji and premium
          WhatsApp-style UI.
        </p>

        <div className="landing-actions">
          <a href="/login">Login</a>
          <a href="/register" className="register-link">
            Create Account
          </a>
        </div>
      </div>

      <footer className="landing-footer">
        <h3>Connect with Jeet Mondal</h3>

        <div className="social-links">
          <a href="https://github.com/JEETJM" target="_blank">
            GitHub
          </a>

          <a href="https://www.linkedin.com/in/jm1904/" target="_blank">
            LinkedIn
          </a>

          <a href="https://www.freecodecamp.org/jm382118" target="_blank">
            freeCodeCamp
          </a>

          <a href="mailto:jm382118@gmail.com">
            Email
          </a>
        </div>

        <p>© 2026 VibeTalk | Developed by Jeet Mondal</p>
      </footer>
    </div>
  );
}

export default Landing;