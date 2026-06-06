import { createNekoDriftAgentHooks, type AgentPluginOptions } from "./agent-plugin-runtime.js";

export const nekoDriftAgentPluginId = "neko-drift-agent";

const plugin = {
  id: nekoDriftAgentPluginId,
  server: async (_input: unknown, options?: AgentPluginOptions) => createNekoDriftAgentHooks(options ?? {}),
};

export default plugin;
