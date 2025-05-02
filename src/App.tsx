import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import RightNavbar from './components/RightNavbar';
import Home from './components/Home'
import './styles/App.css';
import VerifyPage from './components/VerifyPage'
import SentencesComponent from './components/SentencesComponent';
import { PdfProvider } from './components/PdfContext';


export enum ClaimTypes {
  notAnalysing = 0,
  correct = 1,
  incorrect = 2,
  cannotSay = 3,
  noSource = 4,
  processing = 5,
  almostCorrect = 6,
  mightBeCorrect = 7,
  textNotRelated = 8
}

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
        </Routes>
        </PdfProvider>
      </main>
    </>
  );
};

export default App;
