# WsExpress

Easily integrate WebSockets into your ExpressJS application.

1. [Installation](#installation)
2. [Usage](#usage)
3. [Making Requests](#making-requests)
   1. [Standard Route Requests](#standard-route-requests)
   2. [Subscription Requests](#subscription-requests)
4. [Response](#response)
5. [Broadcasting](#broadcasting)
   1. [Limitations](#limitations)
6. [Debugging](#debugging)
7. [Testing and Linting](#testing-and-linting)

---

# Installation

#### yarn
```
yarn add wsexpress
```

#### npm
```
npm install wsexpress
```

# Usage

```typescript
import {Request, Response} from "express";
import {wsExpress, listen} from "wsexpress";
const express = require("express");

// Create express application
const app = express();

// Use the wsExpress middleware in your Express application
// Pass the `app` to the wsExpress middleware
app.use(wsExpress({ app }));

// Define your routes
app.get('/', (request: Request, response: Response) => {
    response.status(200).send();
});

// Use the wsExpress middleware's `listen` function to start the HTTP server
// Pass the `app` to the `listen` function
listen({ app }, 8080, () => {
    console.log('listening');
});
```

### Intermediate HTTP Request Handler

The middleware returns an "intermediate" HTTP request handler - this is simply
to satisfy the Express app's `use` method. This request handler simply forwards
the incoming HTTP request to the next route in the stack using `next()`. You
may use your own request handler if you'd like, supply it in the configuration
object passed to `wsExpress()`:
```typescript
app.use(wsExpress({
    app,
    requestHander: (request: Request, response: Response, next: NextFunction) => {
        // Your handler
    },
}))
```

## The `wsExpress` Middleware

The middleware handles two major components of the request lifecycle:
1. Handling WS upgrade requests
2. Routing WS messages

The middleware will first process an upgrade request to create a websocket
client connection. Once the client sends a message, the middleware will route
that message to the appropriate Express route.

At this point Express takes over briefly, running the logic within the route
then calling methods on the `response` object to ultimately generate a response
to the client.

The middleware overrides the `response` object's `send` method - "hijacking" it
to send the response's body to the websocket client.

### The `listen` function

This package includes a `listen` function intended to replace the `app.listen`
call that is normally used with Express applications. This is because the WebSocket
server needs the `http.Server` instance that is returned _only_ when `app.listen`
is called.

The `listen` function is nearly identical to the `app.listen` method, except it
requires a configuration object to be passed in, including the `app`:
```typescript
listen(
    { app }, // The Express application
    8080, // Port to listen on
    () => {
        // Callback
    }
);
```

### Connecting to the WebSocket Server

The WS server can be reached on the same port as the Express application, and
does not require a special path.

# Making Requests

In order to easily lookup and process Express routes, the middleware requires
that WS messages are sent in a standardized format:

```typescript
interface ClientMessage {
    type: 'route' | 'subscription';
    message: ClientRouteMessage|ClientSubscriptionMessage
}

interface ClientRouteMessage
{
    route: string;
    method: 'get'|'post'|'put'|'delete'|'patch';
    body?: any;
}

interface ClientSubscriptionMessage
{
    eventName: string;
    subscriptionId?: string;
}
```

## Standard Route Requests
You may make standard route requests - such as get, post, put, etc - to Express
endpoints and receive the response that would be returned in an HTTP request. To
make these requests, use the `ClientRouteMessage` schema:

### `route`

The path to request. This should be the same path that you would request from
your HTTP server. For example, if a status page is located at `/status`, then
the `route` should be `/status`.

### `method`

The method the request is made with. This is purely organizational, since
websockets do not use HTTP methods. This is used to look up the correct Express
route to call, since there may be multiple methods associated with the same
path, each with their own set of logic.

### Sample Request
```
{
    "type": "route",
    "message": {
        "method": "POST",
        "route": "/",
        "body": {
            "key": "value"
        }
    }
}
```

## Subscription Requests
A websocket client may wish to subscribe to backend events and have data _pushed_
from the API, rather than the classic "pull via request" model of HTTP requests and
the Standard Route Requests. To make these requests, use the `ClientSubscriptionMessage`
schema:

### `eventName`
The name of the event to subscribe to. This will depend on your implementation
and what your application may broadcast.

### `subscriptionId`
Optional. You may wish to further scope the subscription to an "ID". This will
just be used to fetch the subscription when data is broadcast on the associated
`eventName`. This may be used if you don't want to get _all_ events for a given
name, but only want to receive events with a certain `subscriptionId` attached.

### Sample Request
```
{
    "type": "subscription",
    "message": {
        "eventName": "some-event",
        "subscriptionId": "optional-id"
    }
}
```

## Response

Responses are also in a standard format:
```typescript
interface ClientResponse
{
    request: ClientMessage;
    response: {
        status: number;
        body?: any;
    },
}
```

### `request`

This is a copy of the original message sent by the client.

### `response.status`

The status code that was set by the Express route.

### `response.body`

The body that was sent by the Express route. This attribute may be `undefined`.

# Broadcasting
The selling point of websockets is their bidirectional nature. Emulating the
basic HTTP request lifecycle - request and response - only goes so far, and the
true power of websockets lies in the ability to broadcast to connected clients.

WsExpress provides a `broadcast` function that will send a message to all
subscribed clients.

```typescript
import {broadcast} from "wsexpress";

broadcast(
    'eventName',
    {}, // Payload to send
    'subscriptionId' // Optional
);
```

The payload is sent to all clients subscribed to the provided event name, and
optional subscription ID. The payload will be sent in the
[standard response format](#response):
```
{
    "request": {}, // The original subscription request
    "response": {
        "status": 200, // Will always be 200
        "body": {} // The payload that was broadcasted
    }
}
```
In this case the `request` that is returned will always be the original subscription
request - that is, the request that the client sent to add the subscription in the
first place.

### Limitations
If your API runs in a multi-instance environment, you will have issues with broadcasting.
The reason for this is that websocket clients are connected to only one server
at a time. The `ConnectionManager` which is responsible for handling broadcasts will
only have a list of clients that are connected to its specific server - it has
no knowledge of the clients connected to other servers in a cluster for example.

Therefore, you should attempt to execute `broadcast` on all servers in a cluster
so that all connected clients will receive the event payload. This can be done in
many ways, one of which being queued jobs.

---

# Debugging

There are multiple `debug` scenarios:
* `wsexpress-http` - logs requests to the intermediate HTTP request handler
* `wsexpress-server` - logs upgrade requests and route handling events
* `wsexpress-client` - logs client message events
* `wsexpress-connections` - logs client connect/disconnect events

### Watching all debug events
```
DEBUG=wsexpress-* node .
```

### Watching select events
```
DEBUG=wsexpress-http,wsexpress-server node .
```

# Testing and Linting

### Run Tests
```
yarn test
```

### Run eslint
```
yarn lint
yarn lint:fix # Fixes lint errors
```