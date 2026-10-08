import { graphql } from "msw/graphql";
import { setupServer } from "msw/node";
import { createClient } from "graphql-ws";

const api = graphql.link("http://localhost/graphql");

// Initial handler: expected to survive `resetHandlers()`.
const server = setupServer(
  api.subscription("OnTick", ({ subscription }) => {
    subscription.publish({ data: { tick: 1 } });
  }),
);
server.listen();

async function createConnectedGraphqlWsClient() {
  const client = createClient({ url: "ws://localhost/graphql", lazy: false });
  await new Promise((resolve) => client.on("connected", resolve));

  return client;
}

async function resetHandlersWithClientConnected() {
  const client = await createConnectedGraphqlWsClient();

  server.resetHandlers();

  /**
   * No matching handler.
   */
  client.subscribe(
    { query: "subscription OnTick { tick }" },
    { next: console.log, error: console.error, complete() {} },
  );
}

async function resetHandlersBeforeClientConnect() {
  server.resetHandlers();

  const client = await createConnectedGraphqlWsClient();

  /**
   * This one is matched correctly.
   */
  client.subscribe(
    { query: "subscription OnTick { tick }" },
    { next: console.log, error: console.error, complete() {} },
  );
}

await resetHandlersWithClientConnected();

await resetHandlersBeforeClientConnect();
