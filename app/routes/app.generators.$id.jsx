import { useState, useRef, useEffect } from "react";

import { json, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
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
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

import db from "/app/db.server";
import {
  getEmailGenerator,
  validateEmailGenerator,
  upsertEmailGenerator,
  getEmail,
} from "/app/models/EmailGenerator.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);

  if (params.id === "new") {
    return json({ generator: { id: null, salt: "" }, email: null });
  }

  const id = Number(params.id);
  const generator = await getEmailGenerator(id, admin.graphql);
  return json({
    generator,
    email: await getEmail(generator.shop, id),
    baseUrl: process.env.SSE_URL,
  });
}

export async function action({ request, params }) {
  const { session, admin } = await authenticate.admin(request);
  const { shop } = session;

  const formData = Object.fromEntries(await request.formData());

  const data = {
    shop,
    ...formData,
  };

  if (formData.action === "delete") {
    await db.emailGenerator.delete({ where: { id: Number(params.id) } });
    return redirect("/app");
  }

  const errors = validateEmailGenerator(data);
  console.log("errors", errors);
  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const generator = await upsertEmailGenerator(params.id, data, admin.graphql);
  return redirect(`/app/generators/${generator.id}`);
}

export default function EmailGeneratorForm() {
  const errors = useActionData()?.errors || {};

  const { generator, email, baseUrl } = useLoaderData();
  const [formState, setFormState] = useState(generator);
  const [cleanFormState, setCleanFormState] = useState(generator);
  const [message, setMessage] = useState(email ? email.text : "");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef(null);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select", // customized action verb, either 'select' or 'add',
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
          console.log("disconnecting...");
          eventSource.close();
          setIsConnected(false);
          eventSourceRef.current = null;
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

  const submit = useSubmit();
  function handleSave() {
    const data = {
      productTitle: formState.productTitle || "",
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
      salt: formState.salt || "",
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page>
      <ui-title-bar
        title={generator.id ? "Edit Email" : "Create New Email"}
      ></ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
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
                  <InlineStack blockAlign="center" gap="500">
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
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Salt
                </Text>
                <TextField
                  id="salt"
                  helpText="Anything you want to add to the email"
                  label="salt"
                  labelHidden
                  autoComplete="off"
                  value={formState.salt}
                  onChange={(salt) => setFormState({ ...formState, salt })}
                  error={errors.salt}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <BlockStack gap="500">
            {generator.id !== null && !isDirty && (
              <Card>
                <BlockStack gap="500">
                  <Text as={"h2"} variant="headingLg">
                    Generated Email
                  </Text>
                  <>
                    <Button variant="primary" onClick={toggleConnection}>
                      {isConnected ? "Stop generating" : "Generate"}
                    </Button>
                    {isLoading ? (
                      <Spinner accessibilityLabel="Loading stream data" />
                    ) : (
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
