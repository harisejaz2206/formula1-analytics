import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BookOpen, Flag, Timer, Users, MapPin,
    Settings, Award, Car, Gauge, Clock,
    ChevronRight, Trophy, Calendar,
    AlertTriangle,
    Zap,
    Radio,
    Scale,
    HeartPulse,
    Wrench
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const F1Guide: React.FC = () => {
    const guideTopics = [
        {
            title: "Race Weekend Format",
            icon: Calendar,
            content: [
                "Friday - FP1 (60min) & Qualifying for Sunday's Race",
                "Saturday - Sprint Shootout & Sprint Race (100km)",
                "Sunday - Main Race (305km or 2 hours)",
                "Three practice sessions on non-sprint weekends",
                "Q1, Q2, Q3 format with progressive elimination",
                "Parc fermé conditions after qualifying"
            ]
        },
        {
            title: "Scoring System",
            icon: Trophy,
            content: [
                "Race Points: 25-18-15-12-10-8-6-4-2-1",
                "Sprint Points: 8-7-6-5-4-3-2-1",
                "Fastest Lap: 1 point (if finishing in top 10)",
                "Constructor points = sum of both drivers",
                "Points halved if less than 75% race distance",
                "All points lost if disqualified"
            ]
        },
        {
            title: "Car Components",
            icon: Car,
            content: [
                "V6 1.6L Turbo Hybrid (1,000+ HP combined)",
                "ERS: MGU-K (Kinetic) & MGU-H (Heat) recovery",
                "DRS: Reduces drag by opening rear wing",
                "18-inch Pirelli tires with 5 compounds",
                "Limited components per season (PU, gearbox)",
                "Minimum weight: 798kg with driver"
            ]
        },
        {
            title: "Race Rules",
            icon: Flag,
            content: [
                "Blue Flags: Must let faster cars pass within 3 corners",
                "Yellow Flags: Slow down, no overtaking",
                "Red Flags: Race stopped, return to pit lane",
                "Black & Orange: Must pit for repairs",
                "5-second/10-second/Drive-through penalties",
                "Track limits: 3 warnings then penalty"
            ]
        },
        {
            title: "Safety Procedures",
            icon: AlertTriangle,
            content: [
                "Safety Car: Field bunches up, no overtaking",
                "Virtual Safety Car (VSC): 40% slower pace",
                "Red Flag: Race suspended, cars to pits",
                "Formation Lap: Tire and brake warming",
                "Medical Car follows first lap",
                "Minimum delta time under yellow flags"
            ]
        },
        {
            title: "Technical Regulations",
            icon: Wrench,
            content: [
                "Cost Cap: $135M per team (2024)",
                "Wind tunnel time based on championship position",
                "Strict fuel flow and composition rules",
                "Mandatory crash tests and safety features",
                "Specific aerodynamic testing restrictions",
                "Parc fermé working window limitations"
            ]
        },
        {
            title: "Power Unit Details",
            icon: Zap,
            content: [
                "1.6L V6 Turbo Hybrid Engine",
                "Energy Store: 1.1kWh lithium-ion battery",
                "15,000 RPM maximum limit",
                "3 ICE, Turbo, MGU-H, MGU-K per season",
                "2 Energy Store & Control Electronics",
                "Fuel flow limit: 100kg/hour maximum"
            ]
        },
        {
            title: "Strategy Elements",
            icon: Settings,
            content: [
                "Mandatory pit stop (two tire compounds)",
                "Undercut: Early pit for track position",
                "Overcut: Extended stint for track position",
                "Tire management crucial for performance",
                "Fuel load affects lap times significantly",
                "Weather forecast impacts tire choice"
            ]
        }
    ];

    const keyStats = [
        { label: "Top Speed", value: "350+ km/h", icon: Gauge, detail: "Monza straight" },
        { label: "Race Distance", value: "~305 km", icon: MapPin, detail: "or 2 hours max" },
        { label: "Pit Stop Time", value: "~2.5 sec", icon: Timer, detail: "Stationary time" },
        { label: "G-Forces", value: "Up to 6G", icon: Settings, detail: "High-speed corners" },
        { label: "Engine Power", value: "1,000+ HP", icon: Zap, detail: "Combined output" },
        { label: "Fuel Limit", value: "110 kg", icon: Scale, detail: "Per race max" },
        { label: "Driver Weight", value: "~70 kg", icon: HeartPulse, detail: "With equipment" },
        { label: "Radio Range", value: "~2 km", icon: Radio, detail: "Team communication" }
    ];

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-f1-black to-f1-gray p-8 mb-8">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white mb-2">Formula 1 Guide</h1>
                    <p className="text-f1-silver/80 text-lg">Your comprehensive guide to understanding F1</p>
                    <p className="text-f1-silver/60 text-sm mt-2">Updated for 2024 Season Regulations</p>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
                    <BookOpen className="w-full h-full" />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {keyStats.map((stat) => (
                    <div key={stat.label} className="f1-card p-6 flex flex-col items-center text-center group relative">
                        <stat.icon className="w-8 h-8 text-f1-red mb-3" />
                        <span className="text-2xl font-bold text-white mb-1">{stat.value}</span>
                        <span className="text-sm text-f1-silver/80">{stat.label}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 left-0 right-0 text-xs text-f1-silver/60 px-2">
                            {stat.detail}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Guide Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guideTopics.map((topic) => (
                    <div key={topic.title} className="f1-card p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-f1-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex items-center mb-4">
                            <topic.icon className="w-6 h-6 text-f1-red mr-3" />
                            <h2 className="text-xl font-bold text-white">{topic.title}</h2>
                        </div>
                        <ul className="space-y-2">
                            {topic.content.map((item, index) => (
                                <li key={index} className="flex items-start text-f1-silver">
                                    <ChevronRight className="w-4 h-4 text-f1-red mr-2 mt-1 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Call to Action */}
            <div className="f1-card p-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience F1?</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    <NavLink
                        to="/live"
                        className="inline-flex items-center px-6 py-3 bg-f1-red text-white rounded-lg hover:bg-f1-red/90 transition-colors duration-300"
                    >
                        <Timer className="w-5 h-5 mr-2" />
                        Watch Live Race
                    </NavLink>
                    <NavLink
                        to="/season"
                        className="inline-flex items-center px-6 py-3 bg-f1-gray/30 text-white rounded-lg hover:bg-f1-gray/50 transition-colors duration-300"
                    >
                        <Trophy className="w-5 h-5 mr-2" />
                        View Standings
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default F1Guide; 