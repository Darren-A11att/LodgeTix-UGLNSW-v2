import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, params: TurnstileWidgetParams) => string | undefined;
      reset: (widgetIdOrContainer: string | HTMLElement) => void;
      getResponse: (widgetIdOrContainer: string | HTMLElement) => string | undefined;
      remove: (widgetIdOrContainer: string | HTMLElement) => void;
    };
  }
}

interface TurnstileWidgetParams {
  sitekey: string;
  action?: string;
  cData?: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string; // Supported language codes
  tabindex?: number;
  'response-field'?: boolean;
  'response-field-name'?: string;
  size?: 'normal' | 'compact' | 'invisible';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  // ... any other params from documentation
}

interface Props {
  siteKey: string;
  onToken: (token: string) => void;
  onError?: () => void;
  action?: string;
  cData?: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  size?: 'normal' | 'compact'; // Invisible might need different handling
}

const TurnstileWidget: React.FC<Props> = ({
  siteKey,
  onToken,
  onError,
  action,
  cData,
  theme = 'auto',
  language = 'auto',
  size = 'normal',
}) => {
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileContainerRef.current) return;

    const renderWidget = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        try {
          const widgetId = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: siteKey,
            action: action,
            cData: cData,
            callback: (token: string) => {
              console.log('Turnstile token received:', token.substring(0,10) + '...');
              onToken(token);
            },
            'error-callback': () => {
              console.error('Turnstile error callback triggered.');
              if (onError) onError();
            },
            theme: theme,
            language: language,
            size: size,
          });
          if (widgetId) {
            widgetIdRef.current = widgetId;
            console.log('Turnstile widget rendered with ID:', widgetId);
          } else {
            console.error("Failed to render Turnstile widget: render function returned undefined.");
            if (onError) onError();
          }
        } catch (e) {
          console.error("Exception rendering Turnstile widget:", e);
          if (onError) onError();
        }
      } else {
        // console.warn("Turnstile script not loaded yet, will retry...");
        // Retry if turnstile is not loaded yet
        // setTimeout(renderWidget, 500); // Be careful with recursive setTimeouts
      }
    };

    // Check if the script is loaded. If not, wait for it.
    // A more robust solution might use a script loader or listen to the script's onload event.
    if (window.turnstile) {
        renderWidget();
    } else {
        // Fallback if script is not immediately available
        const script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
        if (script) {
            script.addEventListener('load', renderWidget);
            script.addEventListener('error', () => {
                console.error("Turnstile script failed to load.");
                if (onError) onError();
            });
        } else {
            console.error("Turnstile script tag not found in document.");
            if (onError) onError();
        }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
            // console.log("Removing Turnstile widget:", widgetIdRef.current);
            // window.turnstile.remove(widgetIdRef.current); // or turnstileContainerRef.current
        } catch (e) {
            // console.error("Error removing Turnstile widget:", e);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, action, cData, theme, language, size]); // onToken and onError are stable

  return <div ref={turnstileContainerRef} id="turnstile-widget-container"></div>;
};

export default TurnstileWidget; 