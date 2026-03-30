export function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <nav className="app-footer-nav" aria-label="About the author">
          <a
            href="https://www.linkedin.com/in/benjamin-programmer/"
            className="app-footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <span className="app-footer-sep" aria-hidden="true">
            ·
          </span>
          <a
            href="https://github.com/ben-shepherd/captain-of-industry-calculator"
            className="app-footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
        <p className="app-footer-contrib">
          <a
            href="https://github.com/ben-shepherd/captain-of-industry-calculator/issues"
            className="app-footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contributions welcome.
          </a>
        </p>
      </div>
    </footer>
  );
}
