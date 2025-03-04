export const copy = {
  hero: {
    pill: {
      label: "⚡️ Launching Soon",
      text: "v1.0.0",
      link: "http://localhost:3000/blog/0-1-0-announcement",
    },
    title: "An AI powered Interface in one line of code.",
    subtitle: "A React package for adding intelligence into your app.",
    cta: {
      buttonText: "Request Early Access",
    },
  },
  features: {
    title: "Features",
    heading: "AI Tools for Every Use Case",
    description:
      "A batteries included React package for adding intelligence into your app.",
    list: [
      {
        icon: "Brain",
        title: "Natural Language Interaction",
        description:
          "Empower users to interact with your app through natural conversations. AI handles understanding and context for seamless experiences.",
      },
      {
        icon: "Zap",
        title: "Fast Integration",
        description:
          "Add to your existing app in hours, not weeks. Tambo AI tools plug directly into your current stack without requiring AI expertise or infrastructure changes.",
      },
      {
        icon: "Puzzle",
        title: "Fits Into Your Workflow",
        description:
          "Connect seamlessly with your existing stack. Tambo AI works with your data sources, APIs, and infrastructure with no migrations required.",
      },
      {
        icon: "Palette",
        title: "Customizable Experiences",
        description:
          "Control the look, feel, and behavior of AI-powered features. Tailor everything to fit your brand and user needs.",
      },
      {
        icon: "Code",
        title: "Scalable and Reliable",
        description:
          "Enterprise-grade tools designed to handle scale, edge cases, and high load out of the box.",
      },
      {
        icon: "Sparkles",
        title: "Continuously Adapting",
        description:
          "tambo AI evolves with your users, learning from behavior to improve interactions over time automatically.",
      },
    ],
  },
  analytics: {
    title: "Integrate Conversational Analytics in to your app",
    description:
      "tambo AI provides a simple, powerful way to integrate conversational analytics into your app.",
    features: [
      {
        title: "Seamless Data Integration",
        description:
          "Connect effortlessly to your existing data sources and visualization tools.",
        icon: "MessageSquareText",
      },
      {
        title: "Plain Language Insights",
        description:
          "Users ask questions in everyday language and receive clear, actionable answers instantly.",
        icon: "GraduationCap",
      },
      {
        title: "Complete Control",
        description:
          "Customize every aspect of the user interaction, from UI to AI response tuning.",
        icon: "LineChart",
      },
    ],
    cta: {
      buttonText: "Try Demo",
      link: "https://canvas.tambo.co",
    },
    demo: {
      videoSrc: "/videos/canvas-demo.mp4",
    },
  },
  controlBar: {
    title: "Simplify User Journeys with AI",
    description:
      "Enhance your existing app's navigation. tambo AI's control bar drops in seamlessly to surface the right features at the right time.",
    features: [
      {
        title: "Context-Aware Guidance",
        description:
          "AI learns from user behavior to recommend the most relevant actions and features.",
        icon: "BrainCircuit",
      },
      {
        title: "Reduce Time-to-Value",
        description:
          "Users master your app in minutes, slashing onboarding and support times.",
        icon: "Hourglass",
      },
      {
        title: "Drive Engagement",
        description:
          "Guide users to discover and adopt features more effectively with personalized, AI-driven support.",
        icon: "TrendingUp",
      },
    ],
    cta: {
      buttonText: "Try Control Bar",
      link: "https://control-bar.tambo.co",
    },
    demo: {
      videoSrc: "/videos/control-bar-demo.mp4",
    },
  },
  community: {
    title: "Built With Your Stack in Mind",
    description:
      "Add AI features to your existing app without rebuilding your infrastructure.",
    features: [
      {
        title: "Keep Your Auth and Data",
        description:
          "Works with your existing JWT tokens and database connections. No parallel systems or data duplication needed.",
        icon: "BookOpen",
      },
      {
        title: "Test Before Production",
        description:
          "Debug AI interactions locally, see exactly how responses will work with your data, and tune behavior through configuration.",
        icon: "Smartphone",
      },
      {
        title: "Start Fast, Customize Later",
        description:
          "Begin with our React components for chat and analytics, then customize the UI and behavior as your needs grow.",
        icon: "Package",
      },
    ],
    cta: {
      text: "See Integration Guide",
      icon: "Book",
      link: "/docs",
    },
  },
} as const;

export type Copy = typeof copy;
