import { Util } from "../utils/util";
import { Dictionary } from "../collections/collections";
import { FetchOptions } from "../net/httpclient";
import { ODataParser, ODataDefaultParser, ODataBatch } from "./odata";
import { ICachingOptions } from "./caching";
import { RuntimeConfig } from "../configuration/pnplibconfig";
import { AlreadyInBatchException } from "../utils/exceptions";
import { Logger, LogLevel } from "../utils/logging";
import {
    RequestContext,
    PipelineMethods,
    pipe,
} from "./pipeline";

export interface QueryableConstructor<T> {
    new (baseUrl: string | Queryable, path?: string): T;
}

/**
 * Queryable Base Class
 *
 */
export class Queryable {

    /**
     * Tracks the query parts of the url
     */
    protected _query: Dictionary<string>;

    /**
     * Tracks the batch of which this query may be part
     */
    private _batch: ODataBatch;

    /**
     * Tracks the url as it is built
     */
    private _url: string;

    /**
     * Stores the parent url used to create this instance, for recursing back up the tree if needed
     */
    private _parentUrl: string;

    /**
     * Explicitly tracks if we are using caching for this request
     */
    private _useCaching: boolean;

    /**
     * Any options that were supplied when caching was enabled
     */
    private _cachingOptions: ICachingOptions;

    /**
     * Directly concatonates the supplied string to the current url, not normalizing "/" chars
     *
     * @param pathPart The string to concatonate to the url
     */
    public concat(pathPart: string): this {
        this._url += pathPart;
        return this;
    }

    /**
     * Appends the given string and normalizes "/" chars
     *
     * @param pathPart The string to append
     */
    protected append(pathPart: string) {
        this._url = Util.combinePaths(this._url, pathPart);
    }

    /**
     * Blocks a batch call from occuring, MUST be cleared by calling the returned function
     */
    protected addBatchDependency(): () => void {
        if (this.hasBatch) {
            return this._batch.addDependency();
        }

        return () => null;
    }

    /**
     * Indicates if the current query has a batch associated
     *
     */
    protected get hasBatch(): boolean {
        return this._batch !== null;
    }

    /**
     * The batch currently associated with this query or null
     *
     */
    protected get batch(): ODataBatch {
        return this.hasBatch ? this._batch : null;
    }

    /**
     * Gets the parent url used when creating this instance
     *
     */
    protected get parentUrl(): string {
        return this._parentUrl;
    }

    /**
     * Provides access to the query builder for this url
     *
     */
    public get query(): Dictionary<string> {
        return this._query;
    }

    /**
     * Creates a new instance of the Queryable class
     *
     * @constructor
     * @param baseUrl A string or Queryable that should form the base part of the url
     *
     */
    constructor(baseUrl: string | Queryable, path?: string) {

        this._query = new Dictionary<string>();
        this._batch = null;

        if (typeof baseUrl === "string") {
            // we need to do some extra parsing to get the parent url correct if we are
            // being created from just a string.

            const urlStr = baseUrl as string;
            if (Util.isUrlAbsolute(urlStr) || urlStr.lastIndexOf("/") < 0) {
                this._parentUrl = urlStr;
                this._url = Util.combinePaths(urlStr, path);
            } else if (urlStr.lastIndexOf("/") > urlStr.lastIndexOf("(")) {
                // .../items(19)/fields
                const index = urlStr.lastIndexOf("/");
                this._parentUrl = urlStr.slice(0, index);
                path = Util.combinePaths(urlStr.slice(index), path);
                this._url = Util.combinePaths(this._parentUrl, path);
            } else {
                // .../items(19)
                const index = urlStr.lastIndexOf("(");
                this._parentUrl = urlStr.slice(0, index);
                this._url = Util.combinePaths(urlStr, path);
            }
        } else {
            const q = baseUrl as Queryable;
            this._parentUrl = q._url;
            const target = q._query.get("@target");
            if (target !== null) {
                this._query.add("@target", target);
            }
            this._url = Util.combinePaths(this._parentUrl, path);
        }
    }

    /**
     * Creates a new instance of the supplied factory and extends this into that new instance
     *
     * @param factory constructor for the new queryable
     */
    public as<T>(factory: QueryableConstructor<T>): T {
        const o = <T>new factory(this._url, null);
        return Util.extend(o, this, true);
    }

    /**
     * Adds this query to the supplied batch
     *
     * @example
     * ```
     *
     * let b = pnp.sp.createBatch();
     * pnp.sp.web.inBatch(b).get().then(...);
     * b.execute().then(...)
     * ```
     */
    public inBatch(batch: ODataBatch): this {

        if (this._batch !== null) {
            throw new AlreadyInBatchException();
        }

        this._batch = batch;

        return this;
    }

    /**
     * Enables caching for this request
     *
     * @param options Defines the options used when caching this request
     */
    public usingCaching(options?: ICachingOptions): this {
        if (!RuntimeConfig.globalCacheDisable) {
            this._useCaching = true;
            this._cachingOptions = options;
        }
        return this;
    }

    /**
     * Gets the currentl url, made absolute based on the availability of the _spPageContextInfo object
     *
     */
    public toUrl(): string {
        return this._url;
    }

    /**
     * Gets the full url with query information
     *
     */
    public toUrlAndQuery(): string {

        const aliasedParams = new Dictionary<string>();

        let url = this.toUrl().replace(/'!(@.*?)::(.*?)'/ig, (match, labelName, value) => {
            Logger.write(`Rewriting aliased parameter from match ${match} to label: ${labelName} value: ${value}`, LogLevel.Verbose);
            aliasedParams.add(labelName, `'${value}'`);
            return labelName;
        });

        // inlude our explicitly set query string params
        aliasedParams.merge(this._query);

        if (aliasedParams.count() > 0) {
            url += `?${aliasedParams.getKeys().map(key => `${key}=${aliasedParams.get(key)}`).join("&")}`;
        }

        return url;
    }

    /**
     * Gets a parent for this instance as specified
     *
     * @param factory The contructor for the class to create
     */
    protected getParent<T extends Queryable>(
        factory: QueryableConstructor<T>,
        baseUrl: string | Queryable = this.parentUrl,
        path?: string,
        batch?: ODataBatch): T {

        let parent = new factory(baseUrl, path);
        const target = this.query.get("@target");
        if (target !== null) {
            parent.query.add("@target", target);
        }
        if (typeof batch !== "undefined") {
            parent = parent.inBatch(batch);
        }
        return parent;
    }

    /**
     * Clones this queryable into a new queryable instance of T
     * @param factory Constructor used to create the new instance
     * @param additionalPath Any additional path to include in the clone
     * @param includeBatch If true this instance's batch will be added to the cloned instance
     */
    protected clone<T extends Queryable>(factory: QueryableConstructor<T>, additionalPath?: string, includeBatch = false): T {
        let clone = new factory(this, additionalPath);
        const target = this.query.get("@target");
        if (target !== null) {
            clone.query.add("@target", target);
        }
        if (includeBatch && this.hasBatch) {
            clone = clone.inBatch(this.batch);
        }
        return clone;
    }

    /**
     * Executes the currently built request
     *
     * @param parser Allows you to specify a parser to handle the result
     * @param getOptions The options used for this request
     */
    public get(parser: ODataParser<any> = new ODataDefaultParser(), getOptions: FetchOptions = {}): Promise<any> {
        return this.toRequestContext("GET", getOptions, parser).then(context => pipe(context));
    }

    public getAs<T>(parser: ODataParser<T> = new ODataDefaultParser(), getOptions: FetchOptions = {}): Promise<T> {
        return this.toRequestContext("GET", getOptions, parser).then(context => pipe(context));
    }

    protected post(postOptions: FetchOptions = {}, parser: ODataParser<any> = new ODataDefaultParser()): Promise<any> {
        return this.toRequestContext("POST", postOptions, parser).then(context => pipe(context));
    }

    protected postAs<T>(postOptions: FetchOptions = {}, parser: ODataParser<T> = new ODataDefaultParser()): Promise<T> {
        return this.toRequestContext("POST", postOptions, parser).then(context => pipe(context));
    }

    protected patch(patchOptions: FetchOptions = {}, parser: ODataParser<any> = new ODataDefaultParser()): Promise<any> {
        return this.toRequestContext("PATCH", patchOptions, parser).then(context => pipe(context));
    }

    protected delete(deleteOptions: FetchOptions = {}, parser: ODataParser<any> = new ODataDefaultParser()): Promise<any> {
        return this.toRequestContext("DELETE", deleteOptions, parser).then(context => pipe(context));
    }

    /**
     * Converts the current instance to a request context
     *
     * @param verb The request verb
     * @param options The set of supplied request options
     * @param parser The supplied ODataParser instance
     * @param pipeline Optional request processing pipeline
     */
    private toRequestContext<T>(
        verb: string,
        options: FetchOptions = {},
        parser: ODataParser<T>,
        pipeline: Array<(c: RequestContext<T>) => Promise<RequestContext<T>>> = PipelineMethods.default): Promise<RequestContext<T>> {

        const dependencyDispose = this.hasBatch ? this.addBatchDependency() : () => { return; };

        return Util.toAbsoluteUrl(this.toUrlAndQuery()).then(url => {

            // build our request context
            const context: RequestContext<T> = {
                batch: this._batch,
                batchDependency: dependencyDispose,
                cachingOptions: this._cachingOptions,
                isBatched: this.hasBatch,
                isCached: this._useCaching,
                options: options,
                parser: parser,
                pipeline: pipeline,
                requestAbsoluteUrl: url,
                requestId: Util.getGUID(),
                verb: verb,
            };

            return context;
        });
    }
}

/**
 * Represents a REST collection which can be filtered, paged, and selected
 *
 */
export class QueryableCollection extends Queryable {

    /**
     * Filters the returned collection (https://msdn.microsoft.com/en-us/library/office/fp142385.aspx#bk_supported)
     *
     * @param filter The string representing the filter query
     */
    public filter(filter: string): this {
        this._query.add("$filter", filter);
        return this;
    }

    /**
     * Choose which fields to return
     *
     * @param selects One or more fields to return
     */
    public select(...selects: string[]): this {
        if (selects.length > 0) {
            this._query.add("$select", selects.join(","));
        }
        return this;
    }

    /**
     * Expands fields such as lookups to get additional data
     *
     * @param expands The Fields for which to expand the values
     */
    public expand(...expands: string[]): this {
        if (expands.length > 0) {
            this._query.add("$expand", expands.join(","));
        }
        return this;
    }

    /**
     * Orders based on the supplied fields ascending
     *
     * @param orderby The name of the field to sort on
     * @param ascending If false DESC is appended, otherwise ASC (default)
     */
    public orderBy(orderBy: string, ascending = true): this {
        const keys = this._query.getKeys();
        const query: string[] = [];
        const asc = ascending ? " asc" : " desc";
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === "$orderby") {
                query.push(this._query.get("$orderby"));
                break;
            }
        }
        query.push(`${orderBy}${asc}`);

        this._query.add("$orderby", query.join(","));

        return this;
    }

    /**
     * Skips the specified number of items
     *
     * @param skip The number of items to skip
     */
    public skip(skip: number): this {
        this._query.add("$skip", skip.toString());
        return this;
    }

    /**
     * Limits the query to only return the specified number of items
     *
     * @param top The query row limit
     */
    public top(top: number): this {
        this._query.add("$top", top.toString());
        return this;
    }
}


/**
 * Represents an instance that can be selected
 *
 */
export class QueryableInstance extends Queryable {

    /**
     * Choose which fields to return
     *
     * @param selects One or more fields to return
     */
    public select(...selects: string[]): this {
        if (selects.length > 0) {
            this._query.add("$select", selects.join(","));
        }
        return this;
    }

    /**
     * Expands fields such as lookups to get additional data
     *
     * @param expands The Fields for which to expand the values
     */
    public expand(...expands: string[]): this {
        if (expands.length > 0) {
            this._query.add("$expand", expands.join(","));
        }
        return this;
    }
}
