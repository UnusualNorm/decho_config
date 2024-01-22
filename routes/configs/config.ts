import { Handlers, RouteConfig } from "$fresh/server.ts";
import { deleteConfig, getRawConfig, setConfig } from "../../configs.ts";

export const config: RouteConfig = {
  routeOverride: "/configs/:platform/:type/:id",
};

export const handler: Handlers = {
  GET: async (_req, ctx) => {
    const { platform, type, id } = ctx.params;
    const config = await getRawConfig(platform, type, id);
    if (!config) return new Response("Config not found", { status: 404 });
    return new Response(JSON.stringify(config), {
      headers: {
        "content-type": "application/json",
      },
    });
  },
  POST: async (req, ctx) => {
    const { platform, type, id } = ctx.params;
    const config = await req.json();
    await setConfig(platform, type, id, config);
    return new Response("OK");
  },
  DELETE: async (_req, ctx) => {
    const { platform, type, id } = ctx.params;
    await deleteConfig(platform, type, id);
    return new Response("OK");
  },
};
