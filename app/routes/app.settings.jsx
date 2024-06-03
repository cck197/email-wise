import { useState, useCallback, useEffect } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "/app/shopify.server";
import {
  Card,
  Layout,
  Page,
  Text,
  TextField,
  BlockStack,
  PageActions,
  Select,
  useBreakpoints,
  InlineGrid,
  Box,
  Divider,
  Banner,
} from "@shopify/polaris";
import { MessageCard } from "./common";
import {
  getLLMProviders,
  getEmailProviders,
  validateSettings,
  saveSettings,
  getSettings,
} from "/app/models/EmailGenerator.server";
import { hasActiveSubscription } from "../models/Subscription.server";

export async function loader({ request }) {
  const { session, redirect, admin } = await authenticate.admin(request);
  if (!(await hasActiveSubscription(admin.graphql))) {
    return redirect("/app/billing");
  }
  const settings = await getSettings(session.shop);
  const lLMProviders = await getLLMProviders();
  const emailProviders = await getEmailProviders();

  return json({
    settings: settings
      ? settings
      : {
          id: "new",
          emailKey: "",
          lLMKey: "",
          brand: "",
          emailProviderId: emailProviders[0].value,
          lLMProviderId: lLMProviders[0].value,
        },
    lLMProviders,
    emailProviders,
  });
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = Object.fromEntries(await request.formData());
  const { emailProviderId, lLMProviderId } = formData;

  const data = {
    ...formData,
    shop,
    emailProviderId: parseInt(emailProviderId),
    lLMProviderId: parseInt(lLMProviderId),
  };

  const errors = validateSettings(data);
  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const result = await saveSettings(data);
  if (result) {
    return json({ result: result });
  }
  // There's something about Remix I don't understand here. This function
  // shouldn't be called unless there's a request other than GET, i.e. when the
  // form is submitted. However, removing the redirect here prevents the
  // settings page from loading at all, instead the app redirects to the home
  // page.
  return redirect("/app/settings");
}

export default function SettingsForm() {
  const actionData = useActionData();

  const { lLMKey: lLMKeyResult, emailKey: emailKeyResult } =
    actionData?.result || {};

  const errors = actionData?.errors || {};

  const { settings, lLMProviders, emailProviders } = useLoaderData();
  const [formState, setFormState] = useState(settings);
  const [cleanFormState, setCleanFormState] = useState(settings);
  // const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const [isDirty, setIsDirty] = useState(false);
  const { smUp } = useBreakpoints();

  const nav = useNavigation();
  const isSaving = nav.state === "submitting";

  const handleProviderChange = useCallback(
    (value, setStateFunction, stateKey) => {
      const parsedValue = parseInt(value, 10);
      if (!isNaN(parsedValue)) {
        setStateFunction((prevState) => ({
          ...prevState,
          [stateKey]: parsedValue,
        }));
      } else {
        // Handle case where parsed value is NaN
        console.error("received NaN value for provider ID");
      }
    },
    [],
  );

  const submit = useSubmit();
  function handleSave() {
    const data = {
      emailProviderId: formState?.emailProviderId || emailProviders[0].value,
      lLMProviderId: formState?.lLMProviderId || lLMProviders[0].value,
      emailKey: formState?.emailKey,
      lLMKey: formState?.lLMKey,
      brand: formState?.brand,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  useEffect(() => {
    setIsDirty(JSON.stringify(formState) !== JSON.stringify(cleanFormState));
  }, [formState, cleanFormState]);

  const isNew = settings.id === "new";

  return (
    <Page>
      <ui-title-bar title="Settings"></ui-title-bar>
      <Layout>
        <Layout.Section>
          {isNew
            ? MessageCard(
                "Welcome to EmailWise!",
                "Setting up EmailWise is easy. First, you can tell us about your company brand and integrate your email provider. Then select your AI provider, and you'll be ready to start earning more money for each email you send.",
              )
            : MessageCard(
                "You're all set!",
                "Go to the New menu item on the left to select a product and generate a sales email.",
              )}
        </Layout.Section>
        <div style={{ marginTop: "15px" }} />
        <Layout.Section>
          <BlockStack gap={{ xs: "800", sm: "400" }}>
            {lLMKeyResult?.success && (
              <Banner tone="success">
                Successfully updated AI Integration
              </Banner>
            )}
            {lLMKeyResult?.error && (
              <Banner tone="critical">{lLMKeyResult.error}</Banner>
            )}
            {emailKeyResult?.success && (
              <Banner tone="success">{emailKeyResult.success}</Banner>
            )}
            {emailKeyResult?.error && (
              <Banner tone="critical">{emailKeyResult.error}</Banner>
            )}
            <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
              <Box
                as="section"
                paddingInlineStart={{ xs: 400, sm: 0 }}
                paddingInlineEnd={{ xs: 400, sm: 0 }}
              >
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    1. Brand (optional)
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Describe your fundamental purpose, cause or belief system
                    that inspires employees and resonates with customers so
                    EmailWise can align.
                  </Text>
                </BlockStack>
              </Box>
              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <TextField
                    id="brand"
                    label="About your brand (optional)"
                    helpText=""
                    autoComplete="off"
                    multiline={4}
                    value={formState?.brand}
                    onChange={(brand) => setFormState({ ...formState, brand })}
                    error={errors.brand}
                  />
                </BlockStack>
              </Card>
            </InlineGrid>
            {smUp ? <Divider /> : null}
            <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
              <Box
                as="section"
                paddingInlineStart={{ xs: 400, sm: 0 }}
                paddingInlineEnd={{ xs: 400, sm: 0 }}
              >
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    2. Email Integration (optional)
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Adding an email integration enables EmailWise to create new
                    emails that match your existing campaigns in tone, mood,
                    style, syntax, and perspective.
                  </Text>
                </BlockStack>
              </Box>
              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <Select
                    label="Select your provider"
                    options={emailProviders}
                    onChange={(emailProviderId) =>
                      setFormState({ ...formState, emailProviderId })
                    }
                    value={formState?.emailProviderId?.toString()}
                    error={errors.emailProviderId}
                  />
                  <TextField
                    id="emailKey"
                    helpText=""
                    label="Private API key (optional)"
                    autoComplete="off"
                    value={formState?.emailKey}
                    onChange={(emailKey) =>
                      setFormState({ ...formState, emailKey })
                    }
                    error={errors.emailKey || emailKeyResult?.error}
                  />
                </BlockStack>
              </Card>
            </InlineGrid>
            {smUp ? <Divider /> : null}
            <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
              <Box
                as="section"
                paddingInlineStart={{ xs: 400, sm: 0 }}
                paddingInlineEnd={{ xs: 400, sm: 0 }}
              >
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    3. AI Integration
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Add an AI integration to enable email generation using your
                    provider of choice.
                  </Text>
                </BlockStack>
              </Box>
              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <Select
                    label="Select your provider"
                    options={lLMProviders}
                    onChange={(value) =>
                      handleProviderChange(value, setFormState, "lLMProviderId")
                    }
                    value={formState?.lLMProviderId?.toString()}
                    error={errors.lLMProviderId}
                  />
                  <TextField
                    id="lLMKey"
                    helpText=""
                    label="Private API key"
                    autoComplete="off"
                    value={formState?.lLMKey}
                    onChange={(lLMKey) =>
                      setFormState({ ...formState, lLMKey })
                    }
                    error={errors.lLMKey || lLMKeyResult?.error}
                  />
                </BlockStack>
              </Card>
            </InlineGrid>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            primaryAction={{
              content: "Save",
              loading: isSaving,
              disabled: !isDirty || isSaving,
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
