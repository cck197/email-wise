import { useState, useRef, useEffect, useCallback } from "react";

import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Button,
  InlineStack,
  InlineError,
  Layout,
  Page,
  Text,
  TextField,
  Thumbnail,
  BlockStack,
  PageActions,
  Spinner,
  RangeSlider,
  ButtonGroup,
  Select,
} from "@shopify/polaris";
import {
  ImageIcon,
  ClipboardIcon,
  MagicIcon,
  ThumbsDownIcon,
} from "@shopify/polaris-icons";

import { MessageCard } from "./common";

import {
  getEmailGenerator,
  validateEmailGenerator,
  upsertEmailGenerator,
  rateEmail,
  deleteGenerator,
  getSettings,
  getTones,
  ALLOW_NO_LLM_PROVIDER,
} from "/app/models/EmailGenerator.server";
import { hasActiveSubscription } from "../models/Subscription.server";

export async function loader({ request, params }) {
  const { admin, redirect, session } = await authenticate.admin(request);
  if (!(await hasActiveSubscription(admin.graphql))) {
    return redirect("/app/billing");
  }
  const settings = await getSettings(session.shop);
  if (!settings && !ALLOW_NO_LLM_PROVIDER) {
    return redirect("/app/settings");
  }
  const tones = await getTones();
  const data = {
    baseUrl: process.env.SSE_URL,
    settings,
    tones,
  };

  const neutral_tone = tones.find((tone) => tone.label === "Neutral");

  if (params.id === "new") {
    return json({
      generator: {
        id: null,
        specials: "",
        stories: "",
        likeness: 3,
        toneId: neutral_tone.value,
      },
      email: null,
      ...data,
    });
  }

  const id = Number(params.id);
  const generator = await getEmailGenerator(id, admin.graphql);
  return json({
    generator: {
      ...generator,
      toneId: generator.toneId || neutral_tone.value,
    },
    ...data,
  });
}

export async function action({ request, params }) {
  const { session, admin, redirect } = await authenticate.admin(request);
  const { shop } = session;

  const formData = Object.fromEntries(await request.formData());

  const data = {
    shop,
    ...formData,
    likeness: Number(formData.likeness),
    toneId: Number(formData.toneId),
  };

  if (formData.action === "delete") {
    await deleteGenerator(Number(params.id));
    return redirect("/app");
  }
  if (formData.action === "rate") {
    await rateEmail(shop, Number(formData.emailId), -1);
    return redirect(`/app/generators/${params.id}`);
  }

  const errors = validateEmailGenerator(data);
  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const generator = await upsertEmailGenerator(params.id, data, admin.graphql);
  return redirect(`/app/generators/${generator.id}`);
}

export default function EmailGeneratorForm() {
  const errors = useActionData()?.errors || {};

  const { generator, baseUrl, settings, tones } = useLoaderData();
  const [formState, setFormState] = useState(generator);
  const [cleanFormState, setCleanFormState] = useState(generator);
  const [isDirty, setIsDirty] = useState(false);
  const email = generator.Email?.length > 0 ? generator.Email[0] : null;
  const [message, setMessage] = useState(email ? email.text : "");
  const [emailId, setEmailId] = useState(email ? email.id : null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const eventSourceRef = useRef(null);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
    });

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setFormState({
        ...formState,
        productId: id,
        productVariantId: variants[0].id,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText,
        productImage: images[0]?.originalSrc,
      });
    }
  }

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    const fullUrl = `${baseUrl}/email/${generator.id}`;

    if (!eventSourceRef.current) {
      const eventSource = new EventSource(fullUrl);
      eventSourceRef.current = eventSource;
      setIsLoading(true);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "end") {
          eventSource.close();
          setIsConnected(false);
          eventSourceRef.current = null;
          setEmailId(data.id);
        } else {
          setIsLoading(false);
          setMessage((prevMessage) => prevMessage + data.message);
        }
      };

      return () => {
        eventSource?.close();
        eventSourceRef.current = null;
      };
    }
  }, [isConnected, baseUrl, generator.id]);

  useEffect(() => {
    setIsDirty(JSON.stringify(formState) !== JSON.stringify(cleanFormState));
  }, [formState, cleanFormState]);

  function disconnect() {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsConnected(false);
    setMessage("");
  }

  function connect() {
    setMessage("");
    setIsConnected(true);
  }

  function toggleConnection() {
    isConnected ? disconnect() : connect();
  }

  const submit = useSubmit();
  function handleSave() {
    const data = {
      productTitle: formState.productTitle || "",
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
      specials: formState.specials || "",
      stories: formState.stories || "",
      toneId: formState?.toneId || tones[0].value,
      likeness: formState.likeness,
    };
    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
    disconnect();
  }

  function handleRate() {
    const data = {
      emailId: emailId,
      action: "rate",
    };
    submit(data, { method: "post" });
  }

  useEffect(() => {
    if (!isInitialMount) {
      if (!isSaving && !isDeleting) {
        connect();
      }
    } else {
      setIsInitialMount(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving, isDeleting]);

  const handleFormChange = useCallback(
    (key, value) => {
      setFormState({ ...formState, [key]: value });
    },
    [formState],
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopyButtonText("Copied");
      setTimeout(() => {
        setCopyButtonText("Copy");
      }, 1000);
    });
  };

  const navigate = useNavigate();
  const title = "→ " + (generator.id ? "Edit" : "New");

  return (
    <Page>
      <ui-title-bar title={title}>
        <button variant="breadcrumb" onClick={() => navigate("/app")}>
          Emails
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          {MessageCard(
            "Generate an email",
            "Select a product from your store and customise your sales message.",
          )}
        </Layout.Section>
        <div style={{ marginTop: "15px" }} />
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as={"h2"} variant="headingLg">
                    Product
                  </Text>
                  {formState.productId ? (
                    <Button variant="plain" onClick={selectProduct}>
                      Change product
                    </Button>
                  ) : null}
                </InlineStack>
                {formState.productId ? (
                  <InlineStack blockAlign="center" gap="400">
                    <Thumbnail
                      source={formState.productImage || ImageIcon}
                      alt={formState.productAlt}
                    />
                    <Text as="span" variant="headingMd" fontWeight="semibold">
                      {formState.productTitle}
                    </Text>
                  </InlineStack>
                ) : (
                  <BlockStack gap="200">
                    <Button onClick={selectProduct} id="select-product">
                      Select product
                    </Button>
                    {errors.productId ? (
                      <InlineError
                        message={errors.productId}
                        fieldID="myFieldID"
                      />
                    ) : null}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text as={"h2"} variant="headingLg">
                  Customise
                </Text>
                {settings?.emailKey && (
                  <RangeSlider
                    id="likeness"
                    label="Style consistency"
                    min={1}
                    max={5}
                    value={formState.likeness}
                    onChange={(value) => handleFormChange("likeness", value)}
                    prefix={<p>Not at all like previous emails</p>}
                    suffix={
                      <p
                        style={{
                          textAlign: "right",
                        }}
                      >
                        Very much like previous emails
                      </p>
                    }
                  />
                )}
                <Select
                  label="Tone of voice for the email"
                  options={tones}
                  onChange={(value) => handleFormChange("toneId", value)}
                  value={formState?.toneId?.toString()}
                  error={errors.toneId}
                />
                <TextField
                  id="specials"
                  label="Please list here any special deals that you'd like the email to include (optional)"
                  helpText="(e.g., 30% off), holidays (e.g., Black Friday), or Special Events (e.g., Back in Stock)"
                  multiline={3}
                  autoComplete="off"
                  value={formState.specials}
                  onChange={(value) => handleFormChange("specials", value)}
                  error={errors.specials}
                />
                <TextField
                  id="stories"
                  label="Are there any particular stories, angles, problems, or benefits that you'd like the email to mention? (optional)"
                  multiline={3}
                  autoComplete="off"
                  value={formState.stories}
                  onChange={(value) => handleFormChange("stories", value)}
                  error={errors.stories}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <BlockStack gap="400">
            {generator.id !== null && !isDirty && (
              <Card>
                <BlockStack gap="400">
                  <Text as={"h2"} variant="headingLg">
                    Generated Email
                  </Text>
                  <>
                    <ButtonGroup>
                      <Button
                        icon={MagicIcon}
                        variant="primary"
                        onClick={toggleConnection}
                      >
                        {isConnected ? "Stop generating" : "Generate"}
                      </Button>
                      <Button
                        icon={ClipboardIcon}
                        onClick={handleCopy}
                        disabled={isConnected}
                      >
                        {copyButtonText}
                      </Button>
                      <Button
                        icon={ThumbsDownIcon}
                        disabled={isConnected}
                        onClick={handleRate}
                      >
                        Bad
                      </Button>
                    </ButtonGroup>
                    {isConnected && isLoading && (
                      <Spinner accessibilityLabel="Loading stream data" />
                    )}
                    {message && (
                      <TextField
                        value={message}
                        multiline="true"
                        autoComplete="off"
                        readOnly={true}
                      />
                    )}
                  </>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            secondaryActions={[
              {
                content: "Delete",
                loading: isDeleting,
                disabled: !generator.id || !generator || isSaving || isDeleting,
                destructive: true,
                outline: true,
                onAction: () =>
                  submit({ action: "delete" }, { method: "post" }),
              },
            ]}
            primaryAction={{
              content: "Save",
              loading: isSaving,
              disabled: !isDirty || isSaving || isDeleting,
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
