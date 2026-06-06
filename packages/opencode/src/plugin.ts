import { createNekoDriftOpenCodeHooks, type OpenCodePluginOptions } from "./opencode-plugin-runtime.js";

export const openPetsOpenCodePluginId = "neko-drift-opencode";

const plugin = {
  id: openPetsOpenCodePluginId,
  server: async (_input: unknown, options?: OpenCodePluginOptions) => createNekoDriftOpenCodeHooks(options ?? {}),
};

export default plugin;
