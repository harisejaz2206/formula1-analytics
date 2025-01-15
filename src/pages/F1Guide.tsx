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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

const DetailedGuide = {
  racing: {
    title: "Racing Rules & Procedures",
    sections: [
      {
        subtitle: "Qualifying Format",
        content: [
          "Q1 (18 minutes): All 20 cars participate, bottom 5 eliminated",
          "Q2 (15 minutes): 15 cars compete, bottom 5 eliminated",
          "Q3 (12 minutes): Top 10 shootout for pole position",
          "107% rule: Must be within 107% of Q1's fastest time",
          "Parc fermé begins before qualifying - limited car changes allowed"
        ]
      },
      {
        subtitle: "Sprint Format",
        content: [
          "Sprint Shootout: Shorter qualifying (SQ1: 12min, SQ2: 10min, SQ3: 8min)",
          "100km Sprint Race with no mandatory pit stops",
          "Points awarded to top 8 (8-7-6-5-4-3-2-1)",
          "Free tire choice and separate parc fermé rules",
          "Results don't determine Sunday's grid position"
        ]
      },
      {
        subtitle: "Flag Rules",
        content: [
          "🔵 Blue Flag: Let faster car pass within 3 corners or face penalty",
          "💛 Yellow Flag: Slow down, no overtaking, be prepared to stop",
          "🔴 Red Flag: Session stopped, return to pits immediately",
          "⚫️ Black Flag: Driver disqualified, must return to pits",
          "🏁 Checkered Flag: Session/race ended",
          "⚫️🟠 Black & Orange: Mechanical issue, must pit for repairs"
        ]
      }
    ]
  },
  technical: {
    title: "Technical Regulations",
    sections: [
      {
        subtitle: "Power Unit Components",
        content: [
          "Internal Combustion Engine (ICE): 3 per season",
          "Turbocharger (TC): 3 per season",
          "Motor Generator Unit - Heat (MGU-H): 3 per season",
          "Motor Generator Unit - Kinetic (MGU-K): 3 per season",
          "Energy Store (ES): 2 per season",
          "Control Electronics (CE): 2 per season",
          "Exceeding allocations results in grid penalties"
        ]
      },
      {
        subtitle: "Aerodynamic Testing Restrictions",
        content: [
          "Wind tunnel time allocated based on championship position",
          "1st place: 70% of baseline testing allowed",
          "Last place: 115% of baseline testing allowed",
          "CFD (Computational Fluid Dynamics) restrictions apply",
          "Cost cap affects development capabilities"
        ]
      }
    ]
  },
  strategy: {
    title: "Race Strategy",
    sections: [
      {
        subtitle: "Tire Management",
        content: [
          "C0 (Hardest) to C5 (Softest) compounds available",
          "Must use at least two different compounds in dry race",
          "Tire degradation affects pace and strategy",
          "Graining: Surface rubber balls up reducing grip",
          "Blistering: Subsurface heat damage to tires",
          "Thermal degradation vs. mechanical wear"
        ]
      },
      {
        subtitle: "Pit Stop Strategy",
        content: [
          "Undercut: Pitting before competitor for fresh tire advantage",
          "Overcut: Staying out longer while competitor pits",
          "Track position vs. tire advantage trade-off",
          "Safety Car often triggers opportunistic stops",
          "Temperature management during formation laps",
          "Fuel load affects early race pace"
        ]
      }
    ]
  }
};

const F1Guide: React.FC = () => {
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

            {/* Detailed Guide Tabs */}
            <div className="f1-card p-6">
                <Tabs defaultValue="racing" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6">
                        <TabsTrigger value="racing">Racing Rules</TabsTrigger>
                        <TabsTrigger value="technical">Technical</TabsTrigger>
                        <TabsTrigger value="strategy">Strategy</TabsTrigger>
                    </TabsList>

                    {Object.entries(DetailedGuide).map(([key, section]) => (
                        <TabsContent key={key} value={key} className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                            {section.sections.map((subsection, idx) => (
                                <div key={idx} className="bg-f1-gray/20 rounded-lg p-6 space-y-4">
                                    <h3 className="text-xl font-bold text-f1-red flex items-center gap-2">
                                        <ChevronRight className="w-5 h-5" />
                                        {subsection.subtitle}
                                    </h3>
                                    <ul className="space-y-3">
                                        {subsection.content.map((item, i) => (
                                            <li key={i} className="text-f1-silver flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-f1-red mt-2 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
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