import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import RightNavbar from './components/RightNavbar';
import Home from './components/Home'
import './styles/App.css';
import VerifyPage from './components/VerifyPage'
import SentencesComponent from './components/SentencesComponent';
import { PdfProvider } from './components/PdfContext';
import Help from './components/Help';

const App: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <Header />
      <RightNavbar />
      <main className="main-content">
        <PdfProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verify" element={<VerifyPage key={location.key}/>} />
          <Route path="/result" element={<SentencesComponent />} />
          <Route path="/help" element={<Help />} />
        </Routes>
        </PdfProvider>
      </main>
    </>
  );
};

export default App;
