import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { HydraDb, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";

export class OAuthLocalProvider implements OAuthClientProvider {
  private _clientInformation: OAuthClientInformation | undefined;
  private _codeVerifier: string | undefined;
  private _tokens: OAuthTokens | undefined;
  private _redirectStartAuthUrl: URL | undefined;
  private _saveAuthUrl: URL | undefined;
  private _sessionId: string;
  private _serverUrl: string | undefined;
  constructor(
    private db: HydraDb,
    private projectId: string,
    {
      clientInformation,
      saveAuthUrl,
      sessionId,
      serverUrl,
    }: {
      saveAuthUrl?: string;
      clientInformation?: OAuthClientInformation;
      sessionId?: string;
      serverUrl?: string;
    } = {},
  ) {
    this._clientInformation = clientInformation;
    // we generate a session id, because we'll be asked to store the client information
    this._sessionId = sessionId ?? crypto.randomUUID();

    this._saveAuthUrl = saveAuthUrl
      ? new URL(
          `/oauth/callback?projectId=${projectId}&sessionId=${this._sessionId}`,
          saveAuthUrl,
        )
      : undefined;
    this._serverUrl = serverUrl;
  }

  get redirectUrl(): string {
    console.log("--> redirectUrl", this._saveAuthUrl?.toString());
    return this._saveAuthUrl?.toString() ?? "";
  }

  // is this the same as the redirectUrl?
  get redirectStartAuthUrl(): URL | undefined {
    console.log("--> redirectStartAuthUrl");
    // something like https://mcp.linear.app/authorize?response_type=code&client_id=Um5UdcYtE52B1yUl&code_challenge=NBIRHJ5AoIwEnfgNLGxPEBzCVjdmguoG8lUNfahPVwM&code_challenge_method=S256&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdashboard%2Fp_TJLbISzk.a45164
    return this._redirectStartAuthUrl;
  }

  clientInformation():
    | OAuthClientInformation
    | undefined
    | Promise<OAuthClientInformation | undefined> {
    console.log("--> clientInformation", this._clientInformation);
    return this._clientInformation;
  }
  async saveClientInformation(
    clientInformation: OAuthClientInformationFull,
  ): Promise<void> {
    console.log("--> saveClientInformation", clientInformation);

    if (!this._serverUrl) {
      throw new Error("Cannot save client information without server URL");
    }
    const [client] = await this.db
      .insert(schema.mcpOauthClients)
      .values({
        projectId: this.projectId,
        sessionInfo: {
          serverUrl: this._serverUrl,
          clientInformation,
        },
        sessionId: this._sessionId,
      })
      .returning();
    this._clientInformation = clientInformation;
    console.log("--> saveClientInformation stored", client);
  }
  async codeVerifier(): Promise<string> {
    console.log("--> codeVerifier", this._codeVerifier);
    if (!this._codeVerifier) {
      console.log("--> codeVerifier: fetching from db");
      const session = await this.db.query.mcpOauthClients.findFirst({
        where: eq(schema.mcpOauthClients.sessionId, this._sessionId),
      });
      if (!session || !session.codeVerifier) {
        throw new Error(
          `Code verifier not set: ${!session ? "session not found" : "codeVerifier is null"}`,
        );
      }
      this._codeVerifier = session.codeVerifier;
    }
    return this._codeVerifier;
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    console.log("--> saveCodeVerifier", codeVerifier);
    this._codeVerifier = codeVerifier;
    const updatedRows = await this.db
      .update(schema.mcpOauthClients)
      .set({
        codeVerifier,
      })
      .where(eq(schema.mcpOauthClients.sessionId, this._sessionId))
      .returning();
    console.log("--> saveCodeVerifier stored", updatedRows);
  }
  get clientMetadata(): OAuthClientMetadata {
    const clientMetadata = {
      redirect_uris: [this.redirectUrl],
      client_name: "Tambo",
    };

    console.log("--> clientMetadata", clientMetadata);
    return clientMetadata;
  }

  redirectToAuthorization(authorizationUrl: URL): void | Promise<void> {
    console.log("--> redirectToAuthorization", authorizationUrl.toString());
    // save this so it can be used later
    this._redirectStartAuthUrl = authorizationUrl;
  }

  tokens(): OAuthTokens | undefined | Promise<OAuthTokens | undefined> {
    console.log("--> tokens", this._tokens);
    return this._tokens;
  }

  saveTokens(tokens: OAuthTokens): void | Promise<void> {
    console.log("--> saveTokens", tokens);
    this._tokens = tokens;
  }
}
