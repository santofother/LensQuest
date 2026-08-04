import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const isDockerBuild = process.env.DOCKER_BUILD === "true";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    tsconfigPath: isGitHubPagesBuild || isDockerBuild ? "tsconfig.pages.json" : "tsconfig.json",
  },
  output: isGitHubPagesBuild ? "export" : isDockerBuild ? "standalone" : undefined,
  trailingSlash: isGitHubPagesBuild,
  images: {
    unoptimized: isGitHubPagesBuild,
  },
};

export default nextConfig;
