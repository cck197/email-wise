export async function getSubscriptionStatus(graphql) {
  const result = await graphql(
    `
      #graphql
      query Shop {
        app {
          installation {
            launchUrl
            activeSubscriptions {
              id
              name
              createdAt
              returnUrl
              status
              currentPeriodEnd
              trialDays
            }
          }
        }
      }
    `,
    { variables: {} },
  );

  return await result.json();
}

export async function hasActiveSubscription(graphql) {
  const subscriptions = await getSubscriptionStatus(graphql);
  const { activeSubscriptions } = subscriptions.data.app.installation;
  // console.log("activeSubscriptions", activeSubscriptions);
  return (
    activeSubscriptions.length > 0 && activeSubscriptions[0].status === "ACTIVE"
  );
}

// TODO metered billing
export async function createSubscriptionMetafield(graphql, value) {
  const appIdQuery = await graphql(`
    #graphql
    query {
      currentAppInstallation {
        id
      }
    }
  `);

  const appIdQueryData = await appIdQuery.json();
  const appInstallationID = appIdQueryData.data.currentAppInstallation.id;

  const appMetafield = await graphql(
    `
      #graphql
      mutation CreateAppDataMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields: {
          namespace: "emailwise", // TODO
          key: "hasPlan",
          type: "boolean",
          value: value,
          ownerId: appInstallationID,
        },
      },
    },
  );

  return await appMetafield.json();
}
