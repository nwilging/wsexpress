import {Express, NextFunction, Request, RequestHandler, Response} from "express";
import Router from "./router";
import Server from "./websocket/server";
const debug = require("debug")('wsexpress-http');

export type wsExpressParameters = {
    app: Express;
    requestHandler?: RequestHandler;
}

export const wsExpress = (params: wsExpressParameters): RequestHandler => {
    Router.setRoutesFromStack(params.app._router.stack);
    return params.requestHandler || ((req: Request, res: Response, next: NextFunction) => {
        debug('http request %s %s', req.method, req.path);
        next();
    });
};

export const listen = (params: wsExpressParameters, port: number, callback?: (() => void)): void => {
    const httpServer = params.app.listen(port, callback);
    Server.initialize(params.app, httpServer);
};
