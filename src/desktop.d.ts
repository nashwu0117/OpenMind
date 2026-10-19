export {};
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
        };
    }
}
