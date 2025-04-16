"use client";

import { Section } from "@/components/section";
import { highContrastLightTheme } from "@/lib/syntax-theme";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import {
  Code,
  FileCode,
  FileJson,
  MonitorIcon,
  PackageIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { InteractiveDemo } from "./interactive-demo";

const ease = [0.16, 1, 0.3, 1];

type TabKey = "demo" | "provider" | "props" | "component" | "register";

// File information for each code example
const fileInfo: Record<
  TabKey,
  { filename: string; icon: React.ReactNode; description: string }
> = {
  demo: {
    filename: "localhost:3000",
    icon: <MonitorIcon className="w-4 h-4" />,
    description: "Live demo component showing the Tambo chat interface",
  },
  provider: {
    filename: "App.tsx",
    icon: <Code className="w-4 h-4" />,
    description: "Root component with TamboProvider setup",
  },
  props: {
    filename: "EmailProps.ts",
    icon: <FileJson className="w-4 h-4" />,
    description: "Zod schema for type-safe prop validation",
  },
  component: {
    filename: "EmailForm.tsx",
    icon: <FileCode className="w-4 h-4" />,
    description: "Custom component with Tambo state hooks",
  },
  register: {
    filename: "TamboConfig.ts",
    icon: <PackageIcon className="w-4 h-4" />,
    description: "Configuration to register custom components",
  },
};

// Highlighted lines for each code example
const highlightedLines: Record<Exclude<TabKey, "demo">, number[]> = {
  provider: [6, 8, 12, 13, 14],
  props: [],
  component: [2, 7, 8, 9],
  register: [9, 10],
};

// Code examples for different tabs
const codeExamples: Record<Exclude<TabKey, "demo">, string> = {
  provider: `// First we wrap our app in a TamboProvider
// Second we import the MessageThread
// The MessageThreadFull is the main component that will render the chat interface
// Add the component using the tambo cli \`npx tambo add message-thread-full\`

import { TamboProvider } from "@tambo-ai/react";
import { MessageThreadFull } from "@components/ui/message-thread";
import { tamboComponents } from "./TamboConfig";

export default function Chat() {
  return (
    <TamboProvider
      components={tamboComponents}
    >
      <MessageThreadFull />
    </TamboProvider>
  );
}`,

  props: `// Now we define the props for the component
// We use zod to validate the props

import { z } from "zod";

export const EmailProps = z.object({
  subject: z.string().optional(),
  message: z.string(),
});

// We can now export the props for our component
export type EmailProps = z.infer<typeof EmailProps>;
`,

  component: `// Create a component like normal but with tambo-ai for state management
import { useTamboState } from "@tambo-ai/react";
import { EmailProps } from "./EmailProps"; // from file before

export function EmailForm(EmailProps: EmailProps) {
  // Use Tambo state hooks to pass the values to the AI
  const [emailSubject, setEmailSubject] = useTamboState("emailSubject", subject);
  const [emailMessage, setEmailMessage] = useTamboState("emailMessage", message);
  const [status, setStatus] = useTamboState("emailStatus", "pending");

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={emailSubject}
        onChange={(e) => setEmailSubject(e.target.value)}
        placeholder="Subject"
      />
      <textarea
        value={emailMessage}
        onChange={(e) => setEmailMessage(e.target.value)}
        placeholder="Your message"
      />
      <button type="submit">
        {status === "sent" ? "Sent!" : "Send Email"}
      </button>
    </form>
  );
}`,

  register: ` // Now let's add the component to our registry!
import { EmailForm } from "./EmailForm";
import { EmailProps } from "./EmailProps";

export const tamboComponents = [
  {
    name: "EmailForm",
    description: "A form to email the team",
    component: EmailForm, // your email component
    propsSchema: EmailProps, // the zod schema for the props,
  },
];`,
};

export function CodeExamples() {
  const [activeTab, setActiveTab] = useState<TabKey>("demo");
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Create a ref to store the InteractiveDemo component instance
  // This ensures the component state persists between tab changes
  const demoRef = useRef<HTMLDivElement>(null);

  // Keep demo visible in DOM even when other tabs are selected
  // This preserves its state when switching tabs
  const [demoMounted, setDemoMounted] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (!sectionRef.current) return;

      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;

      const rect = sectionRef.current.getBoundingClientRect();

      // Check if section is entering viewport from below while scrolling down
      if (
        isScrollingDown &&
        rect.top < window.innerHeight * 0.6 &&
        rect.top > 0
      ) {
        // Clear any existing timeout
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }

        // Highlight the section
        setIsHighlighted(true);

        // Snap to section with slight offset
        window.scrollTo({
          top: sectionRef.current.offsetTop - 60,
          behavior: "smooth",
        });

        // Prevent immediate scroll after snapping
        scrollTimeout = setTimeout(() => {
          scrollTimeout = null;
        }, 800);
      } else if (rect.bottom < 0 || rect.top > window.innerHeight) {
        // Reset highlight when out of view
        setIsHighlighted(false);
      }
    };

    // Throttled scroll handler
    let ticking = false;
    const throttledScroll = () => {
      if (scrollTimeout) return; // Skip if we're in timeout period

      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll);

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", throttledScroll);
    };
  }, []);

  // Set a flag when switching tabs to preserve demo state
  const handleTabChange = (tab: TabKey) => {
    // Always keep demo mounted in the DOM to preserve state
    setActiveTab(tab);
  };

  return (
    <Section
      id="code-examples"
      className="py-4 sm:py-6 md:py-8 lg:py-10 scroll-mt-16"
    >
      <div
        ref={sectionRef}
        className={`w-full space-y-4 ${isHighlighted ? "section-highlight" : ""}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="w-full max-w-[95vw] md:max-w-[90vw] h-[90vh] md:h-[85vh] mx-auto"
        >
          <div className="rounded-lg overflow-hidden border shadow-md bg-background h-full">
            {/* Code editor header with terminal-style tabs */}
            <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex items-center">
              {/* Window Controls */}
              <div className="flex items-center space-x-2 mr-6">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>

              {/* Terminal-style Tabs */}
              <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden">
                {Object.entries(fileInfo).map(([key, { filename, icon }]) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key as TabKey)}
                    className={clsx(
                      "px-4 py-1.5 text-[15px] font-medium transition-colors border-x border-t rounded-t-lg -mb-px flex items-center space-x-1.5",
                      activeTab === key
                        ? "bg-white text-gray-900 border-gray-200"
                        : "text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-200/50",
                    )}
                  >
                    {icon}
                    <span className="ml-1">{filename}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content area - adjust height calculation */}
            <div className="relative h-[calc(100%-2.75rem)] pb-2">
              {/* Always keep demo in DOM but hide it when not active */}
              <div
                ref={demoRef}
                className={`h-full overflow-hidden p-4 ${activeTab === "demo" ? "block" : "hidden"}`}
              >
                <InteractiveDemo />
              </div>

              {activeTab !== "demo" && (
                <SyntaxHighlighter
                  language="tsx"
                  style={highContrastLightTheme}
                  showLineNumbers
                  wrapLines={true}
                  lineProps={(lineNumber) => {
                    const style: React.CSSProperties = { display: "block" };
                    if (highlightedLines[activeTab].includes(lineNumber)) {
                      style.backgroundColor = "rgba(0, 150, 255, 0.15)";
                      style.borderLeft = "3px solid rgb(0, 120, 255)";
                    }
                    return { style };
                  }}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.9rem",
                    boxShadow: "none",
                    height: "100%",
                    overflow: "auto",
                  }}
                >
                  {codeExamples[activeTab]}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
