When creating a new staging or production environment, the Shopify Partners
dashboard will tempt you into thinking you can create a new app manually.
However, it doesn't seem to work, and when you install the new app on a test
store, you end up on a 404 not found page. 

To get around this, create the new app using the CLI: `shopify app init`.

Then you can update the configuration in the dashboard.