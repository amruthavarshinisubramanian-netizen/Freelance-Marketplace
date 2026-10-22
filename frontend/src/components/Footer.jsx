import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          <Link to="/projects">Browse Projects</Link>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Register</Link>
          <a href="http://localhost:8080/api/health" target="_blank" rel="noreferrer">System Health</a>
        </div>
        <p>&copy; 2026 FreelanceHub Platform. Built with Spring Boot, MySQL, and React.js.</p>
      </div>
    </footer>
  );
}

