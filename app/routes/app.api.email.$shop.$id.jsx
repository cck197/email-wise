import { json } from "@remix-run/node";

import { getEmail } from "/app/models/EmailGenerator.server";

export async function loader({ params }) {
  const { shop, id } = params;
  const email = await getEmail(shop, Number(id));
  if (!email) {
    return json({ error: "Email not found" }, { status: 404 });
  }
  const data = { id: email.id, text: email.text };
  return json(data);
}
