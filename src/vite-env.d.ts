/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
  frame?: {
    sdk: {
      ready?: () => Promise<void>;
      actions: {
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
      };
    };
  };
}
