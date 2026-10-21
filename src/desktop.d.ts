export {};
export type UpdateStatus = {
    phase: 'idle' | 'unsupported' | 'unavailable' | 'checking' | 'current' | 'downloading' | 'downloaded' | 'installing' | 'error';
    currentVersion: string;
    availableVersion?: string;
    progress?: number;
    message: string;
};
declare global {
    interface Window {
        openmind?: {
            open: () => Promise<{
                name: string;
                text: string;
            } | null>;
            save: (payload: {
                name: string;
                text: string;
                saveAs: boolean;
            }) => Promise<{
                name: string;
            } | null>;
            pdf: (payload: {
                html: string;
                name: string;
            }) => Promise<{
                name: string;
            } | null>;
            print: (payload: {
                html: string;
            }) => Promise<boolean>;
            openLink: (url: string) => Promise<void>;
            setLocale: (locale: 'zh-TW' | 'en') => Promise<'zh-TW' | 'en'>;
            getUpdateState: () => Promise<UpdateStatus>;
            checkForUpdates: () => Promise<UpdateStatus>;
            installUpdate: () => Promise<boolean>;
            onUpdateState: (callback: (status: UpdateStatus) => void) => () => void;
            onOpenUpdates: (callback: () => void) => () => void;
        };
    }
}
