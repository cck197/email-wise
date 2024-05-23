import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { authenticate } from "/app/shopify.server";
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
import {
  getEmailGenerators,
  getSettings,
} from "/app/models/EmailGenerator.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const generators = await getEmailGenerators(session.shop, admin.graphql);
  const settings = await getSettings(session.shop);

  return json({
    generators,
    settings,
  });
}

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
      { title: "Product" },
      { title: "Subject" },
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
        <Link to={`generators/${generator.id}`}>
          {truncate(generator.productTitle)}
        </Link>
      )}
    </IndexTable.Cell>
    <IndexTable.Cell>{truncate(generator.Email[0]?.name)}</IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(generator.createdAt).toDateString()}
    </IndexTable.Cell>
  </IndexTable.Row>
);

const EmptyGeneratorState = ({ onAction, label }) => (
  <EmptyState
    heading="Generate sales emails for your product"
    action={{
      content: label,
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Use AI to generate more revenue per email.</p>
  </EmptyState>
);

export default function Index() {
  const { generators, settings } = useLoaderData();
  const navigate = useNavigate();

  if (!settings) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card padding="0">
              <EmptyGeneratorState
                onAction={() => navigate("/app/settings")}
                label={
                  "Click here to check a couple of settings to get started"
                }
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <ui-title-bar title="Emails">
        <button
          variant="primary"
          onClick={() => navigate("/app/generators/new")}
        >
          Create Email
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {generators.length === 0 ? (
              <EmptyGeneratorState
                onAction={() => navigate("generators/new")}
                label={"Create Email"}
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
