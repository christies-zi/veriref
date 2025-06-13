import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <section className="hero">
        <h1 className="hero-title">Welcome to VeriRef</h1>
        <p className="hero-subtitle">
          AI-powered misinformation detection tool
        </p>
      </section>

      <div className="button-group">
        <button className="submit-button" onClick={() => navigate('/verify')}>
          Verify New Text
        </button>
        <button className="submit-button" onClick={() => navigate('/help')}>
          Help
        </button>
      </div>
    </div>
  );
};

export default Home;



