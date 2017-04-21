/**
 * A set of logging levels
 *
 */
export enum LogLevel {
    Verbose = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
    Off = 99,
}

/**
 * Interface that defines a log entry
 *
 */
export interface LogEntry {
    /**
     * The main message to be logged
     */
    message: string;
    /**
     * The level of information this message represents
     */
    level: LogLevel;
    /**
     * Any associated data that a given logging listener may choose to log or ignore
     */
    data?: any;
}

/**
 * Interface that defines a log listner
 *
 */
export interface LogListener {
    /**
     * Any associated data that a given logging listener may choose to log or ignore
     *
     * @param entry The information to be logged
     */
    log(entry: LogEntry): void;
}

/**
 * Class used to subscribe ILogListener and log messages throughout an application
 *
 */
export class Logger {

    private static _instance: LoggerImpl;

    public static get activeLogLevel(): LogLevel {
        return Logger.instance.activeLogLevel;
    }

    public static set activeLogLevel(value: LogLevel) {
        Logger.instance.activeLogLevel = value;
    }

    private static get instance(): LoggerImpl {
        if (typeof Logger._instance === "undefined" || Logger._instance === null) {
            Logger._instance = new LoggerImpl();
        }
        return Logger._instance;
    }

    /**
     * Adds ILogListener instances to the set of subscribed listeners
     *
     * @param listeners One or more listeners to subscribe to this log
     */
    public static subscribe(...listeners: LogListener[]): void {
        listeners.map(listener => Logger.instance.subscribe(listener));
    }

    /**
     * Clears the subscribers collection, returning the collection before modifiction
     */
    public static clearSubscribers(): LogListener[] {
        return Logger.instance.clearSubscribers();
    }

    /**
     * Gets the current subscriber count
     */
    public static get count(): number {
        return Logger.instance.count;
    }

    /**
     * Writes the supplied string to the subscribed listeners
     *
     * @param message The message to write
     * @param level [Optional] if supplied will be used as the level of the entry (Default: LogLevel.Verbose)
     */
    public static write(message: string, level: LogLevel = LogLevel.Verbose) {
        Logger.instance.log({ level: level, message: message });
    }

    /**
     * Writes the supplied string to the subscribed listeners
     *
     * @param json The json object to stringify and write
     * @param level [Optional] if supplied will be used as the level of the entry (Default: LogLevel.Verbose)
     */
    public static writeJSON(json: any, level: LogLevel = LogLevel.Verbose) {
        Logger.instance.log({ level: level, message: JSON.stringify(json) });
    }

    /**
     * Logs the supplied entry to the subscribed listeners
     *
     * @param entry The message to log
     */
    public static log(entry: LogEntry) {
        Logger.instance.log(entry);
    }

    /**
     * Logs performance tracking data for the the execution duration of the supplied function using console.profile
     *
     * @param name The name of this profile boundary
     * @param f The function to execute and track within this performance boundary
     */
    public static measure<T>(name: string, f: () => T): T {
        return Logger.instance.measure(name, f);
    }
}

class LoggerImpl {

    constructor(public activeLogLevel: LogLevel = LogLevel.Warning, private subscribers: LogListener[] = []) { }

    public subscribe(listener: LogListener): void {
        this.subscribers.push(listener);
    }

    public clearSubscribers(): LogListener[] {
        const s = this.subscribers.slice(0);
        this.subscribers.length = 0;
        return s;
    }

    public get count(): number {
        return this.subscribers.length;
    }

    public write(message: string, level: LogLevel = LogLevel.Verbose) {
        this.log({ level: level, message: message });
    }

    public log(entry: LogEntry) {
        if (typeof entry === "undefined" || entry.level < this.activeLogLevel) {
            return;
        }

        this.subscribers.map(subscriber => subscriber.log(entry));
    }

    public measure<T>(name: string, f: () => T): T {
        console.profile(name);
        try {
            return f();
        } finally {
            console.profileEnd();
        }
    }
}

/**
 * Implementation of ILogListener which logs to the browser console
 *
 */
export class ConsoleListener implements LogListener {

    /**
     * Any associated data that a given logging listener may choose to log or ignore
     *
     * @param entry The information to be logged
     */
    public log(entry: LogEntry): void {

        const msg = this.format(entry);

        switch (entry.level) {
            case LogLevel.Verbose:
            case LogLevel.Info:
                console.log(msg);
                break;
            case LogLevel.Warning:
                console.warn(msg);
                break;
            case LogLevel.Error:
                console.error(msg);
                break;
        }
    }

    /**
     * Formats the message
     *
     * @param entry The information to format into a string
     */
    private format(entry: LogEntry): string {
        return "Message: " + entry.message + " Data: " + JSON.stringify(entry.data);
    }
}

/**
 * Implementation of ILogListener which logs to the supplied function
 *
 */
export class FunctionListener implements LogListener {

    /**
     * Creates a new instance of the FunctionListener class
     *
     * @constructor
     * @param  method The method to which any logging data will be passed
     */
    constructor(private method: (entry: LogEntry) => void) { }

    /**
     * Any associated data that a given logging listener may choose to log or ignore
     *
     * @param entry The information to be logged
     */
    public log(entry: LogEntry): void {
        this.method(entry);
    }
}
