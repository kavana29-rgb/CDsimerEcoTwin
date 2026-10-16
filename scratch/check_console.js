import http from 'http';
import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debuggingPort = 9222;

console.log('Launching Chrome with remote debugging on port ' + debuggingPort + '...');
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${debuggingPort}`,
  '--disable-gpu-shader-disk-cache',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  'http://127.0.0.1:5174/'
]);

chrome.stderr.on('data', data => {
  // console.error(`Chrome stderr: ${data}`);
});

setTimeout(async () => {
  try {
    const listRes = await fetch(`http://127.0.0.1:${debuggingPort}/json`);
    const tabs = await listRes.json();
    console.log('Open tabs:', tabs.map(t => ({ id: t.id, title: t.title, url: t.url, ws: t.webSocketDebuggerUrl })));
    
    const appTab = tabs.find(t => t.url && t.url.includes('5174'));
    if (appTab && appTab.webSocketDebuggerUrl) {
      const wsUrl = appTab.webSocketDebuggerUrl;
      const WS = typeof WebSocket !== 'undefined' ? WebSocket : (await import('ws')).default;
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WS(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 4, method: 'Page.enable' }));
        ws.send(JSON.stringify({ id: 5, method: 'Page.navigate', params: { url: 'http://127.0.0.1:5174/' } }));
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]:`, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]:', JSON.stringify(msg.params.exceptionDetails));
        }
      };
      setTimeout(() => {
        // Also evaluate navigating to twin tab in the page
        ws.send(JSON.stringify({
          id: 6,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              // Check if any error boundary was activated or what error was caught
              const fallback = document.querySelector('.scene-fallback-frame');
              const canvas = document.querySelector('canvas');
              ({
                hasFallback: !!fallback,
                fallbackText: fallback ? fallback.innerText : null,
                hasCanvas: !!canvas,
                webglSupported: (() => {
                  try {
                    const c = document.createElement('canvas');
                    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
                  } catch(e) { return false; }
                })(),
                webgl2Supported: (() => {
                  try {
                    const c = document.createElement('canvas');
                    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
                  } catch(e) { return false; }
                })()
              })
            `,
            returnByValue: true
          }
        }));
      }, 3000);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 6) {
          console.log('[PAGE EVAL RESULT]:', JSON.stringify(msg.result?.result?.value));
        }
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]:`, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]:', JSON.stringify(msg.params.exceptionDetails));
        }
      };
      setTimeout(() => {
        ws.close();
        chrome.kill();
        process.exit(0);
      }, 7000);
    }
  } catch (err) {
    console.error('Error querying Chrome remote debugger:', err.message);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
