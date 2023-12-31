// test/server.test.js
// import { httpServer } from '../src/index';
import axios from "axios";
import * as database from "../src/db";
import { server, httpServer } from "../src/index";
import { expressMiddleware } from "@apollo/server/express4";
import app from "../src/app";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

beforeAll(async () => {
  async function startServer(): Promise<void> {
    await database.connect();
    await server.start();

    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req, res }) => ({
          req,
          res,
          apiRootUrl: `${req.protocol}://${req.get("host")}/`,
        }),
      })
    );

    // Modified server startup
    await new Promise<void>((resolve) =>
      httpServer.listen({ port: 4000 }, resolve)
    );
  }
  await startServer();
});

afterAll(() => {
  server.stop();
  httpServer.close();
});

describe("Server Health Check", () => {
  beforeEach(async () => {
    await server.start();
    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req, res }) => ({
          req,
          res,
          apiRootUrl: `${req.protocol}://${req.get("host")}/`,
        }),
      })
    );

    // Modified server startup
    await new Promise<void>((resolve) =>
      httpServer.listen({ port: 4000 }, resolve)
    );
    // }
  });
  afterEach(async () => {
    await server.stop();
    await httpServer.close();
  });
  it("should have a healthy HTTP server", async () => {
    // Perform health check for the HTTP server
    const httpServerResponse = await axios.get("http://localhost:4000/");

    expect(httpServerResponse.status).toBe(200);
    // httpServer.on(('listening'), () => {
    //     expect(httpServer.listening).toBe(true);
    // })
  });

  it("should have a healthy Apollo Server", async () => {
    // Perform health check for the Apollo Server
    const url = "http://localhost:4000/graphql?query=%7B__typename%7D";
    const headers = {
      headers: {
        "Apollo-Require-Preflight": true,
      },
    };
    const apolloServerResponse = await axios.get(url, headers);
    expect(apolloServerResponse.status).toBe(200);
    expect(apolloServerResponse.data).toHaveProperty("data");
  });
});
