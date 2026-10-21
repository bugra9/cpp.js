// What an app's host does for its page (target.runtimeEnv: 'app'); in any other build every call rejects.

/** A kind of file a dialog offers: its name, and the extensions, with or without the dot, that make it; "*" is any file. */
export interface FileFilter {
    name: string;
    extensions: string[];
}

export interface OpenOptions {
    title?: string;
    /** The folder the dialog shows first. */
    defaultPath?: string;
    filters?: FileFilter[];
    /** Folders instead of files. */
    directory?: boolean;
    multiple?: boolean;
}

export interface SaveOptions {
    title?: string;
    /** The folder the dialog shows first. */
    defaultPath?: string;
    defaultName?: string;
    filters?: FileFilter[];
}

/** The app's own folders, made when first asked for: what it keeps, what it can lose, and its logs. */
export interface AppPaths {
    data: string;
    cache: string;
    logs: string;
}

export declare const dialog: {
    /** The paths of the files or folders the user picked, or null when they cancelled. */
    open(options?: OpenOptions): Promise<string[] | null>;
    /** The path the user chose to save to, or null when they cancelled. */
    save(options?: SaveOptions): Promise<string | null>;
};

export declare const shell: {
    /** An http, https or mailto address in the default browser or mail app. */
    openExternal(url: string | URL): Promise<void>;
    /** A file in the app the system opens its kind with, where app.openPath in crossbind.config.js lets the page: nowhere without it. */
    openPath(path: string): Promise<void>;
    /** A file, selected, in the system's file manager: one in the app's folders, or one a dialog picked during this run. */
    revealInFolder(path: string): Promise<void>;
};

export declare const app: {
    paths(): Promise<AppPaths>;
    /** Ends the app as closing its window does. */
    quit(): Promise<void>;
};

export declare const events: {
    /** Calls listener with the value of each event of this name the app's native code emits from now on, until the function it returns is called. */
    on(name: string, listener: (value: unknown) => void): () => void;
};

/** A newer version of the app, which app.updater.url in crossbind.config.js offers. */
export interface Update {
    version: string;
}

/** One check or install runs at a time, and another rejects meanwhile. */
export declare const updater: {
    /** The version app.updater.url offers when it is newer than the app's, or null. */
    check(): Promise<Update | null>;
    /** Downloads that version, checks that the key of app.updater.publicKey signed it and installs it in place of the app, which then quits and opens the new version. It rejects when that fails. */
    install(): Promise<void>;
};
