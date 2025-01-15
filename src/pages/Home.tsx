import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Flag, Timer, Users, MapPin, TrendingUp, ChevronRight,
    Trophy, Gauge, Car, Calendar, Star, Activity, BookOpen, Sparkles
} from 'lucide-react';

const telemetryMessages = [
    "ANALYZING_RACE_STRATEGY...",
    "CALCULATING_OPTIMAL_PITSTOP...",
    "MONITORING_TIRE_DEGRADATION...",
    "CHECKING_ERS_DEPLOYMENT...",
    "MEASURING_DOWNFORCE_LEVELS...",
    "ANALYZING_SECTOR_TIMES...",
    "CALCULATING_FUEL_DELTA...",
    "MONITORING_BRAKE_TEMPS...",
    "DRS_DETECTION_ACTIVE...",
    "SCANNING_TRACK_CONDITIONS..."
];

const statusMessages = [
    "DRS_ENABLED: TRUE",
    "TIRE_COMPOUND: SOFT",
    "ERS_MODE: OVERTAKE",
    "FUEL_MODE: RICH",
    "MGU-K: HARVESTING",
    "BATTERY_SOC: 98%",
    "GRIP_LEVEL: OPTIMAL",
    "TRACK_STATUS: GREEN",
    "DELTA_TIME: -0.245s",
    "SLIPSTREAM: DETECTED"
];

const Home: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % telemetryMessages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: Timer,
            title: "Race Tracker",
            description: "Track live race positions, lap times, pit stops, and detailed performance analysis",
            link: "/live"
        },
        {
            icon: Users,
            title: "Driver & Team Profiles",
            description: "In-depth statistics, team battles, and comprehensive performance metrics",
            link: "/profiles"
        },
        {
            icon: MapPin,
            title: "Track Insights",
            description: "Circuit analysis, track records, and historical race data",
            link: "/tracks"
        },
        {
            icon: TrendingUp,
            title: "Season Overview",
            description: "Championship standings, points progression, and constructor performance analysis",
            link: "/season"
        }
    ];

    const quickLinks = [
        {
            icon: Timer,
            label: "Live Race",
            subtext: "Real-time race tracking & analysis",
            path: "/live"
        },
        {
            icon: Trophy,
            label: "Standings",
            subtext: "Championship points & rankings",
            path: "/season"
        },
        {
            icon: Users,
            label: "Teams",
            subtext: "Constructor & driver profiles",
            path: "/profiles"
        },
        {
            icon: MapPin,
            label: "Circuits",
            subtext: "Track details & race history",
            path: "/tracks"
        },
    ];

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray min-h-[500px] flex items-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505739679850-83414149af25?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-f1-black via-f1-black/80 to-transparent"></div>

                <div className="relative z-10 max-w-3xl mx-8">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Experience Formula 1
                        <span className="text-f1-red block">Like Never Before</span>
                    </h1>
                    <p className="text-xl text-f1-silver/80 mb-8 leading-relaxed">
                        Dive into the world of Formula 1 with real-time race tracking, comprehensive statistics, and in-depth analysis of every circuit and driver.
                    </p>
                    <div className="flex flex-wrap gap-4 mb-6">
                        <NavLink
                            to="/live"
                            className="inline-flex items-center px-6 py-3 bg-f1-red text-white rounded-lg hover:bg-f1-red/90 transition-colors duration-300 w-full sm:w-auto"
                        >
                            <Timer className="w-5 h-5 mr-2 flex-shrink-0" />
                            <span className="truncate">Live Race Tracker</span>
                            <ChevronRight className="w-5 h-5 ml-2 flex-shrink-0" />
                        </NavLink>
                        <NavLink
                            to="/season"
                            className="inline-flex items-center px-6 py-3 bg-f1-gray/30 text-white rounded-lg hover:bg-f1-gray/50 transition-colors duration-300 w-full sm:w-auto"
                        >
                            <Trophy className="w-5 h-5 mr-2 flex-shrink-0" />
                            <span className="truncate">Season Overview</span>
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Quick Links Section - With Subtexts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map((link) => (
                    <NavLink
                        key={link.label}
                        to={link.path}
                        className="f1-card p-6 flex flex-col items-center justify-center text-center hover:scale-105 transition-all duration-300 group"
                    >
                        <link.icon className="w-8 h-8 text-f1-red mb-3 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-lg font-bold text-white mb-1">
                            {link.label}
                        </span>
                        <span className="text-sm text-f1-silver/80 group-hover:text-f1-silver transition-colors duration-300">
                            {link.subtext}
                        </span>
                    </NavLink>
                ))}
            </div>

            {/* Add this after the Quick Links Section and before the Features Grid */}
            <section className="f1-card p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-f1-red" />
                            New to Formula 1?
                        </h2>
                        <p className="text-f1-silver/80 text-lg leading-relaxed">
                            Dive into our comprehensive F1 guide. From race formats to technical regulations, 
                            we've got everything you need to understand the pinnacle of motorsport.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 text-f1-silver">
                                <Flag className="w-5 h-5 text-f1-red" />
                                <span>Race Formats</span>
                            </div>
                            <div className="flex items-center gap-3 text-f1-silver">
                                <Trophy className="w-5 h-5 text-f1-red" />
                                <span>Scoring System</span>
                            </div>
                            <div className="flex items-center gap-3 text-f1-silver">
                                <Gauge className="w-5 h-5 text-f1-red" />
                                <span>Technical Rules</span>
                            </div>
                            <div className="flex items-center gap-3 text-f1-silver">
                                <Sparkles className="w-5 h-5 text-f1-red" />
                                <span>Strategy Guide</span>
                            </div>
                        </div>
                        <NavLink
                            to="/guide"
                            // onClick={() => console.log('Guide button clicked')}
                            className="inline-flex items-center px-6 py-3 bg-f1-red text-white rounded-lg 
                                      hover:bg-f1-red/90 transition-all duration-300 group/button relative z-30"
                        >
                            <BookOpen className="w-5 h-5 mr-2" />
                            <span>Explore F1 Guide</span>
                            <ChevronRight className="w-5 h-5 ml-2 group-hover/button:translate-x-1 transition-transform duration-300" />
                        </NavLink>
                    </div>
                    
                    <div className="relative hidden lg:block">
                        <div className="absolute inset-0 bg-gradient-to-r from-f1-black/80 to-transparent z-10"></div>
                        <div className="h-full w-full bg-f1-black rounded-lg overflow-hidden">
                            {/* Tech Overlay Elements */}
                            <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between">
                                <div className="flex justify-end">
                                    <div className="text-f1-red/60 font-mono text-sm animate-pulse">
                                        F1_TELEMETRY_SYSTEM_V23
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-f1-red/60 font-mono text-sm">
                                        <div className="animate-typewriter">
                                            {telemetryMessages[messageIndex]}
                                        </div>
                                    </div>
                                    <div className="text-f1-red/60 font-mono text-sm">
                                        {statusMessages[messageIndex]}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Enhanced Grid Animation */}
                            <div className="grid-animation">
                                {[...Array(150)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="grid-item"
                                        style={{
                                            animationDelay: `${Math.random() * 3}s`,
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                            width: `${Math.random() * 6 + 2}px`,
                                            height: `${Math.random() * 6 + 2}px`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature) => (
                    <NavLink
                        key={feature.title}
                        to={feature.link}
                        className="f1-card p-6 group hover:scale-[1.02] transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <feature.icon className="w-8 h-8 text-f1-red mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-f1-silver/80 mb-4">{feature.description}</p>
                        <div className="flex items-center text-f1-red group-hover:translate-x-2 transition-transform duration-300">
                            <span className="mr-2">Explore</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </NavLink>
                ))}
            </div>

            {/* Call to Action Section - New */}
            <div className="f1-card p-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience F1?</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    <NavLink
                        to="/live"
                        className="inline-flex items-center px-6 py-3 bg-f1-red text-white rounded-lg hover:bg-f1-red/90 transition-colors duration-300"
                    >
                        <Timer className="w-5 h-5 mr-2" />
                        Live Race Tracker
                    </NavLink>
                    <NavLink
                        to="/profiles"
                        className="inline-flex items-center px-6 py-3 bg-f1-gray/30 text-white rounded-lg hover:bg-f1-gray/50 transition-colors duration-300"
                    >
                        <Users className="w-5 h-5 mr-2" />
                        View Drivers & Teams
                    </NavLink>
                    <NavLink
                        to="/tracks"
                        className="inline-flex items-center px-6 py-3 bg-f1-gray/30 text-white rounded-lg hover:bg-f1-gray/50 transition-colors duration-300"
                    >
                        <MapPin className="w-5 h-5 mr-2" />
                        Explore Tracks
                    </NavLink>
                    <NavLink
                        to="/season"
                        className="inline-flex items-center px-6 py-3 bg-f1-gray/30 text-white rounded-lg hover:bg-f1-gray/50 transition-colors duration-300"
                    >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Season Stats
                    </NavLink>
                </div>
            </div>

            {/* Stats Section */}
            <div className="f1-card p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <Gauge className="w-10 h-10 text-f1-red mx-auto mb-4" />
                        <div className="text-4xl font-bold text-white mb-2">350+ km/h</div>
                        <p className="text-f1-silver/60">Top Speeds</p>
                    </div>
                    <div className="text-center">
                        <Flag className="w-10 h-10 text-f1-red mx-auto mb-4" />
                        <div className="text-4xl font-bold text-white mb-2">23</div>
                        <p className="text-f1-silver/60">Grand Prix</p>
                    </div>
                    <div className="text-center">
                        <Trophy className="w-10 h-10 text-f1-red mx-auto mb-4" />
                        <div className="text-4xl font-bold text-white mb-2">20</div>
                        <p className="text-f1-silver/60">Drivers</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 