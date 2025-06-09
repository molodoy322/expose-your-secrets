/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
  sdk?: {
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
}

declare module '*.svg' { const content: string; export default content; }
declare module '*.png' { const content: string; export default content; }
declare module '*.jpg' { const content: string; export default content; }
declare module '*.jpeg' { const content: string; export default content; }
declare module '*.gif' { const content: string; export default content; }
declare module '*.webp' { const content: string; export default content; }
