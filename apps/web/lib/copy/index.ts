export const copy = {
  hero: {
    pill: {
      label: "⚡️ Beta",
      text: "Canvas UI",
      link: "https://canvas.usehydra.ai/",
    },
    title: "Ship AI Features in Hours, Not Months",
    subtitle:
      "Powerful AI capabilities, zero complexity. Build smarter apps without managing infrastructure.",
    cta: {
      buttonText: "Request Early Access",
    },
  },
  features: {
    title: "Features",
    heading: "AI Tools for Every Use Case",
    description:
      "Hydra AI provides tools to transform your app with AI-powered capabilities. Deliver smarter, more intuitive experiences faster than ever before.",
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
          "Get started in hours, not weeks. Hydra AI tools integrate quickly without requiring AI expertise or significant infrastructure changes.",
      },
      {
        icon: "Puzzle",
        title: "Fits Into Your Workflow",
        description:
          "Connect seamlessly with your existing stack. Hydra AI works with your data sources, APIs, and infrastructure with no migrations required.",
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
          "Hydra AI evolves with your users, learning from behavior to improve interactions over time automatically.",
      },
    ],
  },
  analytics: {
    title: "Conversational Analytics Made Simple",
    description:
      "Let users explore data effortlessly with natural language. Hydra AI translates their questions into insights without the need for complex dashboards.",
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
      link: "https://canvas.usehydra.ai",
    },
    demo: {
      videoSrc: "/videos/canvas-demo.mp4",
    },
  },
  controlBar: {
    title: "Simplify User Journeys with AI",
    description:
      "Make your app easier to navigate. Hydra AI's control bar predicts user needs and surfaces the right features at the right time.",
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
      link: "https://control-bar.usehydra.ai",
    },
    demo: {
      videoSrc: "/videos/control-bar-demo.mp4",
    },
  },
  community: {
    title: "Built for Developers, Loved by Teams",
    description:
      "Modern tools, clear documentation, and robust APIs designed to help you build smarter apps faster.",
    features: [
      {
        title: "Comprehensive Documentation",
        description:
          "Step-by-step guides and examples to get you from setup to production quickly.",
        icon: "BookOpen",
      },
      {
        title: "Cross-Platform Compatibility",
        description:
          "Works seamlessly with React, React Native, Next.js, and other modern frameworks.",
        icon: "Smartphone",
      },
      {
        title: "Plug and Play",
        description:
          "Drop Hydra AI into your existing workflow with minimal disruption.",
        icon: "Package",
      },
    ],
    cta: {
      text: "Explore the Docs",
      icon: "Book",
      link: "/docs",
    },
  },
} as const;

export type Copy = typeof copy;
