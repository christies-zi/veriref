import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RightNavbar.css';

const RightNavbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="right-navbar">
      <button className="nav-button" onClick={() => navigate('/')}>🏠</button>
      <button className="nav-button" onClick={() => navigate('/verify')}>➕</button>
    </nav>
  );
};

export default RightNavbar;
