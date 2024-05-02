import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
  Text,
  Icon,
  InlineStack,
} from "@shopify/polaris";

import { AlertDiamondIcon, ImageIcon } from "@shopify/polaris-icons";
import { getEmailGenerators } from "../models/EmailGenerator.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const generators = await getEmailGenerators(session.shop, admin.graphql);

  return json({
    generators,
  });
}

const EmptyGeneratorState = ({ onAction }) => (
  <EmptyState
    heading="Generate sales emails for your product"
    action={{
      content: "Create Email Generator",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Use AI to generate more revenue per email.</p>
  </EmptyState>
);

function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

const EmailGeneratorTable = ({ generators }) => (
  <IndexTable
    resourceName={{
      singular: "Email Generator",
      plural: "Email Generators",
    }}
    itemCount={generators.length}
    headings={[
      { title: "Thumbnail", hidden: true },
      { title: "Title" },
      { title: "Product" },
      { title: "Email Provider" },
      { title: "AI Provider" },
      { title: "Date created" },
    ]}
    selectable={false}
  >
    {generators.map((generator) => (
      <EmailGeneratorTableRow key={generator.id} generator={generator} />
    ))}
  </IndexTable>
);

const EmailGeneratorTableRow = ({ generator }) => (
  <IndexTable.Row id={generator.id} position={generator.id}>
    <IndexTable.Cell>
      <Thumbnail
        source={generator.productImage || ImageIcon}
        alt={generator.productTitle}
        size="small"
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`generators/${generator.id}`}>{truncate(generator.name)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {generator.productDeleted ? (
        <InlineStack align="start" gap="200">
          <span style={{ width: "20px" }}>
            <Icon source={AlertDiamondIcon} tone="critical" />
          </span>
          <Text tone="critical" as="span">
            product has been deleted
          </Text>
        </InlineStack>
      ) : (
        truncate(generator.productTitle)
      )}
    </IndexTable.Cell>
    <IndexTable.Cell>{generator.emailProvider}</IndexTable.Cell>
    <IndexTable.Cell>{generator.llmProvider}</IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(generator.createdAt).toDateString()}
    </IndexTable.Cell>
  </IndexTable.Row>
);

export default function Index() {
  const { generators } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page>
      <ui-title-bar title="Email Generators">
        <button
          variant="primary"
          onClick={() => navigate("/app/generators/new")}
        >
          Create Email Generator
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {generators.length === 0 ? (
              <EmptyGeneratorState
                onAction={() => navigate("generators/new")}
              />
            ) : (
              <EmailGeneratorTable generators={generators} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
