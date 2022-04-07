import {Application, NextFunction, Request, RequestHandler, Response} from "express";
import Router from "./router";
import Server from "./websocket/server";

export type wsExpressParameters = {
    app: Application;
}

export const wsExpress = (params: wsExpressParameters): RequestHandler => {
    Router.setRoutesFromStack(params.app._router.stack);
    return (req: Request, res: Response, next: NextFunction) => {
        next();
    };
};

export const listen = (params: wsExpressParameters, port: number, callback?: (() => void)): void => {
    const httpServer = params.app.listen(port, callback);
    Server.initialize(params.app, httpServer);
};
