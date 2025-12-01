/* eslint-disable @typescript-eslint/no-explicit-any */

import { authenticate } from "app/shopify.server";


export async function getAllProducts(request: Request) {
  try {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(`
    query GetProducts {
      products(first: 50, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          title
          media(first:1){
            nodes{
              preview{
                image{
                  url
                  altText
                }
              }
            }
          }
          variants(first: 50) {
            nodes {
              id
              title
              sku
              inventoryQuantity
              inventoryItem {
                inventoryLevels(first: 20) {
                  nodes {
                    location { name }
                    quantities(names: ["available"]) {
                      name
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  const data = await response.json();
  return data.data?.products?.nodes || [];
  } catch (error) {
    console.error("❌ Error fetching all product:", error);
    return [];
  }
}


export async function updateNotes(request: Request) {
  try {
    const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const selectedProducts = JSON.parse(formData.get("products") as string);
  const noteTitle = formData.get("noteTitle") as string;
  const noteDescription = formData.get("noteDescription") as string;

  const newNote = {
    id: Date.now(),
    title: noteTitle,
    description: noteDescription,
    createdAt: new Date().toISOString(),
  };

  // Loop through each selected product and update its metafield
  for (const product of selectedProducts) {
    // 1️⃣ Fetch existing metafield notes
    const response = await admin.graphql(
      `#graphql
      query GetProductNotes($id: ID!) {
        product(id: $id) {
          metafield(namespace: "$app", key: "notes") {
            value
          }
        }
      }`,
      {
        variables: { id: product.id },
      }
    );

    const data = await response.json();
    let existingNotes: any[] = [];

    // 2️⃣ Parse existing value if exists
    const existingValue = data?.data?.product?.metafield?.value;
    if (existingValue) {
      try {
        existingNotes = JSON.parse(existingValue);
      } catch (e) {
        console.error("⚠️ Error parsing existing metafield JSON:", e);
        existingNotes = [];
      }
    }

    // 3️⃣ Add new note to list
    existingNotes.push(newNote);

    // 4️⃣ Save back to metafield
    await admin.graphql(
      `#graphql
      mutation SetMetafield($ownerId: ID!, $value: String!) {
        metafieldsSet(metafields: [{
          ownerId: $ownerId,
          namespace: "$app",
          key: "notes",
          type: "json",
          value: $value
        }]) {
          metafields {
            id
            key
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          ownerId: product.id,
          value: JSON.stringify(existingNotes),
        },
      }
    );
  }

  return { success: true };
  } catch (error) {
    console.error("❌ Error updating product notes:", error); 
  }
}