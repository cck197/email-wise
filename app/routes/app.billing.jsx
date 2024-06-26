import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Text, Card, Button, BlockStack } from "@shopify/polaris";
import { authenticate, BILLING_OPTS } from "../shopify.server";
import {
  getSubscriptionStatus,
  createSubscriptionMetafield,
} from "../models/Subscription.server";

import banner from "../public/banners/5.png";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  if (!admin) {
    return;
  }

  /*
    Note:  If you wanted to apply the subscription check to all routes 
    and not just index you could use this logic in app.jsx in the loader instead.
    I'm just returning the data but you could redirect a use to take out a plan
    if not subscribed using the billing.require method in the action function
    */
  const subscriptions = await getSubscriptionStatus(admin.graphql);
  const { activeSubscriptions } = subscriptions.data.app.installation;

  // console.log("activeSubscriptions", activeSubscriptions);
  if (activeSubscriptions.length > 0) {
    if (activeSubscriptions[0].status === "ACTIVE") {
      await createSubscriptionMetafield(admin.graphql, "true");
    } else {
      await createSubscriptionMetafield(admin.graphql, "false");
    }
  }

  return json({ activeSubscriptions, billing: BILLING_OPTS });
};

export const action = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const data = {
    ...Object.fromEntries(await request.formData()),
  };
  const action = data.action;
  const isTest = process.env.LIVE_BILLING !== "true"; // TODO

  if (!action) {
    return null;
  }

  if (data.cancel) {
    const billingCheck = await billing.require({
      plans: [action],
      onFailure: async () => billing.request({ plan: action }),
    });
    const subscription = billingCheck.appSubscriptions[0];
    await billing.cancel({
      subscriptionId: subscription.id,
      isTest: isTest,
      prorate: true,
    });
  } else {
    await billing.require({
      plans: [action],
      isTest: isTest,
      onFailure: async () => billing.request({ plan: action, isTest: isTest }),
      returnUrl: `https://${shop}/admin/apps/emailwise-debug/app`, // TODO
    });
  }

  return null;
};

const PlanCard = ({
  name,
  plan,
  hasSubscription,
  activeSubscriptions,
  handlePurchaseAction,
  handleCancelAction,
}) => (
  <Layout.Section variant="oneThird">
    <Card>
      <Text as="h2" variant="headingMd">
        {name} Plan
      </Text>
      <Text>
        <b>Cost</b>: ${plan.amount}
      </Text>
      <Text>
        <b>Billing:</b> {plan.interval.toLowerCase().replace(/_/g, " ")}
      </Text>
      <Text>
        <b>Free Trial</b>: {plan.trialDays} days
      </Text>
      <div style={{ height: "15px" }} />
      {!hasSubscription && (
        <Button onClick={() => handlePurchaseAction(name)} variant="primary">
          Purchase {name} Plan
        </Button>
      )}
      {hasSubscription && activeSubscriptions[0].name === name && (
        <Button
          onClick={() => handleCancelAction(name)}
          variant="primary"
          tone="critical"
        >
          Cancel {name} Plan
        </Button>
      )}
    </Card>
  </Layout.Section>
);

export default function Index() {
  const { activeSubscriptions, billing } = useLoaderData();
  const submit = useSubmit();
  const hasSubscription = activeSubscriptions.length == 0 ? false : true;

  const handlePurchaseAction = (subscription) => {
    // This sends a subscription request to our action function
    submit({ action: subscription }, { method: "post" });
  };

  const handleCancelAction = (subscription) => {
    submit({ action: subscription, cancel: true }, { method: "post" });
  };

  return (
    <Page>
      <ui-title-bar title="Billing"></ui-title-bar>
      {activeSubscriptions.length === 0 && (
        <>
          <BlockStack gap="400">
            <Layout>
              <Layout.Section>
                <img
                  alt=""
                  width="100%"
                  height="100%"
                  style={{
                    borderRadius: "10px",
                    width: "100%",
                  }}
                  src={banner}
                />
              </Layout.Section>
            </Layout>
          </BlockStack>
          <div style={{ marginTop: "15px" }} />
        </>
      )}
      <BlockStack gap="400">
        <Layout>
          {Object.entries(billing).map(([name, plan]) => (
            <PlanCard
              key={name}
              name={name}
              plan={plan}
              hasSubscription={hasSubscription}
              activeSubscriptions={activeSubscriptions}
              handlePurchaseAction={handlePurchaseAction}
              handleCancelAction={handleCancelAction}
            />
          ))}
        </Layout>
      </BlockStack>
    </Page>
  );
}
