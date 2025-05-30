import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import MikeLogo from './Logo';
import { AI_NAME, CREATOR_NAME, CREATOR_LINK } from '../constants';

interface LandingPageProps {
  onStartChat: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartChat }) => {
  const [heroRef, heroInView] = useInView({ triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true });

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      icon: "🎯",
      title: "ذكاء محلي",
      description: "يفهم لهجتك وثقافتك السعودية"
    },
    {
      icon: "🗣️",
      title: "محادثة طبيعية",
      description: "يتحدث معك بأسلوب عفوي وقريب"
    },
    {
      icon: "🎨",
      title: "إنشاء صور",
      description: "يمكنه إنشاء صور من وصفك النصي"
    },
    {
      icon: "🔊",
      title: "دعم صوتي",
      description: "يمكنك التحدث معه صوتياً"
    },
    {
      icon: "📱",
      title: "تجربة سلسة",
      description: "واجهة سهلة الاستخدام ومتجاوبة"
    },
    {
      icon: "🔒",
      title: "خصوصية آمنة",
      description: "حماية لبياناتك ومحادثاتك"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 py-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
        
        <MikeLogo size={120} className="mb-8" />
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-sky-200">
          {AI_NAME} - الذكاء الاصطناعي السعودي
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
          أول ذكاء اصطناعي يفهم لهجتك وثقافتك السعودية. يتحدث معك بأسلوب طبيعي، يساعدك، يجيب على أسئلتك، وينشئ صور من وصفك.
        </p>
        
        <button
          onClick={onStartChat}
          className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full text-lg font-semibold 
                   hover:from-sky-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          جرب {AI_NAME} الآن
        </button>
      </motion.section>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
        className="py-20 px-4 bg-slate-900/50 backdrop-blur-lg"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-sky-400 to-blue-300 bg-clip-text text-transparent">
            مميزات {AI_NAME}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50
                         backdrop-blur-lg hover:transform hover:scale-105 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-sky-300">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        ref={ctaRef}
        initial="hidden"
        animate={ctaInView ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
        className="py-20 px-4 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-sky-400 to-blue-300 bg-clip-text text-transparent">
            ابدأ محادثتك مع {AI_NAME} الآن
          </h2>
          
          <p className="text-lg text-slate-300 mb-8">
            اكتشف قدرات الذكاء الاصطناعي السعودي. محادثة ذكية، فهم عميق، وتجربة فريدة تناسب ثقافتنا.
          </p>
          
          <button
            onClick={onStartChat}
            className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full text-lg font-semibold
                     hover:from-sky-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            ابدأ المحادثة
          </button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-slate-400 border-t border-slate-800">
        <p className="text-sm">
          تطوير{' '}
          <a 
            href={CREATOR_LINK} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sky-400 hover:text-sky-300 transition-colors"
          >
            {CREATOR_NAME}
          </a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;