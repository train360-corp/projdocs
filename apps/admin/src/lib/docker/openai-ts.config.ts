import { defineConfig } from "@hey-api/openapi-ts";
import * as path from "node:path";



export default defineConfig({
  // client: "axios",
  input: path.resolve(__dirname, "v1.47.yaml"),
  output: {
    path: path.resolve(__dirname, "gen"),
    tsConfigPath: path.resolve(__dirname, "../../../tsconfig.json"),
    importFileExtension: ".ts"
  },
  plugins: [
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: path.resolve(__dirname, "axios.config.ts"),
    },
    '@hey-api/schemas',
    {
      dates: true,
      name: '@hey-api/transformers',
    },
    {
      enums: 'javascript',
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
      transformer: true,
    },
  ],
});