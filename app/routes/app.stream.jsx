import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  TextField,
  Button,
} from "@shopify/polaris";
import { useState, useEffect, useRef } from "react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({ baseUrl: process.env.SSE_URL });
};

export default function Index() {
  const { baseUrl } = useLoaderData();
  const [message, setMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!isConnected || !inputValue.trim()) {
      return;
    }

    const fullUrl = `${baseUrl}/${encodeURIComponent(inputValue)}`;

    if (!eventSourceRef.current) {
      const eventSource = new EventSource(fullUrl);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "end") {
          console.log("Disconnecting...");
          eventSource.close();
          setIsConnected(false);
          eventSourceRef.current = null;
        } else {
          setMessage((prevMessage) => prevMessage + data.message);
        }
      };

      return () => {
        eventSource?.close();
        eventSourceRef.current = null;
      };
    }
  }, [isConnected, baseUrl, inputValue]);

  const toggleConnection = () => {
    if (isConnected) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      setMessage("");
    } else {
      setMessage("");
      setIsConnected(true);
    }
  };

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
                  label="Event Source URL Path"
                  value={inputValue}
                  onChange={setInputValue}
                  autoComplete="off"
                />
                <Button onClick={toggleConnection}>
                  {isConnected ? "Disconnect from Stream" : "Connect to Stream"}
                </Button>
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
