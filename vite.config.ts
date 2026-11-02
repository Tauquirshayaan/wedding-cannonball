import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

// YouTube Playables wants its SDK loaded by a plain script tag before the game code.
const youtubeSdk = (): Plugin => ({
  name: 'youtube-sdk',
  transformIndexHtml: (html) => html.replace('<head>', '<head>\n    <script src="https://www.youtube.com/game_api/v1"></script>'),
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
    plugins: [...(single ? [viteSingleFile()] : []), ...(mode === 'youtube' ? [youtubeSdk()] : [])],
    server: { host: true },
  };
});
