import { getQueue } from "./bull";
import db from "/app/db.server";

export const ALLOW_NO_LLM_PROVIDER =
  process.env.ALLOW_NO_LLM_PROVIDER === "true" || false;

export async function getEmailGenerator(id, graphql) {
  const generator = await db.emailGenerator.findFirstOrThrow({
    where: { id },
    include: {
      Email: {
        orderBy: {
          createdAt: "desc",
        },
      },
      tone: true,
    },
  });
  return supplementGenerator(generator, graphql);
}

export async function getSelectValues(tableName) {
  const table = db[tableName];
  const rows = await table.findMany({
    orderBy: { name: "asc" },
  });

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

export async function getTones() {
  return getSelectValues("tone");
}

export async function getSettings(shop) {
  return await db.settings.findFirst({
    where: {
      shop: shop,
    },
    include: {
      emailProvider: true,
      lLMProvider: true,
    },
  });
}

export async function getEmailGenerators(shop, graphql) {
  const generators = await getEmailGeneratorsByShop(shop);

  return Promise.all(
    generators.map((generator) => supplementGenerator(generator, graphql)),
  );
}

export async function getEmailGeneratorsByShop(shop) {
  const generators = await db.emailGenerator.findMany({
    where: {
      shop: shop,
    },
    include: {
      Email: true,
    },
    orderBy: { id: "desc" },
  });
  const sortedGenerators = generators.sort((a, b) => {
    const aMaxDate = Math.max(
      ...a.Email.map((email) => new Date(email.createdAt)),
    );
    const bMaxDate = Math.max(
      ...b.Email.map((email) => new Date(email.createdAt)),
    );
    return bMaxDate - aMaxDate;
  });

  return sortedGenerators;
}

export async function getEmail(shop, id) {
  return id
    ? await db.email.findFirst({
        where: {
          emailGeneratorId: id,
          shop: shop,
        },
        orderBy: { createdAt: "desc" },
      })
    : null;
}

export async function deleteGenerator(id) {
  return await db.emailGenerator.delete({
    where: { id: id },
  });
}

export async function rateEmail(shop, id, rating) {
  // console.log("rateEmail", shop, id, rating);
  return await db.email.update({
    where: {
      id: id,
      shop: shop,
    },
    data: {
      rating: -1,
    },
  });
}

export async function upsertEmailGenerator(id, data, graphql) {
  const product = await supplementGenerator(data, graphql);
  data.productDescription = product.productDescription;
  if (id === "new") {
    return await db.emailGenerator.create({ data });
  }
  const generator = await db.emailGenerator.update({
    where: { id: Number(id) },
    data,
  });
  return generator;
}

export async function saveSettings(data) {
  const settings = await getSettings(data.shop);
  const include = {
    emailProvider: true,
    lLMProvider: true,
  };
  const settings_ = settings
    ? await db.settings.update({
        where: { id: settings.id },
        include,
        data,
      })
    : await db.settings.create({
        data,
        include,
      });
  const task_queue = getQueue();
  let job = await task_queue.add({ old: settings, new: settings_ });
  return await job.finished();
}

export async function getEmailGeneratorById(id) {
  return await db.emailGenerator.findFirstOrThrow({
    where: {
      id: id,
    },
  });
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
          description
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
    productDescription: product?.description,
  };
}

export function validateEmailGenerator(data) {
  const errors = {};

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}

export function validateSettings(data) {
  const errors = {};

  /*
  if (!data.emailProviderId) {
    errors.emailProviderId = "Email provider is required";
  }

  if (!data.emailKey) {
    errors.emailKey = "Email private key is required";
  }
  */

  if (!data.lLMProviderId) {
    errors.lLMProviderId = "AI provider is required";
  }

  if (!data.lLMKey && !ALLOW_NO_LLM_PROVIDER) {
    errors.lLMKey = "AI private key is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
