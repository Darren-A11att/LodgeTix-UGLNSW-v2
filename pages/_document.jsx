import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Fix for CSS preload warnings by adding as="style" attribute */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Add 'as' attribute to all preloaded CSS links
                var observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.addedNodes) {
                      mutation.addedNodes.forEach(function(node) {
                        if (node.tagName === 'LINK' && 
                            node.rel === 'preload' && 
                            node.href.includes('.css') && 
                            !node.hasAttribute('as')) {
                          node.setAttribute('as', 'style');
                        }
                      });
                    }
                  });
                });
                
                observer.observe(document.head, { childList: true, subtree: true });
              })();
            `
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}