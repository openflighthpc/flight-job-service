import React from 'react';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer border-top">
      <div className="container">
        <span className="text-muted float-left">
          Copyright {year} openflightHPC
        </span>
      </div>
    </footer>
  );
}

export default Footer;
