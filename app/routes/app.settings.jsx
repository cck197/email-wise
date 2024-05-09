import { useState, useCallback } from "react";
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
} from "@shopify/polaris";
import {
  getLLMProviders,
  getEmailProviders,
  validateSettings,
  saveSettings,
  getSettings,
} from "/app/models/EmailGenerator.server";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  const lLMProviders = await getLLMProviders();
  const emailProviders = await getEmailProviders();

  console.log("settings", settings);

  return json({
    settings: settings
      ? settings
      : {
          id: "new",
          emailKey: "",
          lLMKey: "",
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
  const { emailProviderId, lLMProviderId, emailKey, lLMKey } = formData;

  const data = {
    shop,
    emailProviderId: parseInt(emailProviderId),
    lLMProviderId: parseInt(lLMProviderId),
    emailKey,
    lLMKey,
  };

  console.log("data", data);

  const errors = validateSettings(data);
  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const settings = await saveSettings(data);
  console.log("settings", settings);
  return redirect("/app");
}

export function SettingsForm() {
  const errors = useActionData()?.errors || {};

  const { settings, lLMProviders, emailProviders } = useLoaderData();
  const [formState, setFormState] = useState(settings);
  const [cleanFormState, setCleanFormState] = useState(settings);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";

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
        console.error("Received NaN value for provider ID");
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
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page>
      <ui-title-bar
        title={settings.id === "new" ? "Add Settings" : "Edit Settings"}
      ></ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Email Integration
                </Text>
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
                  label="Private API key"
                  autoComplete="off"
                  value={formState?.emailKey}
                  onChange={(emailKey) =>
                    setFormState({ ...formState, emailKey })
                  }
                  error={errors.emailKey}
                />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  AI Integration
                </Text>
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
                  onChange={(lLMKey) => setFormState({ ...formState, lLMKey })}
                  error={errors.lLMKey}
                />
              </BlockStack>
            </Card>
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

export default function Index() {
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <SettingsForm />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
