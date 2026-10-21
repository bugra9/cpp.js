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
