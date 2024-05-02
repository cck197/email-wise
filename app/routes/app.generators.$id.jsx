import { useState, useCallback } from "react";
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
  Select,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

import db from "/app/db.server";
import {
  getEmailGenerator,
  validateEmailGenerator,
  getEmailProviders,
  getLLMProviders,
} from "/app/models/EmailGenerator.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  const data = {
    emailProviders: await getEmailProviders(),
    llmProviders: await getLLMProviders(),
  };

  data.generator =
    params.id === "new"
      ? {
          emailProviderId: data.emailProviders[0].value,
          llmProviderId: data.llmProviders[0].value,
          name: "",
        }
      : await getEmailGenerator(Number(params.id), admin.graphql);

  return json(data);
}

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = Object.fromEntries(await request.formData());
  const {
    name,
    productId,
    productVariantId,
    productHandle,
    emailProviderId,
    llmProviderId,
    emailPrivateKey,
    llmPrivateKey,
  } = formData;

  const data = {
    shop,
    name,
    productId,
    productVariantId,
    productHandle,
    emailProviderId: parseInt(emailProviderId),
    llmProviderId: parseInt(llmProviderId),
    emailPrivateKey,
    llmPrivateKey,
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

  const generator =
    params.id === "new"
      ? await db.emailGenerator.create({ data })
      : await db.emailGenerator.update({
          where: { id: Number(params.id) },
          data,
        });

  return redirect(`/app/generators/${generator.id}`);
}

export default function EmailGeneratorForm() {
  const errors = useActionData()?.errors || {};

  const { emailProviders, llmProviders, generator } = useLoaderData();
  const [formState, setFormState] = useState(generator);
  const [cleanFormState, setCleanFormState] = useState(generator);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

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

  const submit = useSubmit();
  function handleSave() {
    const data = {
      name: formState.name,
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
      emailProviderId: formState.emailProviderId || emailProviders[0].value,
      llmProviderId: formState.llmProviderId || llmProviders[0].value,
      emailPrivateKey: formState.emailPrivateKey,
      llmPrivateKey: formState.llmPrivateKey,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page>
      <ui-title-bar
        title={
          generator.id ? "Edit Email Generator" : "Create new Email Generator"
        }
      ></ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Name
                </Text>
                <TextField
                  id="name"
                  helpText="Only store staff can see this name"
                  label="name"
                  labelHidden
                  autoComplete="off"
                  value={formState.name}
                  onChange={(name) => setFormState({ ...formState, name })}
                  error={errors.name}
                />
              </BlockStack>
            </Card>
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
                  value={formState.emailProviderId.toString()}
                  error={errors.emailProviderId}
                />
                <TextField
                  id="emailPrivateKey"
                  helpText=""
                  label="Private API key"
                  autoComplete="off"
                  value={formState.emailPrivateKey}
                  onChange={(emailPrivateKey) =>
                    setFormState({ ...formState, emailPrivateKey })
                  }
                  error={errors.emailPrivateKey}
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
                  options={llmProviders}
                  onChange={(value) =>
                    handleProviderChange(value, setFormState, "llmProviderId")
                  }
                  value={formState.llmProviderId.toString()}
                  error={errors.llmProviderId}
                />
                <TextField
                  id="llmKey"
                  helpText=""
                  label="Private API key"
                  autoComplete="off"
                  value={formState.llmPrivateKey}
                  onChange={(llmPrivateKey) =>
                    setFormState({ ...formState, llmPrivateKey })
                  }
                  error={errors.llmPrivateKey}
                />
              </BlockStack>
            </Card>
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
