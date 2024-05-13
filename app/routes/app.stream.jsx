import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  TextField,
} from "@shopify/polaris";
import { useState, useEffect, useMemo } from "react";

import { useEventSource, EventSourceProvider } from "remix-utils/sse/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return json({ url: process.env.SSE_URL });
};

export default function Index() {
  const { url } = useLoaderData();

  const map = useMemo(() => new Map(), []);

  const [message, setMessage] = useState("");

  const event = useEventSource(url);

  useEffect(() => {
    function handleData() {
      if (event) {
        console.log("event", event);
        const data = JSON.parse(event);
        if (data.event === "end") {
          console.log("disconnecting...");
          map.forEach((value, key) => {
            value.source.close(); // close each EventSource
          });
          map.clear();
          setTimeout(() => {
            setMessage("");
          }, 2000);
        } else {
          setMessage((prevMessage) => prevMessage + data.message);
        }
      }
    }

    handleData();
  }, [event, map, setMessage]);

  return (
    <Page>
      <ui-title-bar title="Stream"></ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Streaming Output
                </Text>
                <EventSourceProvider value={map}>
                  <TextField
                    value={message}
                    multiline="true"
                    autoComplete="off"
                  />
                </EventSourceProvider>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
