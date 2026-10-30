import { defineConfig } from 'vitest/config';
import ts from 'typescript';

function tsDecoratorsPlugin() {
  return {
    name: 'vite-plugin-ts-decorators',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (id.endsWith('.ts') && !id.endsWith('.d.ts')) {
        const result = ts.transpileModule(code, {
          fileName: id,
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            sourceMap: true,
          },
        });
        return {
          code: result.outputText,
          map: result.sourceMapText ? JSON.parse(result.sourceMapText) : undefined,
        };
      }
    },
  };
}

export default defineConfig({
  esbuild: false,
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  plugins: [tsDecoratorsPlugin()],
});
