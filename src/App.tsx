import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

const Home = lazy(() => import('./pages/Home'));
const RaceTracker = lazy(() => import('./pages/RaceTracker'));
const Profiles = lazy(() => import('./pages/Profiles'));
const TrackInsights = lazy(() => import('./pages/TrackInsights'));
const SeasonOverview = lazy(() => import('./pages/SeasonOverview'));
const F1Guide = lazy(() => import('./pages/F1Guide'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <div className="app-content-area">
          <main className="app-main">
            <Suspense fallback={<LoadingSpinner label="Loading F1IQ module..." />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/live" element={<RaceTracker />} />
                <Route path="/profiles" element={<Profiles />} />
                <Route path="/tracks" element={<TrackInsights />} />
                <Route path="/season" element={<SeasonOverview />} />
                <Route path="/guide" element={<F1Guide />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Suspense>
          </main>
          <Analytics />
        </div>
      </div>
    </Router>
  );
}

export default App;
