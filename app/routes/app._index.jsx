import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { authenticate } from "/app/shopify.server";
import {
  Card,
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
  ALLOW_NO_LLM_PROVIDER,
} from "/app/models/EmailGenerator.server";
import { hasActiveSubscription } from "../models/Subscription.server";

export async function loader({ request }) {
  const { admin, session, redirect } = await authenticate.admin(request);
  if (!(await hasActiveSubscription(admin.graphql))) {
    return redirect("/app/billing");
  }
  const settings = await getSettings(session.shop);
  if (!settings && !ALLOW_NO_LLM_PROVIDER) {
    return redirect("/app/settings");
  }
  const generators = await getEmailGenerators(session.shop, admin.graphql);
  if (generators.length === 0) {
    return redirect("/app/generators/new");
  }

  return json({
    generators,
  });
}

function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

function removeSubjectPrefix(str) {
  return str.replace(/\[.*?\]/g, "");
}

const EmailGeneratorTable = ({ generators }) => (
  <IndexTable
    resourceName={{
      singular: "Email",
      plural: "Emails",
    }}
    itemCount={generators.length}
    headings={[
      { title: "Thumbnail", hidden: true },
      { title: "Product" },
      { title: "Preview" },
      { title: "Date" },
    ]}
    selectable={false}
    pagination={{
      hasNext: true,
      onNext: () => {},
    }}
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
    <IndexTable.Cell>
      {truncate(removeSubjectPrefix(generator.Email[0]?.text))}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(
        generator.Email[0]?.createdAt || generator.createdAt,
      ).toDateString()}
    </IndexTable.Cell>
  </IndexTable.Row>
);

export default function Index() {
  const { generators } = useLoaderData();
  const navigate = useNavigate();

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
            <EmailGeneratorTable generators={generators} />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
