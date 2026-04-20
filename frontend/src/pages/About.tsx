import { motion } from "framer-motion";
import { Brain, Sparkles, Film, Box, Zap, Globe } from "lucide-react";
import { IMAGES } from "@/assets/images";

export default function About() {
  const features = [
    {
      icon: Brain,
      title: "Human Consciousness",
      description: "Exploring the depths of human memory, emotion, and creative thought processes through cinematic storytelling."
    },
    {
      icon: Sparkles,
      title: "AI Intelligence",
      description: "Leveraging artificial intelligence to analyze, enhance, and reimagine the boundaries of creative expression."
    },
    {
      icon: Film,
      title: "Cinematic Vision",
      description: "Crafting immersive film experiences that bridge the gap between human narrative and machine logic."
    },
    {
      icon: Box,
      title: "3D Asset Creation",
      description: "Building interactive 3D worlds and assets that bring abstract concepts to tangible digital reality."
    },
    {
      icon: Zap,
      title: "Interactive Experience",
      description: "Creating dynamic, responsive interfaces that adapt to user interaction and emotional context."
    },
    {
      icon: Globe,
      title: "Future Vision",
      description: "Pioneering the next generation of multimedia experiences where technology serves human creativity."
    }
  ];

  const team = [
    {
      role: "Creative Director",
      description: "Visionary behind the project's artistic direction and narrative structure."
    },
    {
      role: "AI Researcher",
      description: "Developing intelligent systems that understand and enhance creative workflows."
    },
    {
      role: "3D Artist",
      description: "Crafting immersive digital environments and interactive asset experiences."
    },
    {
      role: "Film Producer",
      description: "Bringing cinematic stories to life through cutting-edge production techniques."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 z-0 opacity-20">
        <img
          src={IMAGES.ABOUT_BG_1}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background z-0" />

      <div className="relative z-10">
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto text-center mb-20"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Human Mind & AI Logic
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              A groundbreaking graduation project exploring the intersection of human consciousness and artificial intelligence through cinematic storytelling and interactive 3D experiences.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl mx-auto mb-32"
          >
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_-6px_rgba(0,217,255,0.15)]">
              <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-primary">
                Our Vision
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                In an era where artificial intelligence is reshaping creative industries, we ask a fundamental question: How can machines understand and enhance human creativity without losing the essence of what makes us human?
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                This project bridges the gap between human intuition and machine precision, creating a multimedia platform where films and 3D assets serve as the canvas for exploring consciousness, memory, and the future of creative expression.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Through cinematic narratives and interactive digital experiences, we demonstrate how AI can amplify human creativity rather than replace it, opening new dimensions of artistic possibility.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-32"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Core Pillars
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-2xl p-8 shadow-[0_4px_12px_rgba(0,217,255,0.1)] hover:shadow-[0_8px_24px_rgba(0,217,255,0.2)] transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-32"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              The Team
            </h2>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-[0_4px_12px_rgba(168,85,247,0.1)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.2)] transition-all duration-300"
                >
                  <h3 className="text-2xl font-semibold mb-3 text-accent">
                    {member.role}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {member.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 backdrop-blur-xl border border-primary/30 rounded-3xl p-12 shadow-[0_8px_30px_-6px_rgba(0,217,255,0.2)]">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
                Join the Journey
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                This project represents more than a graduation milestone—it's a vision for the future of creative technology. Explore our films, interact with our 3D assets, and experience the fusion of human imagination and artificial intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="#/films"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-[0_4px_12px_rgba(0,217,255,0.35),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,217,255,0.45)] transition-all duration-200"
                >
                  Explore Films
                </motion.a>
                <motion.a
                  href="#/assets"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-accent text-accent-foreground rounded-xl font-semibold shadow-[0_4px_12px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.45)] transition-all duration-200"
                >
                  Browse Assets
                </motion.a>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}