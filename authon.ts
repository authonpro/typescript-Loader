/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Authon TypeScript SDK — Software Licensing & Authentication               ║
 * ║  Version: 1.0.0                                                            ║
 * ║  Dependencies: None (fetch API, Node 18+ or browser)                       ║
 * ║                                                                            ║
 * ║  Website: https://authon.pro                                               ║
 * ║  Docs:    https://authon.pro/docs                                          ║
 * ║  Discord: https://discord.gg/jMZCTKPsmE                                    ║
 * ║  Status:  https://authon.pro/status                                        ║
 * ║  Health:  https://api.authon.pro/health                                    ║
 * ║  GitHub:  https://github.com/authonpro                                     ║
 * ║                                                                            ║
 * ║  Usage:                                                                    ║
 * ║    import { Authon } from './authon';                                      ║
 * ║    const auth = new Authon('app-id', 'api-key');                           ║
 * ║    await auth.init();                                                      ║
 * ║    const session = await auth.login('user', 'pass');                       ║
 * ║    console.log(`Welcome ${session.username}!`);                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** SDK version string. */
export const AUTHON_VERSION = "1.0.0";

/** Default API endpoint URL. */
export const DEFAULT_API_URL = "https://api.authon.pro/v1";

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT = 15000;

/** Generic API response from Authon. */
export interface AuthonResponse<T = Record<string, unknown>> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Session data returned after successful authentication. */
export interface SessionData {
  /** Unique session token for subsequent API calls. */
  sessionToken: string;
  /** Authenticated username. */
  username: string;
  /** User's access level (0+). */
  level: number;
  /** Subscription plan name. */
  subscription: string;
  /** Subscription expiration date (ISO 8601). */
  expiresAt: string;
}

/** Application info from init(). */
export interface AppInfo {
  /** Application name. */
  name: string;
  /** Application version. */
  version: string;
  /** Whether HWID locking is enabled. */
  hwidLock: boolean;
  /** Whether hash checking is enabled. */
  hashCheck: boolean;
}

/** File entry from listFiles(). */
export interface FileInfo {
  /** Unique file identifier. */
  id: string;
  /** File name. */
  name: string;
  /** File size in bytes. */
  size: number;
  /** Minimum user level required. */
  minLevel: number;
}

/** Online users data. */
export interface OnlineData {
  /** Number of currently online users. */
  count: number;
  /** List of online usernames. */
  users: string[];
}

/** Application statistics. */
export interface StatsData {
  /** Total registered users. */
  totalUsers: number;
  /** Currently online users. */
  onlineUsers: number;
  /** Total license keys. */
  totalKeys: number;
  /** Current app version. */
  appVersion: string;
}

/** Blacklist check result. */
export interface BlacklistData {
  /** Whether the IP/HWID is blacklisted. */
  blacklisted: boolean;
  /** Reason for blacklisting. */
  reason: string | null;
}

/** Referral redemption result. */
export interface ReferralData {
  /** New subscription expiration date. */
  expiresAt: string;
  /** Number of bonus days awarded. */
  rewardDays: number;
}

/** Configuration options for the Authon client. */
export interface AuthonConfig {
  /** Your Application ID from the Authon dashboard. */
  appId: string;
  /** Your API Key from the Authon dashboard. */
  apiKey: string;
  /** Custom API URL (default: https://api.authon.pro/v1). */
  apiUrl?: string;
  /** Request timeout in milliseconds (default: 15000). */
  timeout?: number;
}

/** Custom error class for Authon SDK errors. */
export class AuthonError extends Error {
  /** Error code from the API, if available. */
  public readonly code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = "AuthonError";
    this.code = code;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main Authon SDK client.
 *
 * Provides full authentication, licensing, variable storage,
 * file management, and activity logging capabilities.
 *
 * @example
 * ```typescript
 * const auth = new Authon('your-app-id', 'your-api-key');
 * await auth.init();
 *
 * const session = await auth.login('username', 'password');
 * console.log(`Welcome ${session.username}! Level: ${session.level}`);
 *
 * const files = await auth.listFiles();
 * console.log(`Available files: ${files.length}`);
 * ```
 */
export class Authon {
  private readonly appId: string;
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly timeout: number;

  // Session state
  /** Current session token. Null if not authenticated. */
  public sessionToken: string | null = null;
  /** Authenticated username. */
  public username: string | null = null;
  /** User's access level (0+). */
  public level: number = 0;
  /** Subscription plan name. */
  public subscription: string | null = null;
  /** Subscription expiration date. */
  public expiresAt: string | null = null;

  // App info
  /** Application name (set after init). */
  public appName: string | null = null;
  /** Application version (set after init). */
  public appVersion: string | null = null;
  /** Whether HWID lock is enabled. */
  public hwidLock: boolean = false;
  /** Whether hash check is enabled. */
  public hashCheck: boolean = false;
  /** Whether init() was called successfully. */
  public initialized: boolean = false;

  /**
   * Creates a new Authon client.
   *
   * @param appId - Your Application ID from the Authon dashboard.
   * @param apiKey - Your API Key from the Authon dashboard.
   * @param apiUrl - Custom API URL (default: https://api.authon.pro/v1).
   * @param timeout - Request timeout in ms (default: 15000).
   */
  constructor(appId: string, apiKey: string, apiUrl?: string, timeout?: number);
  constructor(config: AuthonConfig);
  constructor(
    appIdOrConfig: string | AuthonConfig,
    apiKey?: string,
    apiUrl?: string,
    timeout?: number
  ) {
    if (typeof appIdOrConfig === "object") {
      this.appId = appIdOrConfig.appId;
      this.apiKey = appIdOrConfig.apiKey;
      this.apiUrl = (appIdOrConfig.apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");
      this.timeout = appIdOrConfig.timeout || DEFAULT_TIMEOUT;
    } else {
      this.appId = appIdOrConfig;
      this.apiKey = apiKey!;
      this.apiUrl = (apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");
      this.timeout = timeout || DEFAULT_TIMEOUT;
    }

    if (!this.appId || !this.apiKey) {
      throw new AuthonError("appId and apiKey are required");
    }
  }

  /** Returns true if the client has an active session. */
  get isAuthenticated(): boolean {
    return this.sessionToken !== null && this.sessionToken.length > 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HWID GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generates a hardware ID for the current machine.
   *
   * In Node.js: Uses hostname + platform + arch + cpus.
   * In browser: Uses navigator.userAgent + screen dimensions + timezone.
   *
   * @returns 32-character hex string.
   */
  static async getHWID(): Promise<string> {
    let raw = "";

    if (typeof window === "undefined") {
      // Node.js environment
      try {
        const os = await import("os");
        const crypto = await import("crypto");
        raw = os.hostname() + os.platform() + os.arch();

        // Add CPU info for uniqueness
        const cpus = os.cpus();
        if (cpus.length > 0) {
          raw += cpus[0].model;
        }

        const hash = crypto.createHash("md5").update(raw).digest("hex");
        return hash;
      } catch {
        raw = "node-fallback-" + Date.now();
      }
    } else {
      // Browser environment
      raw =
        navigator.userAgent +
        screen.width +
        screen.height +
        screen.colorDepth +
        new Date().getTimezoneOffset();
    }

    // Simple MD5-like hash for browser (not cryptographic)
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return (hex + hex + hex + hex).substring(0, 32);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL HTTP
  // ═══════════════════════════════════════════════════════════════════════════

  private async request<T = Record<string, unknown>>(
    payload: Record<string, unknown>
  ): Promise<AuthonResponse<T>> {
    const body = {
      ...payload,
      appId: this.appId,
      apiKey: this.apiKey,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `Authon-TypeScript-SDK/${AUTHON_VERSION}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("octet-stream")) {
        const buffer = await response.arrayBuffer();
        return { success: true, data: { binary: buffer } as unknown as T };
      }

      return (await response.json()) as AuthonResponse<T>;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, message: "Request timed out" };
      }
      return {
        success: false,
        message: "Connection failed. Check https://authon.pro/status",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initializes the connection to the Authon API.
   * Must be called before any other API method.
   *
   * @returns AppInfo with application details.
   * @throws AuthonError if initialization fails.
   */
  async init(): Promise<AppInfo> {
    const response = await this.request<AppInfo>({ type: "init" });

    if (!response.success) {
      throw new AuthonError(response.message || "Init failed");
    }

    const data = response.data!;
    this.appName = data.name;
    this.appVersion = data.version;
    this.hwidLock = data.hwidLock;
    this.hashCheck = data.hashCheck;
    this.initialized = true;

    return data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Authenticates with username and password.
   *
   * @param username - User's username.
   * @param password - User's password.
   * @param hwid - Hardware ID (auto-generated if not provided).
   * @returns SessionData with user info.
   * @throws AuthonError on failure.
   *
   * Possible errors: "Invalid credentials", "Account banned",
   * "Hardware ID mismatch", "Subscription expired", "Account is frozen",
   * "VPN/Proxy connections are not allowed"
   */
  async login(username: string, password: string, hwid?: string): Promise<SessionData> {
    if (!username || !password) {
      throw new AuthonError("Username and password are required");
    }

    const response = await this.request<SessionData>({
      type: "login",
      username,
      password,
      hwid: hwid || (await Authon.getHWID()),
    });

    if (!response.success) {
      throw new AuthonError(response.message || "Login failed");
    }

    const data = response.data!;
    this.extractSession(data);
    return data;
  }

  /**
   * Authenticates using a license key only.
   *
   * @param licenseKey - The license key to validate/activate.
   * @param hwid - Hardware ID (auto-generated if not provided).
   * @returns SessionData.
   * @throws AuthonError on failure.
   */
  async license(licenseKey: string, hwid?: string): Promise<SessionData> {
    if (!licenseKey) {
      throw new AuthonError("License key is required");
    }

    const response = await this.request<SessionData>({
      type: "license",
      licenseKey,
      hwid: hwid || (await Authon.getHWID()),
    });

    if (!response.success) {
      throw new AuthonError(response.message || "License auth failed");
    }

    const data = response.data!;
    this.extractSession(data);
    return data;
  }

  /**
   * Registers a new user account with a license key.
   *
   * @param username - Desired username.
   * @param password - Desired password.
   * @param licenseKey - A valid, unused license key.
   * @param hwid - Hardware ID (auto-generated if not provided).
   * @throws AuthonError on failure (e.g., "Username already exists").
   */
  async register(
    username: string,
    password: string,
    licenseKey: string,
    hwid?: string
  ): Promise<void> {
    if (!username || !password || !licenseKey) {
      throw new AuthonError("Username, password, and licenseKey are required");
    }

    const response = await this.request({
      type: "register",
      username,
      password,
      licenseKey,
      hwid: hwid || (await Authon.getHWID()),
    });

    if (!response.success) {
      throw new AuthonError(response.message || "Registration failed");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validates the current session (heartbeat).
   *
   * @returns true if session is valid.
   */
  async check(): Promise<boolean> {
    if (!this.isAuthenticated) return false;

    const response = await this.request({
      type: "check",
      sessionToken: this.sessionToken,
    });

    return response.success;
  }

  /**
   * Ends the current session and clears local state.
   *
   * @returns true if logout was successful.
   */
  async logout(): Promise<boolean> {
    if (!this.isAuthenticated) return false;

    const response = await this.request({
      type: "logout",
      sessionToken: this.sessionToken,
    });

    if (response.success) {
      this.sessionToken = null;
      this.username = null;
      this.level = 0;
      this.subscription = null;
      this.expiresAt = null;
    }

    return response.success;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VARIABLES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gets an application-level variable (shared across all users).
   *
   * @param key - Variable name.
   * @returns Variable value or null.
   */
  async getVar(key: string): Promise<string | null> {
    const response = await this.request<{ key: string; value: string }>({
      type: "var",
      key,
      sessionToken: this.sessionToken,
    });

    return response.success ? response.data?.value ?? null : null;
  }

  /**
   * Sets a user-level variable.
   *
   * @param key - Variable name.
   * @param value - Variable value.
   * @returns true if saved.
   */
  async setVar(key: string, value: string): Promise<boolean> {
    const response = await this.request({
      type: "setvar",
      key,
      value,
      sessionToken: this.sessionToken,
    });

    return response.success;
  }

  /**
   * Gets a user-level variable.
   *
   * @param key - Variable name.
   * @returns Variable value or null.
   */
  async getUserVar(key: string): Promise<string | null> {
    const response = await this.request<{ key: string; value: string }>({
      type: "getvar",
      key,
      sessionToken: this.sessionToken,
    });

    return response.success ? response.data?.value ?? null : null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lists all files available to the authenticated user.
   *
   * @returns Array of FileInfo objects.
   */
  async listFiles(): Promise<FileInfo[]> {
    if (!this.isAuthenticated) throw new AuthonError("No active session");

    const response = await this.request<FileInfo[]>({
      type: "list_files",
      sessionToken: this.sessionToken,
    });

    if (!response.success) {
      throw new AuthonError(response.message || "Failed to list files");
    }

    return response.data || [];
  }

  /**
   * Downloads a file by its ID.
   *
   * @param fileId - File ID from listFiles().
   * @returns ArrayBuffer containing file data.
   */
  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    if (!this.isAuthenticated || !fileId) {
      throw new AuthonError("Session and file ID are required");
    }

    const response = await this.request<{ binary: ArrayBuffer }>({
      type: "file",
      fileId,
      sessionToken: this.sessionToken,
    });

    if (response.data && "binary" in response.data) {
      return response.data.binary;
    }

    // GET fallback
    const url = `${this.apiUrl}/files/download/${fileId}?token=${this.sessionToken}`;
    const getResp = await fetch(url);
    const ct = getResp.headers.get("content-type") || "";

    if (ct.includes("octet-stream")) {
      return await getResp.arrayBuffer();
    }

    throw new AuthonError("File download failed");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGGING & ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sends an activity log message to the dashboard.
   *
   * @param message - Log message (max 500 chars).
   * @returns true if logged.
   */
  async log(message: string): Promise<boolean> {
    const msg = message.length > 500 ? message.substring(0, 500) : message;

    const response = await this.request({
      type: "log",
      message: msg,
      sessionToken: this.sessionToken,
    });

    return response.success;
  }

  /**
   * Gets the list of currently online users.
   *
   * @returns OnlineData with count and users.
   */
  async fetchOnline(): Promise<OnlineData> {
    if (!this.isAuthenticated) throw new AuthonError("No active session");

    const response = await this.request<OnlineData>({
      type: "fetch_online",
      sessionToken: this.sessionToken,
    });

    if (!response.success) {
      throw new AuthonError(response.message || "Failed to fetch online users");
    }

    return response.data || { count: 0, users: [] };
  }

  /**
   * Gets application statistics.
   *
   * @returns StatsData.
   */
  async fetchStats(): Promise<StatsData> {
    if (!this.isAuthenticated) throw new AuthonError("No active session");

    const response = await this.request<StatsData>({
      type: "fetch_stats",
      sessionToken: this.sessionToken,
    });

    if (!response.success) {
      throw new AuthonError(response.message || "Failed to fetch stats");
    }

    return response.data!;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Checks if an IP or HWID is blacklisted.
   *
   * @param options - { ip?: string, hwid?: string }
   * @returns BlacklistData.
   */
  async checkBlacklist(options: { ip?: string; hwid?: string } = {}): Promise<BlacklistData> {
    const payload: Record<string, unknown> = { type: "check_blacklist" };
    if (options.ip) payload.ip = options.ip;
    if (options.hwid) payload.hwid = options.hwid;

    const response = await this.request<BlacklistData>(payload);

    if (!response.success) {
      throw new AuthonError(response.message || "Blacklist check failed");
    }

    return response.data || { blacklisted: false, reason: null };
  }

  /**
   * Redeems a referral code for bonus subscription days.
   *
   * @param code - Referral code.
   * @returns ReferralData with expiresAt and rewardDays.
   */
  async redeemReferral(code: string): Promise<ReferralData & { message?: string }> {
    if (!this.isAuthenticated || !code) {
      throw new AuthonError("Session and referral code are required");
    }

    const response = await this.request<ReferralData>({
      type: "redeem_referral",
      code,
      sessionToken: this.sessionToken,
    });

    if (!response.success) {
      throw new AuthonError(response.message || "Referral redemption failed");
    }

    return { ...response.data!, message: response.message };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private extractSession(data: SessionData): void {
    this.sessionToken = data.sessionToken;
    this.username = data.username;
    this.level = data.level;
    this.subscription = data.subscription;
    this.expiresAt = data.expiresAt;
  }
}

export default Authon;
