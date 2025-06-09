export {};

declare global {
  interface Window {
    frame?: {
      sdk: {
        actions: {
          ready: () => Promise<void>;
          post: (options: {
            title?: string;
            image?: string;
            buttons?: Array<{
              label: string;
              action: string;
              target: string;
            }>;
            postUrl?: string;
            input?: {
              text: string;
            };
            text?: string;
          }) => Promise<void>;
          addFrame: (...args: any[]) => Promise<void>;
          composeCast: (...args: any[]) => Promise<void>;
        };
        wallet: any;
        context: any;
      };
    };
  }
} 