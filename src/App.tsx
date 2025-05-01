import React from 'react';
import Header from './components/Header';
import RightNavbar from './components/RightNavbar';

function App() {
  return (
    <div className="relative min-h-screen">
      <Header />
      <RightNavbar />

      <main>
        {/* Page content here */}
        <div style={{ height: '200vh' }}>
          Scroll down to test fixed navbars.
        </div>
      </main>
    </div>
  );
}

export default App;