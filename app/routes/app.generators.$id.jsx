import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
  EmptyState,
  Spinner,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

import db from "/app/db.server";
import {
  getEmailGenerator,
  validateEmailGenerator,
  upsertEmailGenerator,
} from "/app/models/EmailGenerator.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);

  const data = {};

  data.generator =
    params.id === "new"
      ? {
          id: null,
        }
      : await getEmailGenerator(Number(params.id), admin.graphql);

  return json(data);
}

export async function action({ request, params }) {
  const { session, admin } = await authenticate.admin(request);
  const { shop } = session;

  const formData = Object.fromEntries(await request.formData());
  const { productId, productTitle, productVariantId, productHandle } = formData;

  const data = {
    shop,
    productTitle,
    productId,
    productVariantId,
    productHandle,
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

  const { generator } = useLoaderData();
  const [formState, setFormState] = useState(generator);
  const [cleanFormState, setCleanFormState] = useState(generator);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const { isSuccess, data } = useQuery({
    queryKey: ["emailData"],
    queryFn: () =>
      fetch(`/app/api/email/${generator.shop}/${generator.id}`).then((res) =>
        res.json(),
      ),
  });

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
      productTitle: formState.productTitle || "",
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
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
                  Generated Email
                </Text>
                {isSuccess && data.text && (
                  <TextField
                    value={data.text.trim()}
                    autoComplete="off"
                    readOnly
                    multiline="true"
                  />
                )}
                {generator.id === null && (
                  <EmptyState image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png">
                    Your generated email will appear here
                  </EmptyState>
                )}
                {isSuccess && generator.id && !data.text && (
                  <EmptyState image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png">
                    <Spinner accessibilityLabel="Generating..." size="large" />
                  </EmptyState>
                )}
                {/* }
                <BlockStack gap="300">
                  <Button disabled={!data?.id} variant="primary">
                    Generate new email
                  </Button>
                  <Button
                    disabled={!data?.id}
                    url={`/TODO/${data?.id}`}
                    target="_blank"
                  >
                    Create email template with provider
                  </Button>
                </BlockStack>
                  { */}
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
