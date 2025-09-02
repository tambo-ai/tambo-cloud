/**
 * Pricing Table Component
 * This component comes from Autumn directly, and is modified to fit our needs
 * DO NOT CHANGE IF NOT NECESSARY
 */

"use client";

import CheckoutDialog from "@/components/dashboard-components/billing/checkout-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  PLAN_FEATURES,
  isFreePlan,
  isRecommendedPlan,
  type PlanFeature,
} from "@/lib/billing/constants";
import { getPricingTableContent } from "@/lib/billing/pricing-table-content";
import { cn } from "@/lib/utils";
import type { Product, ProductItem } from "autumn-js";
import { ProductDetails, useCustomer, usePricingTable } from "autumn-js/react";
import { Easing, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import React, { createContext, useContext, useState } from "react";

const ease: Easing = [0.16, 1, 0.3, 1];

/**
 * Pricing Table Context
 * Provides the context for the pricing table
 */

interface PricingTableContextValue {
  isAnnualToggle: boolean;
  setIsAnnualToggle: (isAnnual: boolean) => void;
  products: Product[];
  showFeatures: boolean;
}

const PricingTableContext = createContext<PricingTableContextValue>({
  isAnnualToggle: false,
  setIsAnnualToggle: () => {},
  products: [],
  showFeatures: true,
});

export const usePricingTableContext = (componentName: string) => {
  const context = useContext(PricingTableContext);
  if (context === undefined) {
    throw new Error(`${componentName} must be used within <PricingTable />`);
  }
  return context;
};

/**
 * Map plan features to ProductItems, using Autumn data when available
 */

function mapFeaturesToItems(
  features: PlanFeature[],
  productItems: ProductItem[],
  customer?: any,
): ProductItem[] {
  return features.map((feature) => {
    // Try to find matching item from Autumn data
    const autumnItem = productItems.find((item) => {
      const itemText = item.display?.primary_text?.toLocaleLowerCase() || "";
      const featureNameLower = feature.name.toLocaleLowerCase();

      // Match by various patterns
      return (
        itemText.includes(featureNameLower) ||
        itemText.includes(feature.key.replace(/_/g, " ")) ||
        (item as any).feature?.name === feature.key
      );
    });

    // Return either the Autumn item or create a synthetic one
    if (autumnItem) {
      return autumnItem;
    }

    // Create a synthetic item if not found in Autumn data
    return {
      type: "feature" as const,
      display: {
        primary_text: feature.name,
        secondary_text: feature.getDescription
          ? feature.getDescription(customer)
          : undefined,
      },
    } as ProductItem;
  });
}

/**
 * Filter products by billing interval
 */
function createIntervalFilter(isAnnual: boolean, multiInterval: boolean) {
  return (product: Product) => {
    if (!product.properties?.interval_group) {
      return true;
    }

    if (multiInterval) {
      if (isAnnual) {
        return product.properties?.interval_group === "year";
      } else {
        return product.properties?.interval_group === "month";
      }
    }

    return true;
  };
}

/**
 * Filter to only show Free and Growth tiers
 */
function tierFilter(product: Product): boolean {
  const name = (product.display?.name || product.name).toLocaleLowerCase();
  return (
    name.includes("free") || name.includes("growth") || name.includes("starter")
  );
}

/**
 * Main component for the pricing table
 */

export default function PricingTable({
  productDetails,
}: {
  productDetails?: ProductDetails[];
}) {
  const { checkout } = useCustomer();
  const [isAnnualToggle, setIsAnnualToggle] = useState(false);
  const { products, isLoading, error } = usePricingTable({ productDetails });

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Something went wrong...</div>;
  }

  const intervals = Array.from(
    new Set(
      products?.map((p) => p.properties?.interval_group).filter((i) => !!i),
    ),
  );

  const multiInterval = intervals.length > 1;
  const intervalFilter = createIntervalFilter(isAnnualToggle, multiInterval);

  return (
    <div className={cn("root")}>
      {products && (
        <PricingTableContainer
          products={products}
          isAnnualToggle={isAnnualToggle}
          setIsAnnualToggle={setIsAnnualToggle}
          multiInterval={multiInterval}
        >
          {products
            .filter(intervalFilter)
            .filter(tierFilter)
            .map((product, index) => (
              <PricingCard
                key={index}
                productId={product.id}
                index={index}
                buttonProps={{
                  disabled:
                    (product.scenario === "active" &&
                      !product.properties.updateable) ||
                    product.scenario === "scheduled",

                  onClick: async () => {
                    if (product.id) {
                      await checkout({
                        productId: product.id,
                        dialog: CheckoutDialog,
                        successUrl: `${window.location.origin}/dashboard/billing`,
                      });
                    } else if (product.display?.button_url) {
                      window.open(product.display?.button_url, "_blank");
                    }
                  },
                }}
              />
            ))}
        </PricingTableContainer>
      )}
    </div>
  );
}

/**
 * Container component for the pricing table
 */

export const PricingTableContainer = ({
  children,
  products,
  showFeatures = true,
  className,
  isAnnualToggle,
  setIsAnnualToggle,
  multiInterval,
}: {
  children?: React.ReactNode;
  products?: Product[];
  showFeatures?: boolean;
  className?: string;
  isAnnualToggle: boolean;
  setIsAnnualToggle: (isAnnual: boolean) => void;
  multiInterval: boolean;
}) => {
  if (!products) {
    throw new Error("products is required in <PricingTable />");
  }

  if (products.length === 0) {
    return <></>;
  }

  const hasRecommended = products?.some((p) => p.display?.recommend_text);

  return (
    <PricingTableContext.Provider
      value={{ isAnnualToggle, setIsAnnualToggle, products, showFeatures }}
    >
      <div
        className={cn("flex items-center flex-col", hasRecommended && "!py-10")}
      >
        {multiInterval && (
          <div
            className={cn(
              products.some((p) => p.display?.recommend_text) && "mb-8",
            )}
          >
            <AnnualSwitch
              isAnnualToggle={isAnnualToggle}
              setIsAnnualToggle={setIsAnnualToggle}
            />
          </div>
        )}
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch max-w-4xl mx-auto",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </PricingTableContext.Provider>
  );
};

/**
 * Pricing card component
 */

interface PricingCardProps {
  productId: string;
  showFeatures?: boolean;
  className?: string;
  index?: number;
  onButtonClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  buttonProps?: React.ComponentProps<"button">;
}

export const PricingCard = ({
  productId,
  className,
  index = 0,
  buttonProps,
}: PricingCardProps) => {
  const { products, showFeatures } = usePricingTableContext("PricingCard");

  const product = products.find((p) => p.id === productId);
  if (!product) {
    throw new Error(`Product with id ${productId} not found`);
  }

  const { name, display: productDisplay } = product;
  const { buttonText } = getPricingTableContent(product);

  const recommended = isRecommendedPlan(product);
  const isFree = isFreePlan(product);

  const mainPriceDisplay = product.properties?.is_free
    ? { primary_text: "Free" }
    : product.items[0]?.display;

  // Get the predefined features for this plan type
  const planFeatures = isFree ? PLAN_FEATURES.free : PLAN_FEATURES.growth;

  // Map features to items, using Autumn data when available
  const orderedFeatureItems = mapFeaturesToItems(planFeatures, product.items);

  return (
    <motion.div
      className={cn(
        "relative h-full w-full rounded-lg",
        recommended
          ? "p-[2px] bg-gradient-to-r from-green-200 via-green-400 to-green-200 animate-border-wave"
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
          recommended ? "shadow-lg" : "",
        )}
      >
        <div className="flex flex-col h-full">
          <PricingCardHeader
            name={productDisplay?.name || name}
            isRecommended={recommended}
            priceDisplay={mainPriceDisplay}
            description={productDisplay?.description}
          />

          {showFeatures && orderedFeatureItems.length > 0 && (
            <PricingCardFeatures items={orderedFeatureItems} />
          )}

          <div className="p-6 pt-0">
            <PricingCardButton recommended={recommended} {...buttonProps}>
              {productDisplay?.button_text || buttonText}
            </PricingCardButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Card sub-components
 */

interface PricingCardHeaderProps {
  name: string;
  isRecommended: boolean;
  priceDisplay?: {
    primary_text?: string;
    secondary_text?: string;
  };
  description?: string;
}

function PricingCardHeader({
  name,
  isRecommended,
  priceDisplay,
  description,
}: PricingCardHeaderProps) {
  return (
    <CardHeader className="border-b p-6 h-fit">
      <CardTitle className="flex items-center justify-between">
        <span className="text-lg font-semibold">{name}</span>
        {isRecommended && (
          <Badge
            variant="secondary"
            className="bg-primary hover:bg-secondary-foreground"
          >
            Most Popular
          </Badge>
        )}
      </CardTitle>
      <div className="pt-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary">
            {priceDisplay?.primary_text}
          </span>
          {priceDisplay?.secondary_text && (
            <span className="text-sm font-medium text-primary">
              {priceDisplay.secondary_text}
            </span>
          )}
        </div>
        {description && (
          <div className="mt-1 text-sm font-medium text-primary">
            {description}
          </div>
        )}
      </div>
    </CardHeader>
  );
}

function PricingCardFeatures({ items }: { items: ProductItem[] }) {
  return (
    <CardContent className="flex-grow p-6 pt-5">
      <ul className="space-y-3 text-primary">
        {items.map((item, featureIndex) => (
          <li key={featureIndex} className="flex items-start">
            <Check className="mr-3 size-4 text-green-500 mt-0.5 flex-shrink-0" />
            <PricingFeatureItem item={item} />
          </li>
        ))}
      </ul>
    </CardContent>
  );
}

/**
 * Pricing feature item
 */
const PricingFeatureItem: React.FC<{ item: ProductItem }> = ({ item }) => {
  const primaryText = item.display?.primary_text || "";
  const secondaryText = item.display?.secondary_text || "";
  const hasComingSoon = primaryText.includes(" (coming soon)");
  const displayText = hasComingSoon
    ? primaryText.replace(" (coming soon)", "")
    : primaryText;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-primary">{displayText}</span>
      {secondaryText && (
        <span className="text-sm text-primary">{secondaryText}</span>
      )}
      {hasComingSoon && (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 text-primary"
        >
          Coming Soon
        </Badge>
      )}
    </div>
  );
};

/**
 * Pricing card button
 */
export interface PricingCardButtonProps extends React.ComponentProps<"button"> {
  recommended?: boolean;
  buttonUrl?: string;
}

export const PricingCardButton = React.forwardRef<
  HTMLButtonElement,
  PricingCardButtonProps
>(({ recommended, children, className, onClick, ...props }, ref) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    try {
      await onClick?.(e);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className={cn(
        "w-full",
        recommended
          ? "bg-primary hover:bg-primary/90 text-primary-foreground"
          : "bg-muted hover:bg-muted/80 text-primary",
        className,
      )}
      size="lg"
      {...props}
      ref={ref}
      disabled={loading || props.disabled}
      onClick={handleClick}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
});
PricingCardButton.displayName = "PricingCardButton";

/**
 * Annual switch
 */
export const AnnualSwitch = ({
  isAnnualToggle,
  setIsAnnualToggle,
}: {
  isAnnualToggle: boolean;
  setIsAnnualToggle: (isAnnual: boolean) => void;
}) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm">Monthly</span>
      <Switch
        id="annual-billing"
        checked={isAnnualToggle}
        onCheckedChange={setIsAnnualToggle}
      />
      <span className="text-sm">Annual</span>
    </div>
  );
};
