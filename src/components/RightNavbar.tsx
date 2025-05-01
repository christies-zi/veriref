import React from 'react';
import '../styles/RightNavbar.css';

const RightNavbar: React.FC = () => {
  return (
    <nav className="right-navbar">
      <button className="nav-button">🏠</button>
      <button className="nav-button">➕</button>
    </nav>
  );
};

export default RightNavbar;
