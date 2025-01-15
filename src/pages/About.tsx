import React, { useEffect, useRef } from 'react';
import {
    Mail, Globe, Github, Linkedin, BookOpen,
    ChevronRight, Terminal, Code, Cpu
} from 'lucide-react';

const About: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const socialLinks = [
        {
            icon: Mail,
            label: 'Email',
            href: 'mailto:haris@f1iq.com',
            color: 'hover:text-blue-400'
        },
        {
            icon: Globe,
            label: 'Website',
            href: 'https://harisejaz.com',
            color: 'hover:text-green-400'
        },
        {
            icon: Github,
            label: 'GitHub',
            href: 'https://github.com/harisejaz2206',
            color: 'hover:text-purple-400'
        },
        {
            icon: Linkedin,
            label: 'LinkedIn',
            href: 'https://www.linkedin.com/in/harisejaz22/',
            color: 'hover:text-blue-500'
        },
        {
            icon: BookOpen,
            label: 'Blog',
            href: 'https://harisejaz.substack.com',
            color: 'hover:text-orange-400'
        }
    ];

    return (
        <div ref={containerRef} className="min-h-screen space-y-16 py-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-f1-red/20 to-transparent opacity-50" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center space-y-8 animate-on-scroll opacity-0 translate-y-8">
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                            Driving Innovation in
                            <span className="text-f1-red block mt-2">Formula 1 Analytics</span>
                        </h1>
                        <p className="text-xl text-f1-silver/80 max-w-3xl mx-auto leading-relaxed">
                            F1IQ is crafted with passion by developers who live and breathe Formula 1,
                            bringing you the most comprehensive F1 analytics platform.
                        </p>
                    </div>
                </div>
            </section>

            {/* Developer Profile */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="f1-card p-8 relative overflow-hidden animate-on-scroll opacity-0 translate-y-8">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-f1-red/10 to-transparent rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-f1-red to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                                <div className="relative w-48 h-48 rounded-full overflow-hidden">
                                    <img
                                        src="/profilepic.png"
                                        alt="Haris Ejaz"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 text-center md:text-left">
                                <h2 className="text-3xl font-bold text-white">Haris Ejaz</h2>
                                <p className="text-f1-silver/80 max-w-2xl leading-relaxed">
                                    Full-stack developer and F1 enthusiast with a passion for creating
                                    immersive digital experiences. Specializing in modern web technologies
                                    and real-time data visualization.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    {socialLinks.map((link) => (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg 
                        bg-f1-gray/50 backdrop-blur-sm 
                        transition-all duration-300 
                        hover:scale-105 ${link.color}`}
                                        >
                                            <link.icon className="w-5 h-5" />
                                            <span>{link.label}</span>
                                            <ChevronRight className="w-4 h-4 opacity-50" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="f1-card p-6 animate-on-scroll opacity-0 translate-y-8">
                        <Terminal className="w-8 h-8 text-f1-red mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Modern Stack</h3>
                        <p className="text-f1-silver/70">
                            Built with React, TypeScript, and Tailwind CSS for a blazing-fast user experience.
                        </p>
                    </div>
                    <div className="f1-card p-6 animate-on-scroll opacity-0 translate-y-8 delay-100">
                        <Code className="w-8 h-8 text-f1-red mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Clean Code</h3>
                        <p className="text-f1-silver/70">
                            Maintainable, well-documented code following best practices and design patterns.
                        </p>
                    </div>
                    <div className="f1-card p-6 animate-on-scroll opacity-0 translate-y-8 delay-200">
                        <Cpu className="w-8 h-8 text-f1-red mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Real-time Data</h3>
                        <p className="text-f1-silver/70">
                            Live race tracking and analytics powered by advanced APIs and WebSocket connections.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="f1-card p-8 text-center animate-on-scroll opacity-0 translate-y-8">
                    <h2 className="text-3xl font-bold text-white mb-4">Get in Touch</h2>
                    <p className="text-f1-silver/80 mb-6 max-w-2xl mx-auto">
                        Have questions about F1IQ or interested in collaboration?
                        I'd love to hear from you!
                    </p>
                    <a
                        href="mailto:haris@f1iq.com"
                        className="inline-flex items-center space-x-2 px-6 py-3 
                     bg-f1-red text-white rounded-lg 
                     hover:bg-f1-red/90 transition-colors duration-300"
                    >
                        <Mail className="w-5 h-5" />
                        <span>Send a Message</span>
                    </a>
                </div>
            </section>
        </div>
    );
};

export default About; 