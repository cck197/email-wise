import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  TextField,
} from "@shopify/polaris";
import { useState, useEffect, useRef } from "react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({ url: process.env.SSE_URL });
};

export default function Index() {
  const { url } = useLoaderData();
  const [message, setMessage] = useState("");
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "end") {
        console.log("disconnecting...");
        eventSource.close();
      } else {
        setMessage((prevMessage) => prevMessage + data.message);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

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
                <TextField
                  value={message}
                  multiline="true"
                  autoComplete="off"
                  readOnly={true}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
