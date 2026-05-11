import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SmokeyBackground } from "./Login";

gsap.registerPlugin(ScrollTrigger);
import Logo from "@/components/ui/Logo";
import { ArrowRight, Scale, Shield, Users, Target, BookOpen } from "lucide-react";

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const foundersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Animations
    if (heroRef.current) {
      const elements = heroRef.current.querySelectorAll(".animate-item");
      gsap.fromTo(
        elements,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" }
      );
    }

    // Scroll Animations for Info Section
    if (infoRef.current) {
      const cards = infoRef.current.querySelectorAll(".info-card");
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: infoRef.current,
            start: "top 80%",
          },
        }
      );
    }

    // Scroll Animations for Founders Section
    if (foundersRef.current) {
      const founders = foundersRef.current.querySelectorAll(".founder-card");
      gsap.fromTo(
        founders,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: foundersRef.current,
            start: "top 80%",
          },
        }
      );
    }
  }, []);

  const founders = [
    { name: "Alan García Jimenez", role: "Co-Founder & Software Engineer", image: "/alan.JPG" },
    { name: "Gonzalo Sandoval Vazquez", role: "Co-Founder & Software Engineer", image: "/gonzalo.jpg" },
    { name: "David Joacim Cervantes Gómez", role: "Co-Founder & Software Engineer", image: "/david.JPG" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full h-[100dvh] flex flex-col items-center justify-center border-b border-white/10">
        <SmokeyBackground color="#ffffff" backdropBlurAmount="xl" className="opacity-30 absolute inset-0 pointer-events-none" />
        
        <div ref={heroRef} className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center space-y-8 mt-12">
          <div className="animate-item mb-4 inline-block">
            <Logo variant="stacked" imgClassName="w-[300px] md:w-[500px] !invert-0" />
          </div>
          
         
          
          <p className="animate-item text-lg md:text-2xl text-gray-400 max-w-3xl font-light">
            La plataforma definitiva para la gestión de procesos civiles. Centraliza tus expedientes, colabora en tiempo real y obtén respuestas impulsadas por IA.
          </p>
          
          <div className="animate-item flex items-center justify-center gap-4 pt-8">
            <Link
              to="/login"
              className="group flex items-center justify-center py-4 px-8 bg-white text-zinc-950 hover:bg-gray-200 rounded-full font-bold transition-all duration-300"
            >
              Iniciar Sesión
              <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center py-4 px-8 bg-transparent border border-white/30 hover:bg-white/10 text-white rounded-full font-bold transition-all duration-300"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section ref={infoRef} className="py-32 px-6 bg-zinc-950 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="info-card p-10 rounded-3xl bg-zinc-900 border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-full h-48 rounded-2xl bg-white/10 overflow-hidden mb-6 relative">
                <img src="/mission.png" alt="Misión" className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Nuestra Misión</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Transformar el paradigma de la administración de justicia proporcionando a magistrados y abogados herramientas tecnológicas de vanguardia que garanticen agilidad, transparencia y precisión en la resolución de cada caso procesal.
              </p>
            </div>
          </div>

          <div className="info-card p-10 rounded-3xl bg-zinc-900 border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-full h-48 rounded-2xl bg-white/10 overflow-hidden mb-6 relative">
                <img src="/vision.png" alt="Visión" className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Nuestra Visión</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Ser el estándar de oro en infraestructura legal y judicial en México, eliminando las barreras burocráticas a través del uso de la Inteligencia Artificial y arquitecturas eficientes que acerquen la justicia a quienes la necesitan.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Service Overview */}
      <section className="py-24 px-6 bg-zinc-900/50 border-y border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">¿Qué ofrecemos?</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-16 font-light">
            Una suite completa diseñada para optimizar cada etapa del proceso civil.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Expedientes Centralizados", desc: "Todos los documentos, mociones y sentencias organizados de manera segura en un solo lugar.", icon: <Shield size={24} /> },
              { title: "Asistencia de IA", desc: "Chatbot jurídico avanzado entrenado específicamente con los documentos del caso para obtener respuestas precisas y rápidas.", icon: <Scale size={24} /> },
              { title: "Colaboración Fluida", desc: "Comunicación directa entre demandantes, defensores y jueces mediante una interfaz clara y estructurada.", icon: <Users size={24} /> }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-zinc-900 border border-white/5 text-left flex flex-col hover:bg-zinc-800 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white text-zinc-950 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section ref={foundersRef} className="py-32 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Fundadores</h2>
            <p className="text-xl text-gray-400 font-light">
              El equipo multidisciplinario detrás de la innovación procesal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {founders.map((founder, i) => (
              <div key={i} className="founder-card group p-8 rounded-3xl bg-zinc-900 border border-white/5 text-center flex flex-col items-center transition-all hover:bg-white/5 hover:border-white/20">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-zinc-900 mb-6 flex items-center justify-center border-4 border-zinc-950 shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                  <img src={founder.image} alt={founder.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{founder.name}</h3>
                <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{founder.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center text-gray-500 text-sm bg-zinc-950">
        <p>© {new Date().getFullYear()} Plataforma de Gestión Procesal Civil. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
