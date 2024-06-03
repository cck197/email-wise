import { Card, Text, BlockStack } from "@shopify/polaris";

export function MessageCard(title, message) {
  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          <Text as="p" variant="bodyMd">
            {message}
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
