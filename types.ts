interface IProxyUrl {
    url: string
    endpoint: string
}

type ProxyUrlTypes = 'string' | 'array' | 'object'

export interface IProxyConfig<T extends ProxyUrlTypes = 'string'> {
    port: number,
    proxyUrl: T extends 'string' ? string : T extends 'array' ? IProxyUrl[] : IProxyUrl,
    verbose?: boolean
}

export interface IPatchFile {
    [key: string]: {
        path?: string,
        value: unknown,
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
    }
}