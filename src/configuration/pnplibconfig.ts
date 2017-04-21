import { TypedHash } from "../collections/collections";
import { HttpClientImpl } from "../net/httpclient";
import { FetchClient } from "../net/fetchclient";

export interface LibraryConfiguration {

    /**
     * Any headers to apply to all requests
     */
    headers?: TypedHash<string>;

    /**
     * Allows caching to be global disabled, default: false
     */
    globalCacheDisable?: boolean;

    /**
     * Defines the default store used by the usingCaching method, default: session
     */
    defaultCachingStore?: "session" | "local";

    /**
     * Defines the default timeout in seconds used by the usingCaching method, default 30
     */
    defaultCachingTimeoutSeconds?: number;

    /**
     * Defines a factory method used to create fetch clients
     */
    fetchClientFactory?: () => HttpClientImpl;

    /**
     * The base url used for all requests
     */
    baseUrl?: string;

    /**
     * Used to supply the current context from an SPFx webpart to the library
     */
    spfxContext?: any;
}

export class RuntimeConfigImpl {

    private _headers: TypedHash<string>;
    private _defaultCachingStore: "session" | "local";
    private _defaultCachingTimeoutSeconds: number;
    private _globalCacheDisable: boolean;
    private _fetchClientFactory: () => HttpClientImpl;
    private _baseUrl: string;
    private _spfxContext: any;

    constructor() {
        // these are our default values for the library
        this._headers = null;
        this._defaultCachingStore = "session";
        this._defaultCachingTimeoutSeconds = 60;
        this._globalCacheDisable = false;
        this._fetchClientFactory = () => new FetchClient();
        this._baseUrl = null;
        this._spfxContext = null;
    }

    public set(config: LibraryConfiguration): void {

        if (config.hasOwnProperty("headers")) {
            this._headers = config.headers;
        }

        if (config.hasOwnProperty("globalCacheDisable")) {
            this._globalCacheDisable = config.globalCacheDisable;
        }

        if (config.hasOwnProperty("defaultCachingStore")) {
            this._defaultCachingStore = config.defaultCachingStore;
        }

        if (config.hasOwnProperty("defaultCachingTimeoutSeconds")) {
            this._defaultCachingTimeoutSeconds = config.defaultCachingTimeoutSeconds;
        }

        if (config.hasOwnProperty("fetchClientFactory")) {
            this._fetchClientFactory = config.fetchClientFactory;
        }

        if (config.hasOwnProperty("baseUrl")) {
            this._baseUrl = config.baseUrl;
        }

        if (config.hasOwnProperty("spfxContext")) {
            this._spfxContext = config.spfxContext;
        }
    }

    public get headers(): TypedHash<string> {
        return this._headers;
    }

    public get defaultCachingStore(): "session" | "local" {
        return this._defaultCachingStore;
    }

    public get defaultCachingTimeoutSeconds(): number {
        return this._defaultCachingTimeoutSeconds;
    }

    public get globalCacheDisable(): boolean {
        return this._globalCacheDisable;
    }

    public get fetchClientFactory(): () => HttpClientImpl {
        return this._fetchClientFactory;
    }

    public get baseUrl(): string {

        if (this._baseUrl !== null) {

            return this._baseUrl;

        } else if (this._spfxContext !== null) {

            return this._spfxContext.pageContext.web.absoluteUrl;
        }

        return null;
    }
}

const _runtimeConfig = new RuntimeConfigImpl();

export let RuntimeConfig = _runtimeConfig;

export function setRuntimeConfig(config: LibraryConfiguration): void {
    _runtimeConfig.set(config);
}
