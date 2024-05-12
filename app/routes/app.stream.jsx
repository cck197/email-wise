import { Card, Layout, Page, Text, BlockStack } from "@shopify/polaris";
import { useMemo } from "react";

import { useEventSource } from "remix-utils/sse/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return json({ url: process.env.SSE_URL });
};

export default function Index() {
  const { url } = useLoaderData();

  const time = useEventSource(url);
  const time2 = useMemo(() => {
    return time ? JSON.parse(time).time : null;
  }, [time]);

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
                {time2 && <Text>Time: {time2}</Text>}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
