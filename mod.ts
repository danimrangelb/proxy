import { type IProxyConfig, IContext } from "./types.ts";
//@deno-types="npm:@types/express"
import express, { json, urlencoded, RequestHandler } from "express";
//@deno-types="npm:@types/cors"
import cors from "cors";
//@deno-types="npm:@types/morgan"
import morgan from "morgan";

import { green, yellow } from "colors";
import { logRegisteredRoutes, updateContext, watch } from "./helpers.ts";
import { routerFactory } from "./router.ts";
import "dotenv";

// Const

const app = express();
const CONFIG_SCOPE = Deno.env.get("CONFIG_SCOPE");
const CONFIG_FILE_NAME = CONFIG_SCOPE
  ? `proxy.${CONFIG_SCOPE}.config.json`
  : "proxy.config.json";
const PATCH_FILE_NAME = CONFIG_SCOPE
  ? `proxy.${CONFIG_SCOPE}.patch.json`
  : "proxy.patch.json";

// Config

const defaultConfig: IProxyConfig = {
  port: 8080,
  proxyUrl: "",
};

const context: IContext = {
  config: {} as IProxyConfig,
  patchFile: {},
};

context.config.verbose &&
  console.info(`Using ${green(CONFIG_SCOPE || "default")} scope`);

await updateContext(context, CONFIG_FILE_NAME, PATCH_FILE_NAME, defaultConfig);

context.config.watch && watch(() => {
  console.clear();
  context.config.verbose && console.group(green(`Detected change in cwd, executing update:`));
  updateContext(context, CONFIG_FILE_NAME, PATCH_FILE_NAME, defaultConfig)
  context.config.verbose && console.groupEnd();
});

// Middleware

if (context.config.verbose) app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    credentials: true,
  }) as unknown as RequestHandler
);
app.use(json());
app.use(urlencoded({ extended: true }));

// Router

app.use(routerFactory(context));

// Server

app.listen(context.config.port, () => {
  logRegisteredRoutes(context);
  console.info(
    `Proxy listening on ${yellow(`http://localhost:${context.config.port}`)}`
  );
  context.config.verbose && context.config.watch && console.info(`Watching for changes...`);
});
