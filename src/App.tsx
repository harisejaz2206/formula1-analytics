import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RaceTracker from './pages/RaceTracker';
import Profiles from './pages/Profiles';
import TrackInsights from './pages/TrackInsights';
import SeasonOverview from './pages/SeasonOverview';
import F1Guide from './pages/F1Guide';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-racing bg-fixed">
        <div className="bg-carbon-fiber bg-fixed min-h-screen">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/live" element={<RaceTracker />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/tracks" element={<TrackInsights />} />
              <Route path="/season" element={<SeasonOverview />} />
              <Route path="/guide" element={<F1Guide />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          <Analytics />
        </div>
      </div>
    </Router>
  );
}

export default App;