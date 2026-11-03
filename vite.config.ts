import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

// YouTube Playables wants its SDK loaded by a plain script tag before the game code.
const youtubeSdk = (): Plugin => ({
  name: 'youtube-sdk',
  transformIndexHtml: (html) => html.replace('<head>', '<head>\n    <script src="https://www.youtube.com/game_api/v1"></script>'),
});

// Content-Security-Policy for builds we host ourselves (itch.io, own site, single file).
// Portal builds skip it: their SDKs load ad iframes and scripts from domains we do not control.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');
const cspTag = (): Plugin => ({
  name: 'csp',
  transformIndexHtml: (html) => html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta name="referrer" content="no-referrer" />`),
});

// Modes: web (itch.io / own site), single (one-file preview), poki, crazygames, youtube
export default defineConfig(({ mode }) => {
  const platform = mode === 'development' || mode === 'production' ? 'web' : mode === 'single' ? 'web' : mode;
  const single = mode === 'single' || mode === 'youtube';
  return {
    base: './',
    define: {
      __PLATFORM__: JSON.stringify(platform),
    },
    build: {
      outDir: `dist/${mode === 'production' ? 'web' : mode}`,
      emptyOutDir: true,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
      target: 'es2019',
    },
    plugins: [...(single ? [viteSingleFile()] : []), ...(mode === 'youtube' ? [youtubeSdk()] : []), ...(['web', 'single', 'production'].includes(mode) ? [cspTag()] : [])],
    server: { host: true },
  };
});
