//@deno-types="npm:@types/express"
import { Router } from "npm:express";
import { IPatchFile, IProxyConfig } from "./types.ts";
import axios, { AxiosError } from "npm:axios";
//@deno-types="npm:@types/object-path"
import objectPath from "npm:object-path";

export const getConfigUrlType = (config: IProxyConfig) => {
  if (Array.isArray(config.proxyUrl)) {
    return "array";
  } else if (typeof config.proxyUrl === "string") {
    return "string";
  } else {
    return "object";
  }
};

const router = Router();

export const routerFactory = (
  config: IProxyConfig,
  patchFile: IPatchFile
): Router => {
  const proxyUrlType = getConfigUrlType(config);
  if (proxyUrlType === "array") {
    const typedConfig = config as unknown as IProxyConfig<"array">;
    const internalRouters = typedConfig.proxyUrl.map((proxyUrl) => {
      return router.use(proxyUrl.endpoint, async (req, res) => {
        const axiosConfig = {
          method: req.method,
          url: proxyUrl.url + req.url,
          ...(!["get", "options"].includes(req.method.toLowerCase()) ? { data: req.body } : {}),
          headers: {
            "Content-Type": "application/json",
            Cognito_auth: req.get("Cognito_auth"),
          },
          withCredentials: true,
        };
        try {
          const response = await axios(axiosConfig);
          const data = { ...response.data };
          if (patchFile[req.url]) {
            if (patchFile[req.url]?.path) {
              objectPath.set(
                data.data,
                patchFile[req.url].path!,
                patchFile[req.url].value
              );
            } else {
              data.data = patchFile[req.url].value as unknown;
            }
          }
          res.status(200).json(data);
        } catch (error) {
          const err = error as AxiosError;
          if (err.response?.status === 404 && patchFile[req.url]) {
            const data = { data: {} };
            if (patchFile[req.url]?.path) {
              objectPath.set(
                data.data,
                patchFile[req.url].path!,
                patchFile[req.url].value
              );
            } else {
              data.data = patchFile[req.url].value as Record<string | number | symbol, never>;
            }
            res.status(200).json(data);
          }
          res.status(err.response?.status || 500).json(err.response?.data);
        }
      });
    });
    router.use(...internalRouters);
  } else if (proxyUrlType === "object") {
    const typedConfig = config as unknown as IProxyConfig<"object">;
    const internalRouter = router.use(typedConfig.proxyUrl.endpoint, async (req, res) => {
      const axiosConfig = {
        method: req.method,
        url: typedConfig.proxyUrl.url + req.url,
        ...(!["get", "options"].includes(req.method.toLowerCase()) ? { data: req.body } : {}),
        headers: {
          "Content-Type": "application/json",
          Cognito_auth: req.get("Cognito_auth"),
        },
        withCredentials: true,
      };
      try {
        const response = await axios(axiosConfig);
        const data = { ...response.data };
        if (patchFile[req.url]) {
          if (patchFile[req.url]?.path) {
            objectPath.set(
              data.data,
              patchFile[req.url].path!,
              patchFile[req.url].value
            );
          } else {
            data.data = patchFile[req.url].value as Record<string | number | symbol, never>;
          }
        }
        res.status(200).json(data);
      } catch (error) {
        const err = error as AxiosError;
        if (err.response?.status === 404 && patchFile[req.url]) {
          const data = { data: {} };
          if (patchFile[req.url]?.path) {
            objectPath.set(
              data.data,
              patchFile[req.url].path!,
              patchFile[req.url].value
            );
          } else {
            data.data = patchFile[req.url].value as Record<string | number | symbol, never>;
          }
          res.status(200).json(data);
        }
        res.status(err.response?.status || 500).json(err.response?.data);
      }
    });
    router.use(internalRouter);
  } else {
    const typedConfig = config as unknown as IProxyConfig<"string">;
    router.use(async (req, res) => {
      const axiosConfig = {
        method: req.method,
        url: typedConfig.proxyUrl + req.url,
        ...(!["get", "options"].includes(req.method.toLowerCase()) ? { data: req.body } : {}),
        headers: {
          "Content-Type": "application/json",
          Cognito_auth: req.get("Cognito_auth"),
        },
        withCredentials: true,
      };
      try {
        const response = await axios(axiosConfig);
        const data = { ...response.data };
        if (patchFile[req.url]) {
          if (patchFile[req.url]?.path) {
            objectPath.set(
              data.data,
              patchFile[req.url].path!,
              patchFile[req.url].value
            );
          } else {
            data.data = patchFile[req.url].value as Record<string | number | symbol, never>;
          }
        }
        res.status(200).json(data);
      } catch (error) {
        const err = error as AxiosError;
        if (err.response?.status === 404 && patchFile[req.url]) {
          const data = { data: {} };
          if (patchFile[req.url]?.path) {
            objectPath.set(
              data.data,
              patchFile[req.url].path!,
              patchFile[req.url].value
            );
          } else {
            data.data = patchFile[req.url].value as Record<string | number | symbol, never>;
          }
          res.status(200).json(data);
        }
        res.status(err.response?.status || 500).json(err.response?.data);
      }
    });
  }

  return router;
};
