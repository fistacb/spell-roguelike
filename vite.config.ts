import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 試遊はアーティファクト（単一HTML）で行うため、成果物を1ファイルにまとめる
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
