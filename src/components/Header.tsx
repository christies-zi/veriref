import React from 'react';
import '../styles/Header.css';
import image from '../assets/image.png';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="image-container"><img src={image} alt="Logo" className="logo"/></div>
    </header>
  );
};

export default Header;
