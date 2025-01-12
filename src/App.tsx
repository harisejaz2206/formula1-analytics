import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RaceTracker from './pages/RaceTracker';
import Profiles from './pages/Profiles';
import TrackInsights from './pages/TrackInsights';
import SeasonOverview from './pages/SeasonOverview';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<RaceTracker />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/tracks" element={<TrackInsights />} />
            <Route path="/season" element={<SeasonOverview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;