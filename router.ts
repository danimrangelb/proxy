//@deno-types="npm:@types/express"
import { Router } from "npm:express";
import { IContext, IProxyConfig } from "./types.ts";
import { getConfigUrlType, handleRequest } from "./helpers.ts";

const router = Router();

export const routerFactory = (
    context: IContext
  ): Router => {
    const proxyUrlType = getConfigUrlType(context.config);
    if (proxyUrlType === "array") {
      const typedConfig = context.config as unknown as IProxyConfig<"array">;
      const internalRouters = typedConfig.proxyUrl.map((proxyUrl) => {
        return router.use(proxyUrl.endpoint, async (req, res) => {
          await  handleRequest(req, res, context, proxyUrl.url);
        });
      });
      router.use(...internalRouters);
    } else if (proxyUrlType === "object") {
      const typedConfig = context.config as unknown as IProxyConfig<"object">;
      const internalRouter = router.use(typedConfig.proxyUrl.endpoint, async (req, res) => {
        await handleRequest(req, res, context, typedConfig.proxyUrl.url);
      });
      router.use(internalRouter);
    } else {
      const typedConfig = context.config as unknown as IProxyConfig<"string">;
      router.use(async (req, res) => {
        await handleRequest(req, res, context, typedConfig.proxyUrl);
      });
    }
  
    return router;
  };
  