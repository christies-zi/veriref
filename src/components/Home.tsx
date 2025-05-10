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
          Your AI-powered tool to detect and counter misinformation.
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

      <section className="features">
        <div className="feature-card">
          <h3>Real-Time Analysis</h3>
          <p>Instantly scan any text for factual inconsistencies using state-of-the-art AI models.</p>
        </div>
        <div className="feature-card">
          <h3>Easy to Use</h3>
          <p>A simple interface that lets anyone check text for reliability without technical knowledge.</p>
        </div>
        <div className="feature-card">
          <h3>Trusted Models</h3>
          <p>Powered by Mistral – advanced language models built for accuracy and reliability.</p>
        </div>
        <div className="feature-card">
          <h3>Free & Fast</h3>
          <p>Verify content at no cost, with quick results and clean presentation.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;



