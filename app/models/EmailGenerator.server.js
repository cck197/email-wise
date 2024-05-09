import db from "/app/db.server";

export async function getEmailGenerator(id, graphql) {
  const generator = await db.emailGenerator.findFirstOrThrow({ where: { id } });
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

export async function getSettings(shop) {
  return await db.settings.findFirst({
    where: {
      shop: shop,
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
  return await db.emailGenerator.findMany({
    where: {
      shop: shop,
    },
    orderBy: { id: "desc" },
  });
}

async function sendWebhook(payload) {
  const webhookUrl = process.env.WEBHOOK_URL;
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      console.log("Webhook sent successfully", response.ok);
    })
    .catch((error) => {
      console.error("Failed to send webhook", error);
    });
}

export async function generateEmail(id, generator, graphql) {
  const product = await supplementGenerator(generator, graphql);
  const payload = { id, data: { ...product, generator } };
  await db.email.create({
    data: { shop: generator.shop, emailGeneratorId: generator.id },
  });
  await sendWebhook(payload);
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

export async function upsertEmailGenerator(id, data, graphql) {
  const result =
    id === "new"
      ? await db.emailGenerator.create({ data })
      : await db.emailGenerator.update({
          where: { id: Number(id) },
          data,
        });
  await generateEmail(id, result, graphql);
  return result;
}

export async function saveSettings(data) {
  const settings = await getSettings(data.shop);
  return settings
    ? await db.settings.update({
        where: { id: settings.id },
        data,
      })
    : await db.settings.create({
        data,
      });
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

  if (!data.emailProviderId) {
    errors.emailProviderId = "Email provider is required";
  }

  if (!data.emailKey) {
    errors.emailKey = "Email private key is required";
  }

  if (!data.lLMProviderId) {
    errors.lLMProviderId = "AI provider is required";
  }

  if (!data.lLMKey) {
    errors.lLMKey = "AI private key is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
