export const config = {
  runtime: 'edge', // this is a pre-requisite
};


globalThis.performance = globalThis.performance ?? { now: Date.now } as Performance;

import { TextEncoder as Encoder, TextDecoder as Decoder } from 'text-encoding-shim';

type EncoderType = typeof globalThis.TextEncoder;
type DecoderType = typeof globalThis.TextDecoder;

globalThis.TextEncoder = globalThis.TextEncoder ?? Encoder as unknown as EncoderType;
globalThis.TextDecoder = globalThis.TextDecoder ?? Decoder as unknown as DecoderType;

globalThis.location = globalThis.location ?? new URL("http://localhost:3000/") as unknown as Location;

import * as esbuild from 'esbuild-wasm';
// @ts-ignore Vercel Edge Function don't import WASM Moules that match `wasm instanceof WebAssembly.Module`
// import wasmModule from 'esbuild-wasm/esbuild.wasm?module';

export const inputModelResetValue = [
  'export default { complex: { boolean: true } }',
].join('\n');

export default async function handler(req: Request) {
  try {
    await esbuild.initialize({
      wasmURL: 'node_modules/esbuild-wasm/esbuild.wasm',
      worker: false,
    });

    const start = Date.now();
    const url = new URL(req.url);
    const result = await esbuild.build({
      stdin: {
        'contents': inputModelResetValue,
      },
      treeShaking: true,

      color: true,
      globalName: 'BundledCode',

      logLevel: 'info',
      sourcemap: false,

      target: ['esnext'],
      format: 'esm',
      bundle: true,
      minify: true,

      platform: 'browser',
      write: false,
    });

    const end = Date.now();
    console.log({ result });

    return new Response(
      JSON.stringify({
        query: url.search,
        input: inputModelResetValue,
        output: result,
        rawTime: (end - start) / 1000,
      }),
      {
        status: 200,
        headers: [
          [
            'Cache-Control',
            'max-age=10, s-maxage=8640, stale-while-revalidate',
          ],
          ['Content-Type', 'application/json'],
        ],
      }
    );
  } catch (e) {
    console.error(e);

    return new Response(JSON.stringify({ error: e.toString() }), {
      status: 400,
    });
  }
}
