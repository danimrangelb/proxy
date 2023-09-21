//@deno-types="npm:@types/express"
import express, { json, urlencoded, RequestHandler } from "npm:express";
//@deno-types="npm:@types/cors"
import cors from "npm:cors";
import morgan from "npm:morgan";
import { type IProxyConfig, type IPatchFile } from "./types.ts";
import { green, yellow } from "https://deno.land/std@0.202.0/fmt/colors.ts";
import "https://deno.land/std@0.202.0/dotenv/load.ts";
import { getConfigUrlType, routerFactory } from "./helpers.ts";

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
const userConfig = JSON.parse(
  (await Deno.readTextFile("./" + CONFIG_FILE_NAME)) || "{}"
);

const config: IProxyConfig = { ...defaultConfig, ...userConfig };

config.verbose &&
  console.info(`Using ${green(CONFIG_SCOPE || "default")} scope`);
config.verbose && console.info(`Loaded config from ${green(CONFIG_FILE_NAME)}`);
// config.verbose && console.info(config);

// Patch File

const patchFile = JSON.parse(
  (await Deno.readTextFile("./" + PATCH_FILE_NAME)) || "{}"
) as IPatchFile;

config.verbose &&
  console.info(`Loaded patches file from ${green(PATCH_FILE_NAME)}`);

if (config.verbose) app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    credentials: true,
  }) as unknown as RequestHandler
);
app.use(json());
app.use(urlencoded({ extended: true }));

// Router

app.use(routerFactory(config, patchFile));

// Server

app.listen(config.port, () => {
  console.info(`Proxy listening on ${yellow(`http://localhost:${config.port}`)}`);
  config.verbose &&
    Array.isArray(config.proxyUrl) &&
    console.info(
      `Registered endpoints: ${yellow(
        (config as unknown as IProxyConfig<"array">).proxyUrl
          .map((proxyUrl) => proxyUrl.endpoint)
          .join(", ")
      )} `
    );
  config.verbose &&
    typeof config.proxyUrl === "string" &&
    console.info(`Registered endpoint: ${yellow("/")}`);
  config.verbose &&
    getConfigUrlType(config) === "object" &&
    console.info(
      `Registered endpoint: ${yellow(
        (config as unknown as IProxyConfig<"object">).proxyUrl.endpoint
      )}`
    );
});
