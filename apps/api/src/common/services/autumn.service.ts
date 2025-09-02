import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Autumn } from "autumn-js";

@Injectable()
export class AutumnService {
  private autumn?: Autumn;
  private readonly logger = new Logger(AutumnService.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("AUTUMN_SECRET_KEY");
    this.enabled = !!apiKey;

    if (this.enabled && apiKey) {
      this.autumn = new Autumn({ secretKey: apiKey });
      this.logger.log("Autumn service initialized");
    } else {
      this.logger.warn(
        "Autumn service disabled - AUTUMN_SECRET_KEY not configured",
      );
    }
  }

  /**
   * Check if a user has access to send messages
   * @param userId The user ID to check
   * @returns Whether the user is allowed to send messages
   */
  async checkMessageAccess(userId: string): Promise<{
    allowed: boolean;
    balance?: number;
    usage?: number;
    limit?: number;
  }> {
    if (!this.enabled) {
      // If Autumn is not configured, allow all messages
      return { allowed: true };
    }

    try {
      const response = await this.autumn!.check({
        customer_id: userId,
        feature_id: "messages",
      });

      // Get customer details for balance info
      const customer = await this.autumn!.customers.get(userId);
      const messageFeature = customer.data?.features.messages;

      return {
        allowed: response.data?.allowed ?? false,
        balance: messageFeature?.balance ?? undefined,
        usage: messageFeature?.usage,
        limit: messageFeature?.included_usage,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check message access for user ${userId}:`,
        error,
      );
      // On error, default to allowing the message to avoid blocking users
      return { allowed: true };
    }
  }

  /**
   * Track message usage for a user
   * @param userId The user ID
   * @param count Number of messages to track (default 1)
   */
  async trackMessageUsage(userId: string, count: number = 1): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }

    try {
      await this.autumn!.track({
        customer_id: userId,
        feature_id: "messages",
        value: count,
      });
      this.logger.debug(`Tracked ${count} message(s) for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to track message usage for user ${userId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Currently not used, but could be useful in the future.
   * Get customer subscription and usage data
   * @param userId The user ID
   */
  async getCustomerData(userId: string) {
    if (!this.enabled) {
      return null;
    }

    try {
      const result = await this.autumn!.customers.get(userId);
      return result.data;
    } catch (error) {
      this.logger.error(
        `Failed to get customer data for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Currently not used, but could be useful in the future.
   * Check if a user has a specific product (e.g., "pro" plan)
   * @param userId The user ID
   * @param productId The product ID to check
   */
  async hasProduct(userId: string, productId: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const customerResult = await this.autumn!.customers.get(userId);
      if ("products" in customerResult) {
        const customer = customerResult;
        return (
          customer.data?.products.some(
            (p) => p.id === productId && p.status === "active",
          ) ?? false
        );
      }
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to check product access for user ${userId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if Autumn service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
