import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="button-group">
        <button className="submit-button" onClick={() => navigate('/verify')}>
          Verify New Text
        </button>
        <button className="submit-button" onClick={() => navigate('/help')}>
          Help
        </button>
      </div>
      <p className="description">
        VeriRef helps you identify misinformation in text using powerful AI verification tools built on Mistral.
        Upload or enter text, and let the system analyse it for factual accuracy.
      </p>
    </div>
  );
};

export default Home;

