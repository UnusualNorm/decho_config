import { Handler, RouteConfig } from "$fresh/server.ts";
import { listConfigs } from "../../configs.ts";

export const config: RouteConfig = {
  routeOverride: "/configs",
};

export const handler: Handler = async (req, ctx) => {
  if (req.method !== "GET") return ctx.next();
  const configs = await listConfigs();
  return new Response(JSON.stringify(configs), {
    headers: {
      "content-type": "application/json",
    },
  });
};
