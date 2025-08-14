"use client";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Easing, motion } from "framer-motion";
import { Check, ExternalLink, Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC } from "react";

// Animation configuration
const ease: Easing = [0.16, 1, 0.3, 1];

interface PricingFeature {
  text: string;
  link: string;
}

interface PricingTier {
  name: string;
  subtitle: string;
  price: string;
  priceSubtext?: string;
  features: (string | PricingFeature)[];
  cta: string;
  popular: boolean;
  isOpenSource: boolean;
  isEnterprise?: boolean;
  isSimplified?: boolean;
}

// Define pricing data directly in the component
const pricingData: PricingTier[] = [
  {
    name: "Starter",
    subtitle: "Perfect for getting started",
    price: "Free",
    features: [
      "10k messages / mo (hard cap)",
      "Unlimited users (OAuth)",
      "Chat-thread history",
      "Analytics + observability",
      "Community support",
    ],
    cta: "Signup",
    popular: false,
    isOpenSource: false,
  },
  {
    name: "Growth",
    subtitle: "For growing teams and projects",
    price: "$25",
    priceSubtext: "/mo",
    features: [
      "200k messages / mo included",
      "$8 per +100k (billed in 100k blocks)",
      "Unlimited users",
      "Chat-thread history",
      "Analytics + observability",
      "Email support",
    ],
    cta: "Signup",
    popular: true,
    isOpenSource: false,
  },
  {
    name: "Enterprise",
    subtitle: "For large organizations",
    price: "Annual Contract",
    features: [
      "Negotiated message volume",
      "Unlimited Seats for Cloud",
      "Enterprise Only Features",
      "SSO / SAML, SCIM, RBAC",
      "Single-tenant or on-prem",
      "99.99% uptime SLA",
      "SOC 2, HIPAA opt-in, GDPR (upon request)",
      "Early access to new features",
      "24×7 support",
    ],
    cta: "Contact Us",
    popular: false,
    isOpenSource: false,
    isEnterprise: true,
  },
  {
    name: "Open Source",
    subtitle: "Self-host for Free. Forever.",
    price: "Free",
    features: [
      "tambo-ai/react package",
      "ui component library",
      {
        text: "tambo-ai/tambo-cloud",
        link: "https://github.com/tambo-ai/tambo-cloud",
      },
    ],
    cta: "GitHub",
    popular: false,
    isOpenSource: true,
    isSimplified: true,
  },
];

// Component to render feature items with optional links
const FeatureItem: FC<{ feature: string | PricingFeature }> = ({ feature }) => {
  const isObject = typeof feature === "object";
  const featureText = isObject ? feature.text : feature;
  const hasComingSoon = featureText.includes(" (coming soon)");
  const displayText = hasComingSoon
    ? featureText.replace(" (coming soon)", "")
    : featureText;
  const link = isObject ? feature.link : null;

  if (link) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline hover:text-muted-foreground transition-colors duration-200 flex items-center gap-1"
        >
          {displayText}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium">{displayText}</span>
      {hasComingSoon && (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 text-xs px-2 py-1"
        >
          Coming Soon
        </Badge>
      )}
    </div>
  );
};

function PricingTier({
  tier,
  className,
  index = 0,
}: {
  tier: PricingTier;
  className?: string;
  index?: number;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (tier.isOpenSource) {
      window.open(
        "https://github.com/tambo-ai/tambo",
        "_blank",
        "noopener,noreferrer",
      );
    } else if (tier.isEnterprise) {
      window.open(
        "https://cal.com/michaelmagan/chat?duration=30",
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <motion.div
      className={cn(
        "relative h-full w-full rounded-lg",
        tier.popular
          ? "p-[2px] bg-gradient-to-r from-primary via-green-200 to-primary animate-border-wave"
          : "border border-border",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.1 * index, ease }}
    >
      <div
        className={cn(
          "outline-focus transition-transform-background relative z-10 box-border grid h-full w-full overflow-hidden text-foreground motion-reduce:transition-none rounded-lg bg-white",
          tier.popular ? "shadow-lg" : "",
        )}
      >
        <div className="flex flex-col h-full">
          {!tier.isSimplified && (
            <CardHeader className="border-b p-6 h-fit">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">
                  {tier.name}
                </span>
                {tier.popular && (
                  <Badge
                    variant="secondary"
                    className="bg-primary text-primary-foreground hover:bg-secondary-foreground"
                  >
                    Most Popular
                  </Badge>
                )}
              </CardTitle>
              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.priceSubtext && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {tier.priceSubtext}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">
                  {tier.subtitle}
                </div>
              </div>
            </CardHeader>
          )}

          {tier.isSimplified ? (
            <div className="flex-grow p-6 pt-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-shrink-0 space-y-2">
                  <div className="text-lg font-semibold">{tier.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {tier.subtitle}
                  </div>
                </div>
                <div className="flex-shrink-0 sm:self-center">
                  <Button
                    size="lg"
                    onClick={handleClick}
                    className="bg-muted text-foreground hover:bg-muted/80 w-full sm:w-auto"
                  >
                    <Github className="mr-2 size-4" />
                    {tier.cta}
                  </Button>
                </div>
              </div>

              {tier.features.length > 0 && (
                <div className="border-t pt-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="mr-3 size-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <FeatureItem feature={feature} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <CardContent className="flex-grow p-6 pt-5">
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="mr-3 size-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <FeatureItem feature={feature} />
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className="p-6 pt-0">
                <Button
                  size="lg"
                  onClick={handleClick}
                  className={cn(
                    "w-full",
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-muted/80",
                  )}
                >
                  {tier.cta}
                </Button>
              </div>
            </>
          )}
          {(tier as any).ctaSubtext && (
            <p className="text-xs text-muted-foreground text-center pb-2">
              {(tier as any).ctaSubtext}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const paidTiers = pricingData.filter((tier) => !tier.isOpenSource);
  const openSourceTiers = pricingData.filter((tier) => tier.isOpenSource);

  return (
    <Section id="pricing" className="scroll-mt-[var(--header-height)]">
      <div className="space-y-12">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-balance px-4">
            Simple pricing from hobbyists to enterprise
          </h2>
        </motion.div>

        {/* First row: 3 paid tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {paidTiers.map((tier, index) => (
            <PricingTier
              key={index}
              tier={tier}
              className="h-full"
              index={index}
            />
          ))}
        </div>

        {/* Second row: Open source tier */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
          <div className="md:col-start-2 lg:col-start-2">
            {openSourceTiers.map((tier, index) => (
              <PricingTier
                key={index}
                tier={tier}
                className="h-full"
                index={3}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
