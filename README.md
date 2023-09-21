# Module Documentation: Proxy Configuration CLI

This module is a CLI (Command Line Interface) tool that allows you to configure a proxy server for forwarding requests to one or multiple URLs. It also provides the ability to patch the response data of the original request using configuration files. The configuration file should be named `proxy.config.json` or `proxy.[scope].config.json`, and the patch file should be named `proxy.patch.json` or `proxy.[scope].patch.json`. Both files should be located in the same folder as the CLI executable.

## Installation

To use this module, you need to have Node.js installed. You can install the CLI globally using deno:

```shell
deno install -A ./mod.ts
```

> Alternatively you can donwload the binary in the releases section of this repository and use it without installing deno.

## Usage

To use this module, navigate to the folder where the `proxy.config.json` or `proxy.[scope].config.json` file is located and run the following command:

```shell
deno task dev
```

### Configuration File

The configuration file (`proxy.config.json` or `proxy.[scope].config.json`) should be in JSON format and located in the same folder as the CLI executable. It should have the following structure:

```json
{
  "port": 3000,
  "proxyUrl": [
    { "url": "https://example.com", "endpoint": "/api" },
    { "url": "https://example2.com", "endpoint": "/api2" }
  ],
  "verbose": true
}
```

- `port`: The port number on which the proxy server will listen.
- `proxyUrl`: An array of objects representing the URLs to which the requests will be forwarded. Each object should have a `url` property specifying the URL and an `endpoint` property specifying the endpoint. Alternatively, you can specify a single URL as a string and request will be forwarded to `/`, this is usefull if only one url is proxied.
- `verbose` (optional): A boolean value indicating whether the proxy server should output verbose logs.

Examples of the `proxyUrl` property:

- Multiple URLs with endpoints:

```json
"proxyUrl": [
  { "url": "https://example.com", "endpoint": "/api" },
  { "url": "https://example2.com", "endpoint": "/api2" }
]
```

- Single URL with endpoint:

```json
"proxyUrl": { "url": "https://example.com", "endpoint": "/api" }
```

- Single URL without endpoint (defaults to "/"):

```json
"proxyUrl": "https://example.com"
```

### Patch File

The patch file (`proxy.patch.json` or `proxy.[scope].patch.json`) should also be in JSON format and located in the same folder as the CLI executable. It should have the following structure:

- Updating an entre array inside an object
```json
{

  "/api/data": {
    "path": "data.items",
    "value": [
      {
        "id": 1,
        "name": "John"
      },
      {
        "id": 2,
        "name": "Jane"
      }
    ]
  },

```
- Updating an entire array at root

```json
  "/api2/users": {
    "value": [
      {
        "id": 1,
        "name": "John Doe"
      },
      {
        "id": 2,
        "name": "Jane Doe"
      }
    ]
  },
```
- Updating a speciffic primitive value inside an object at an array postion
```json
  "/api/users": {
    "path": "0.name",
    "value": "Updated Name"
  },

```

- Or updating the entire array position
```json
  "/api/users": {
    "path": "0",
    "value": {
      "id": 3,
      "name": "New User"
    }
  }
}
```

- The keys represent the `routes` paths that need to be patched.
  Each value object should have a `path` property (optional) specifying the path to the value that needs to be patched in the response data, a `value` property specifying the value that should be used to patch the response data, and a `method` property (optional) specifying the HTTP method of the request that should be patched. If the `method` property is not specified, the patch will be applied to all methods.

**Here are some extra examples of patch entries:**

- Patching an array of objects:

```json
"/api/data": {
  "path": "items",
  "value": [
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ]
}
```

- Patching an array position using dot notation in the path:

```json
"/api/data": {
  "path":"items.2",
  "value": { "id": 3, "name": "Bob" }
}
```
- Patching an entire object:

```json
"/api/user/1234": {
  "value": {
    "id": 3,
    "name": "Patched user"
  }
}
```

- Patching a property inside an object

```json
"/api/user/1234": {
  "path": "name",
  "value": "Patched user"
}
```

### Environment Configuration

You can also define the configuration scope using an environment variable. For example, you can create a `.env` file in the same folder as the CLI executable with the following content:

```
CONFIG_SCOPE=multiple
```

This will set the configuration scope to `multiple`, and the CLI will look for the configuration and patch files with the `[scope]` suffix (e.g., `proxy.multiple.config.json` and `proxy.multiple.patch.json`).

## Conclusion

The Proxy Configuration CLI provides a convenient way to configure a proxy server for forwarding requests and patching response data. By using the configuration and patch files in the specified format, you can easily define the proxy URLs and modify the response data according to your needs.

