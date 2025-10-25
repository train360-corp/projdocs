declare global {

  type RouteHandler = (request: Request) => Promise<Response>;

}

export {};