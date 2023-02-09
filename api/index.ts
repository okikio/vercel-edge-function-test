export const config = {
  runtime: 'edge', // this is a pre-requisite
};

import * as esbuild from 'esbuild-wasm';
// @ts-ignore
import wasmModule from 'esbuild-wasm/esbuild.wasm?module';

// import { TextEncoder as Encoder, TextDecoder } from 'text-encoding-shim';
// const TextEncoder = Encoder as unknown as TextEncoder;

export const inputModelResetValue = [
  'export default { complex: { boolean: true } }',
].join('\n');

export default async function handler(req: Request) {
  try {
    await esbuild.initialize({
      wasmModule,
      worker: false,
    });

    const start = Date.now();
    const url = new URL(req.url);
    const result = await esbuild.build({
      entryPoints: {
        '/index.tsx': inputModelResetValue,
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
    });

    const end = Date.now();
    console.log({ result });

    return new Response(
      JSON.stringify({
        query: url.search,
        input: inputModelResetValue,
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
