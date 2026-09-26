import type { NextConfig } from 'next';
import { resolve } from 'node:path';

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  turbopack: {
    root: resolve(import.meta.dirname, '..'),
  },
};

export default nextConfig;
