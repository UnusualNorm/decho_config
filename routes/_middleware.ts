import { Handler } from "$fresh/server.ts";
import {
  getSymbol,
  Message,
  SNSConfigFailurev2,
  SNSConfigRequestv2,
  SNSConfigSuccessv2,
  wrapWebsocket,
} from "echovr_lib";
import { getConfig } from "../configs.ts";

const PASSWORD = Deno.env.get("PASSWORD") || "password";
const SYMBOLS_SERVICE = Deno.env.get("SYMBOLS_SERVICE") ||
  "http://127.0.0.1:8080";

export const handler: Handler[] = [
  (req, ctx) => {
    if (
      req.method !== "GET" || req.headers.get("upgrade") !== "websocket"
    ) {
      return ctx.next();
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") ?? "default";

    const { sendMessage: rawSendMessage } = wrapWebsocket(
      socket,
      async (message) => {
        console.info(
          `${ctx.remoteAddr.hostname} => server`,
          message.constructor.name,
          message.data,
        );
        if (!(message instanceof SNSConfigRequestv2)) return;
        const type = message.data.configInfo.type;
        const id = message.data.configInfo.id;

        try {
          const config = await getConfig(platform, type, id);
          const typeSymbol = await getSymbol(type, SYMBOLS_SERVICE);
          const idSymbol = await getSymbol(id, SYMBOLS_SERVICE);

          if (!config) {
            sendMessage(
              new SNSConfigFailurev2({
                typeSymbol,
                idSymbol,
                errorInfo: {
                  type,
                  id,
                  errorcode: 1,
                  error: "Config not found",
                },
              }),
            );
            return;
          }

          sendMessage(
            new SNSConfigSuccessv2({
              typeSymbol,
              idSymbol,
              config,
            }),
          );
        } catch (error) {
          console.error(error);
          sendMessage(
            new SNSConfigFailurev2({
              typeSymbol: 0xffffffffffffffffn,
              idSymbol: 0xffffffffffffffffn,
              errorInfo: {
                type,
                id,
                errorcode: 2,
                error: error.message,
              },
            }),
          );
        }
      },
    );

    const sendMessage = (message: Message<any>) => {
      console.info(
        `server => ${ctx.remoteAddr.hostname}`,
        message.constructor.name,
        message.data,
      );
      rawSendMessage(message);
    };

    return response;
  },
  async (req, ctx) => {
    const auth = req.headers.get("authorization");
    if (auth) {
      const [_, hash] = auth.split(" ");
      const decoded = atob(hash);
      const [username, password] = decoded.split(":");
      if (username === "admin" && password === PASSWORD) {
        return ctx.next();
      }
    }
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  },
];
