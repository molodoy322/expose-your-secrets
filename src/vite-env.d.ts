/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
  frame?: {
    sdk: {
      ready: () => Promise<void>;
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

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
