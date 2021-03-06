import {IRoute} from "express";
const debug = require("debug")('wsexpress-router');

export type Layer = {
    handle: Function;
    name: string;
    params?: any;
    path?: string;
    route?: IRoute;
    regexp?: RegExp;
};

export default class Router
{
    protected static routes: { [path: string]: Layer } = {};

    public static setRoutesFromStack (stack: Array<Layer>): void
    {
        stack.filter((layer) => layer.route && layer.route.path).map((layer: Layer) => {
            if (!layer.route || !layer.route.path) return;

            this.addRoute(layer);
        });
    }

    public static getRoutes (): { [path: string]: Layer}
    {
        return this.routes;
    }

    public static addRoute (layer: Layer): void
    {
        if (!layer.route) return;
        this.routes[layer.route.path] = layer;

        // @ts-ignore
        debug('booted route %s %s', layer.route.path, this.getRouteMethods(layer).join(','));
    }

    public static getRoute (path: string, method: string): Layer|null
    {
        const route = this.routes[path];
        if (!route) return null;

        const methods = this.getRouteMethods(route);
        return (methods.includes(method.toLowerCase())) ? route : null;
    }

    protected static getRouteMethods (route: Layer): Array<string>
    {
        /**
         * The `methods` attributes exists on the route, but is not present in the typings
         */
            // @ts-ignore
        const routeMethods: { [method: string]: boolean } = route.route?.methods || {};
        return Object.keys(routeMethods)
            .filter((method: string) => routeMethods[method])
            .map((method: string) => method.toLowerCase());
    }
}
