//import invariant from "tiny-invariant";
import db from "../db.server";

export async function getEmailGenerator(id, graphql) {
  const generator = await db.emailGenerator.findFirst({ where: { id } });

  if (!generator) {
    return null;
  }

  return supplementGenerator(generator, graphql);
}

export async function getGenerators(shop, graphql) {
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
  };
}

export function validateGenerator(data) {
  const errors = {};

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (!data.emailProviderId) {
    errors.emailProviderId = "Email provider is required";
  }

  if (!data.llmProviderId) {
    errors.llmProviderId = "LLM provider is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
