//import invariant from "tiny-invariant";
import db from "../db.server";

export async function getEmailGenerator(id, graphql) {
  const generator = await db.emailGenerator.findFirst({ where: { id } });

  if (!generator) {
    return null;
  }

  return supplementGenerator(generator, graphql);
}

export async function getSelectValues(tableName) {
  const table = db[tableName];
  const rows = await table.findMany({
    orderBy: { name: "asc" },
  });

  if (rows.length === 0) return [];

  return rows.map((row) => ({
    value: row.id.toString(),
    label: row.name,
  }));
}

export async function getLLMProviders() {
  return getSelectValues("lLMProvider");
}

export async function getEmailProviders() {
  return getSelectValues("emailProvider");
}

async function getLabel(tableName, id) {
  const row = await db[tableName].findUnique({ where: { id } });
  return row.name;
}

export async function getEmailGenerators(shop, graphql) {
  const generators = await db.emailGenerator.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (generators.length === 0) return [];

  return Promise.all(
    generators.map((generator) => supplementGenerator(generator, graphql)),
  );
}

async function supplementGenerator(generator, graphql) {
  const response = await graphql(
    `
      query supplementGenerator($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: generator.productId,
      },
    },
  );

  const {
    data: { product },
  } = await response.json();

  return {
    ...generator,
    productDeleted: !product?.title,
    productTitle: product?.title,
    productImage: product?.images?.nodes[0]?.url,
    productAlt: product?.images?.nodes[0]?.altText,
    emailProvider: await getLabel("emailProvider", generator.emailProviderId),
    llmProvider: await getLabel("lLMProvider", generator.llmProviderId),
  };
}

export function validateEmailGenerator(data) {
  const errors = {};

  if (!data.name) {
    errors.name = "Name is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (!data.emailProviderId) {
    errors.emailProviderId = "Email Provider is required";
  }

  if (!data.llmProviderId) {
    errors.llmProviderId = "AI Provider is required";
  }

  if (!data.emailPrivateKey) {
    errors.emailPrivateKey = "Private API key is required";
  }

  if (!data.llmPrivateKey) {
    errors.llmPrivateKey = "Private API key is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
