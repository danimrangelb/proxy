//@deno-types="npm:@types/express"
import { Response, Request } from "npm:express";
import { IContext, IPatchFile, IProxyConfig } from "./types.ts";
import axios, { AxiosError } from "npm:axios";
//@deno-types="npm:@types/object-path"
import objectPath from "npm:object-path";
import { join } from "https://deno.land/std@0.202.0/path/mod.ts";
import { green, red, yellow } from "https://deno.land/std@0.202.0/fmt/colors.ts";

/**
 * Returns the type of the config URL based on the given proxy configuration.
 *
 * @param {IProxyConfig} config - The proxy configuration object.
 * @return {string} The type of the config URL.
 */
export const getConfigUrlType = (config: IProxyConfig) => {
  if (Array.isArray(config.proxyUrl)) {
    return "array";
  } else if (typeof config.proxyUrl === "string") {
    return "string";
  } else {
    return "object";
  }
};

/**
 * Handles the incoming request and sends the appropriate response.
 *
 * @param {Request} req - the incoming request object
 * @param {Response} res - the response object to send back
 * @param {IContext} context - the context object containing additional information
 * @param {string} proxyUrl - the URL to proxy the request to
 * @return {Promise<void>} a promise that resolves when the request is handled
 */
export const handleRequest = async(
  req: Request,
  res: Response,
  context: IContext,
  proxyUrl: string
) => {
  const axiosConfig = {
    method: req.method,
    url: proxyUrl + req.url,
    ...(!["get", "options"].includes(req.method.toLowerCase())
      ? { data: req.body }
      : {}),
    headers: {
      "Content-Type": "application/json",
      Cognito_auth: req.get("Cognito_auth"),
    },
    withCredentials: true,
  };
  try {
    const response = await axios(axiosConfig);
    const data = { ...response.data };
    if (context.patchFile[req.url]) {
      if (context.patchFile[req.url]?.path) {
        objectPath.set(
          data.data,
          context.patchFile[req.url].path!,
          context.patchFile[req.url].value
        );
      } else {
        data.data = context.patchFile[req.url].value as unknown;
      }
    }
    res.status(200).json(data);
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 404 && context.patchFile[req.url]) {
      const data = { data: {} };
      if (context.patchFile[req.url]?.path) {
        objectPath.set(
          data.data,
          context.patchFile[req.url].path!,
          context.patchFile[req.url].value
        );
      } else {
        data.data = context.patchFile[req.url].value as Record<
          string | number | symbol,
          never
        >;
      }
      res.status(200).json(data);
    }
    res.status(err.response?.status || 500).json(err.response?.data);
  }
};

/**
 * Updates the context with the configuration and patch file.
 *
 * @param {IContext} context - The context object to be updated.
 * @param {string} [CONFIG_FILE_NAME="proxy.config.json"] - The name of the configuration file. Default is "proxy.config.json".
 * @param {string} [PATCH_FILE_NAME="proxy.patch.json"] - The name of the patch file. Default is "proxy.patch.json".
 * @param {IProxyConfig} defaultConfig - The default configuration object.
 */
export const updateContext = async (
  context: IContext,
  CONFIG_FILE_NAME = "proxy.config.json",
  PATCH_FILE_NAME = "proxy.patch.json",
  defaultConfig: IProxyConfig
) => {
  try {
    context.config = JSON.parse(
      await Deno.readTextFile(join(Deno.cwd(), CONFIG_FILE_NAME))
    );
    context.config.verbose &&
      console.info(`Loaded config from ${green(CONFIG_FILE_NAME)}`);
  } catch (_e) {
    console.log(
      `Could not find ${red(CONFIG_FILE_NAME)}, creating default config`
    );
    context.config = defaultConfig;
  }
  try {
    context.patchFile = JSON.parse(
      await Deno.readTextFile(join(Deno.cwd(), PATCH_FILE_NAME))
    ) as IPatchFile;
    context.config.verbose &&
      console.info(`Loaded patches file from ${green(PATCH_FILE_NAME)}`);
  } catch (_e) {
    console.log(
      `Could not find ${red(PATCH_FILE_NAME)}, creating default patch config`
    );
    context.patchFile = {};
  }
};

/**
 * Watches the current working directory for file changes and calls the provided callback function.
 *
 * @param {() => void | Promise<void>} callback - The callback function to be called when a file change is detected.
 * @return {void | Promise<void>} - Returns void or a Promise that resolves to void.
 */
export const watch = async (callback: () => void | Promise<void>) => {
  const watcher = Deno.watchFs(join(Deno.cwd()));
  for await (const _ of watcher) {
    callback();
 }
}

/**
 * Logs the registered routes based on the provided context.
 *
 * @param {IContext} context - The context containing the configuration and other data.
 */
export const logRegisteredRoutes = (context: IContext) => {
  context.config.verbose &&
    Array.isArray(context.config.proxyUrl) &&
    console.info(
      `Registered endpoints: ${yellow(
        (context.config as unknown as IProxyConfig<"array">).proxyUrl
          .map((proxyUrl) => proxyUrl.endpoint)
          .join(", ")
      )} `
    );
  context.config.verbose &&
    typeof context.config.proxyUrl === "string" &&
    console.info(`Registered endpoint: ${yellow("/")}`);
  context.config.verbose &&
    getConfigUrlType(context.config) === "object" &&
    console.info(
      `Registered endpoint: ${yellow(
        (context.config as unknown as IProxyConfig<"object">).proxyUrl.endpoint
      )}`
    );
}