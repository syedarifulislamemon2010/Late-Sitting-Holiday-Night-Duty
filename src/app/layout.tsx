import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import CommandCenter from "@/components/CommandCenter";
import CommandPalette from "@/components/CommandPalette";
import { ProfileProvider } from "@/context/ProfileContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { TopProgressBar } from "@/components/TopProgressBar";

import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { ToastProvider } from "@/context/ToastContext";
import PageTransition from "@/components/PageTransition";
import SessionExpiryWarning from "@/components/SessionExpiryWarning";

const notoSansBengali = localFont({
  src: [
    { path: "../fonts/noto-sans-bengali-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-sans-bengali-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/noto-sans-bengali-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/noto-sans-bengali-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-bengali",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/inter-variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি ছুটির আবেদন পোর্টাল - জনতা ব্যাংক পিএলসি.",
  description: "জনতা ব্যাংক পিএলসি. - লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি এবং ছুটির আবেদন পোর্টাল",
  icons: {
    icon: "/janata-bank-logo-real.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`h-full ${notoSansBengali.variable} ${inter.variable}`} suppressHydrationWarning={true}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0b5e9e" />
        <script
          suppressHydrationWarning={true}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 0. Instant 0-nanosecond theme activation before any rendering
                try {
                  var t = localStorage.getItem('theme');
                  var d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (d) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(_) {}

                // 1. Native DOM method backups
                var origRemoveAttr = Element.prototype.removeAttribute;
                var origHasAttr = Element.prototype.hasAttribute;
                var origGetAttr = Element.prototype.getAttribute;
                var origSetAttr = Element.prototype.setAttribute;

                // 2. Helper to detect extension noise, bis_skin_checked, and hydration diffs
                function isExtensionNoise(val) {
                  if (!val) return false;
                  var str = '';
                  try {
                    if (typeof val === 'string') {
                      str = val;
                    } else if (val instanceof Error) {
                      str = (val.message || '') + ' ' + (val.stack || '') + ' ' + (val.diff || '') + ' ' + (val.details || '') + ' ' + (val.cause ? String(val.cause) : '');
                    } else if (typeof val === 'object') {
                      str = JSON.stringify(val) + ' ' + Object.values(val).join(' ');
                    } else {
                      str = String(val);
                    }
                  } catch(e) {
                    str = String(val);
                  }
                  return str.indexOf('bis_skin_checked') !== -1 || 
                         str.indexOf('bis_') !== -1 ||
                         str.indexOf('chrome-extension://') !== -1 || 
                         str.indexOf('moz-extension://') !== -1 ||
                         str.indexOf('safari-extension://') !== -1 ||
                         str.indexOf('M_ID') !== -1;
                }

                function hasNoise(args) {
                  if (!args || !args.length) return false;
                  for (var i = 0; i < args.length; i++) {
                    if (isExtensionNoise(args[i])) return true;
                  }
                  try {
                    var joined = Array.prototype.slice.call(args).map(function(item) {
                      if (!item) return '';
                      if (typeof item === 'string') return item;
                      if (item instanceof Error) {
                        return (item.message || '') + ' ' + (item.stack || '') + ' ' + (item.diff || '') + ' ' + (item.details || '');
                      }
                      try { return JSON.stringify(item); } catch(_) { return String(item); }
                    }).join(' ');
                    if (isExtensionNoise(joined)) return true;
                  } catch(_) {}
                  return false;
                }

                // 3. Intercept console.error & console.warn via defineProperty with getter and setter
                // This prevents Next.js dev overlay from overriding our suppressor when intercept-console-error loads!
                var _activeConsoleError = console.error;
                try {
                  Object.defineProperty(console, 'error', {
                    get: function() {
                      return _activeConsoleError;
                    },
                    set: function(newFn) {
                      if (typeof newFn === 'function') {
                        _activeConsoleError = function(...args) {
                          if (hasNoise(args)) return;
                          return newFn.apply(this, args);
                        };
                      } else {
                        _activeConsoleError = newFn;
                      }
                    },
                    configurable: true,
                    enumerable: true
                  });
                } catch(e) {
                  var fallbackOrigError = console.error;
                  console.error = function(...args) {
                    if (hasNoise(args)) return;
                    fallbackOrigError.apply(console, args);
                  };
                }

                var _activeConsoleWarn = console.warn;
                try {
                  Object.defineProperty(console, 'warn', {
                    get: function() {
                      return _activeConsoleWarn;
                    },
                    set: function(newFn) {
                      if (typeof newFn === 'function') {
                        _activeConsoleWarn = function(...args) {
                          if (hasNoise(args)) return;
                          return newFn.apply(this, args);
                        };
                      } else {
                        _activeConsoleWarn = newFn;
                      }
                    },
                    configurable: true,
                    enumerable: true
                  });
                } catch(e) {
                  var fallbackOrigWarn = console.warn;
                  console.warn = function(...args) {
                    if (hasNoise(args)) return;
                    fallbackOrigWarn.apply(console, args);
                  };
                }

                // 4. Intercept window.reportError (Next.js client runtime uses this for onRecoverableError)
                if (typeof window.reportError === 'function') {
                  var _activeReportError = window.reportError;
                  try {
                    Object.defineProperty(window, 'reportError', {
                      get: function() {
                        return function(err) {
                          if (isExtensionNoise(err) || (err && (isExtensionNoise(err.diff) || isExtensionNoise(err.details) || isExtensionNoise(err.cause) || isExtensionNoise(err.message)))) {
                            return;
                          }
                          return _activeReportError.apply(this, arguments);
                        };
                      },
                      set: function(newFn) {
                        _activeReportError = newFn;
                      },
                      configurable: true,
                      enumerable: true
                    });
                  } catch(e) {
                    window.reportError = function(err) {
                      if (isExtensionNoise(err) || (err && (isExtensionNoise(err.diff) || isExtensionNoise(err.details) || isExtensionNoise(err.cause) || isExtensionNoise(err.message)))) {
                        return;
                      }
                      return _activeReportError.apply(this, arguments);
                    };
                  }
                }

                // 5. Intercept window.addEventListener to wrap any future error listeners (e.g. Next DevTools)
                var _origAddEventListener = window.addEventListener;
                window.addEventListener = function(type, listener, options) {
                  if ((type === 'error' || type === 'unhandledrejection') && typeof listener === 'function') {
                    var wrapped = function(event) {
                      var toCheck = type === 'error' ? (event && (event.error || event.message)) : (event && event.reason);
                      if (isExtensionNoise(toCheck) || (event && event.error && (isExtensionNoise(event.error.diff) || isExtensionNoise(event.error.details) || isExtensionNoise(event.error.cause)))) {
                        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                        if (event.preventDefault) event.preventDefault();
                        return;
                      }
                      return listener.apply(this, arguments);
                    };
                    return _origAddEventListener.call(this, type, wrapped, options);
                  }
                  return _origAddEventListener.apply(this, arguments);
                };

                // 6. Capturing window error events as early shield
                window.addEventListener('error', function(e) {
                  if (hasNoise([e.message, e.filename, e.error, e.error && e.error.diff, e.error && e.error.details, e.error && e.error.cause])) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  if (hasNoise([e.reason, e.reason && e.reason.message, e.reason && e.reason.diff])) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);

                // 7. Element prototype overrides:
                // Intercept getAttribute/hasAttribute/setAttribute
                Element.prototype.hasAttribute = function(name) {
                  if (name && (name.indexOf('bis_') === 0 || name.indexOf('__bis') === 0)) return false;
                  return origHasAttr.apply(this, arguments);
                };

                Element.prototype.getAttribute = function(name) {
                  if (name && (name.indexOf('bis_') === 0 || name.indexOf('__bis') === 0)) return null;
                  return origGetAttr.apply(this, arguments);
                };

                Element.prototype.setAttribute = function(name, val) {
                  if (name && (name.indexOf('bis_') === 0 || name.indexOf('__bis') === 0)) return;
                  return origSetAttr.apply(this, arguments);
                };

                // Strip 'bis_skin_checked' and any extension attributes when React accesses Element.prototype.attributes
                try {
                  var attrDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'attributes') ||
                                 Object.getOwnPropertyDescriptor(Node.prototype, 'attributes');
                  if (attrDesc && attrDesc.get) {
                    var origAttrGet = attrDesc.get;
                    Object.defineProperty(Element.prototype, 'attributes', {
                      get: function() {
                        try {
                          var rawAttrs = origAttrGet.call(this);
                          var toRemove = [];
                          for (var i = 0; i < rawAttrs.length; i++) {
                            var aName = rawAttrs[i].name;
                            if (aName && (aName.indexOf('bis_') === 0 || aName.indexOf('__bis') === 0)) {
                              toRemove.push(aName);
                            }
                          }
                          for (var j = 0; j < toRemove.length; j++) {
                            origRemoveAttr.call(this, toRemove[j]);
                          }
                        } catch(_) {}
                        return origAttrGet.call(this);
                      },
                      configurable: true,
                      enumerable: true
                    });
                  }
                } catch(e) {}

                // 8. Dynamic cleaning and MutationObserver
                function cleanElementTree(node) {
                  if (!node || node.nodeType !== 1) return;
                  try {
                    var rawAttrs = origAttrGet ? origAttrGet.call(node) : node.attributes;
                    if (rawAttrs) {
                      for (var i = rawAttrs.length - 1; i >= 0; i--) {
                        var aName = rawAttrs[i].name;
                        if (aName && (aName.indexOf('bis_') === 0 || aName.indexOf('__bis') === 0)) {
                          origRemoveAttr.call(node, aName);
                        }
                      }
                    }
                  } catch(_) {}
                  try {
                    var items = node.querySelectorAll ? node.querySelectorAll('[bis_skin_checked], [class*="bis_"]') : [];
                    for (var k = 0; k < items.length; k++) {
                      try {
                        origRemoveAttr.call(items[k], 'bis_skin_checked');
                      } catch(_) {}
                    }
                  } catch(_) {}
                }

                try {
                  cleanElementTree(document.documentElement);
                  var bisObserver = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes') {
                        if (m.attributeName && (m.attributeName.indexOf('bis_') === 0 || m.attributeName.indexOf('__bis') === 0)) {
                          if (m.target) {
                            try { origRemoveAttr.call(m.target, m.attributeName); } catch(_) {}
                          }
                        }
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          cleanElementTree(m.addedNodes[j]);
                        }
                      }
                    }
                  });
                  bisObserver.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true
                  });
                  setTimeout(function() {
                    bisObserver.disconnect();
                  }, 15000);
                } catch(e) {}

                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  });
                }
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground" suppressHydrationWarning={true}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow-lg">
          মূল বিষয়বস্তুতে যান
        </a>
        <TopProgressBar />
        <ThemeProvider>
        <LanguageProvider>
          <ProfileProvider>
            <LayoutProvider>
              <ToastProvider>
                <AuthGuard>
                  <SessionExpiryWarning />
                  <div className="flex-1 flex flex-col lg:flex-row min-h-0" suppressHydrationWarning={true}>
                  <Sidebar />
                  <main id="main-content" className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden" suppressHydrationWarning={true}>
                    <Navbar />
                    <CommandCenter />
                    <CommandPalette />
                    <div className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-y-auto max-w-full overflow-x-hidden flex flex-col justify-between" suppressHydrationWarning={true}>
                    <div className="flex-1">
                      <PageTransition>{children}</PageTransition>
                    </div>
                    
                    {/* Premium Dashboard Footer */}
                    <footer className="no-print print:hidden py-4 mt-auto text-slate-400 text-center app-footer-text text-xs font-sans">
                      ডিজাইন ও ডেভেলপমেন্ট: অনলাইন ব্যাংকিং ডিপার্টমেন্ট | সংস্করণ ১.০.০
                    </footer>
                  </div>
                  </main>
                </div>
              </AuthGuard>
            </ToastProvider>
          </LayoutProvider>
        </ProfileProvider>
      </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
