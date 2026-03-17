import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="flex flex-col flex-grow">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 bg-gradient-to-br from-med-bg to-white z-[-1]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-med-primary font-medium text-sm mb-8 animate-slide-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-med-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-med-primary"></span>
            </span>
            AI-Powered Health Assistant
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-med-dark tracking-tight mb-8">
            Smart symptom analysis <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-med-primary to-med-accent">in seconds.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-med-muted leading-relaxed mb-10">
            MediGuide uses advanced AI to evaluate your symptoms instantly and provide clear, actionable guidance on your potential health risks and next steps.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/submit" className="flex items-center justify-center gap-2 px-8 py-4 bg-med-primary text-white text-lg font-medium rounded-full hover:bg-med-secondary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                Check Symptoms Now <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/register" className="flex items-center justify-center gap-2 px-8 py-4 bg-med-primary text-white text-lg font-medium rounded-full hover:bg-med-secondary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                Get Started for Free <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <a href="#how-it-works" className="px-8 py-4 bg-white text-med-dark text-lg font-medium rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-med-dark mb-4">How MediGuide Works</h2>
            <p className="text-lg text-med-muted">Three simple steps to understand what your symptoms might mean and what you should do next.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Activity className="w-8 h-8 text-blue-500" />,
                title: "1. Tell us how you feel",
                desc: "Enter your symptoms, duration, and severity securely through our intuitive form."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
                title: "2. Instant AI Analysis",
                desc: "Our secure triage engine instantly cross-references your inputs against clinical patterns."
              },
              {
                icon: <Clock className="w-8 h-8 text-purple-500" />,
                title: "3. Fast Recommendations",
                desc: "Get an immediate understanding of your triage risk level and actionable next steps."
              }
            ].map((ft, i) => (
              <div key={i} className="glass-panel p-8 rounded-3xl text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  {ft.icon}
                </div>
                <h3 className="text-xl font-bold text-med-dark mb-3">{ft.title}</h3>
                <p className="text-med-muted leading-relaxed">{ft.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-t border-b border-amber-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-amber-800 flex items-center justify-center gap-2">
           <AlertTriangle className="w-4 h-4 hidden sm:block" />
           <strong>Medical Disclaimer:</strong> MediGuide provides informational health guidance and does not replace professional medical diagnosis, advice, or treatment.
        </div>
      </div>
    </div>
  );
};
import { AlertTriangle } from 'lucide-react';

export default Home;
