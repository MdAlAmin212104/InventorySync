/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useCallback, useEffect, useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

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

  return {
    shop: session.shop,
    products: data.data?.products?.nodes || [],
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  const [productDetails, setProductDetails] = useState<any[]>(products);
  const [openProducts, setOpenProducts] = useState<{ [id: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const fetcher = useFetcher();

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(productDetails.length / ITEMS_PER_PAGE);

  const currentProducts = productDetails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /** Update product details when fetcher returns fresh data */
  useEffect(() => {
    if (fetcher.data?.products) {
      setProductDetails(fetcher.data.products);
    }
  }, [fetcher.data]);

  /** Toggle open/close product details */
  const toggleProduct = useCallback((productId: string) => {
    setOpenProducts(prev => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  }, []);

  /** Helper: product inventory total */
  const getTotalInventory = (p: any) =>
    p.variants.nodes.reduce((sum: number, v: any) => sum + (v.inventoryQuantity || 0), 0);

  /** Helper: product image */
  const getImage = (p: any) =>
    p?.media?.nodes?.[0]?.preview?.image?.url ||
    "https://cdn.shopify.com/s/files/1/0781/9391/7986/files/Main_b13ad453-477c-4ed1-9b43-81f3345adfd6.jpg?v=1738404310";

  const getAlt = (p: any) =>
    p?.media?.nodes?.[0]?.preview?.image?.altText || p.title;

  return (
    <s-page heading="Shopify Product Inventory">
      <s-section>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2>All Products Inventory</h2>
          <s-text>Total Products: {productDetails.length}</s-text>
        </div>

        {/* Product List */}
        {currentProducts.length > 0 ? (
          <s-stack gap="base" direction="block">
            {currentProducts.map((product: any) => {
              const isOpen = openProducts[product.id] || false;
              const totalInventory = getTotalInventory(product);

              return (
                <s-section key={product.id}>
                  <s-stack gap="base" direction="block">

                    {/* Product Header Row */}
                    <s-clickable
                      border="base"
                      padding="base"
                      background="subdued"
                      borderRadius="base"
                      onClick={() => toggleProduct(product.id)}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <s-thumbnail alt={getAlt(product)} src={getImage(product)} size="small" />
                          <s-text>{product.title}</s-text>
                        </div>

                        <div style={{ color: totalInventory > 0 ? "#16a34a" : "#dc2626" }}>
                          Total Inventory: {totalInventory}
                        </div>
                      </div>
                    </s-clickable>

                    {/* Dropdown Details */}
                    {isOpen && (
                      <s-box padding="base" background="subdued" borderRadius="base">
                        <s-stack gap="base">

                          <s-text>Variants ({product.variants.nodes.length})</s-text>

                          {product.variants.nodes.map((variant: any) => (
                            <s-box key={variant.id} padding="base" border="base" borderRadius="base">
                              <s-stack gap="base">

                                <div style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                }}>
                                  <s-text>Variant: {variant.title}</s-text>
                                  <s-text>SKU: {variant.sku || "N/A"}</s-text>
                                  <s-text>Inventory: {variant.inventoryQuantity}</s-text>
                                </div>

                                {variant.inventoryItem.inventoryLevels.nodes.length > 0 && (
                                  <div>
                                    <s-text>Location Inventory</s-text>
                                    <s-stack direction="block" gap="small">
                                      {variant.inventoryItem.inventoryLevels.nodes.map((level: any, i: number) => (
                                        <div key={i} style={{
                                          padding: "8px 12px",
                                          background: "white",
                                          borderRadius: 5,
                                          border: "1px solid #e5e7eb",
                                          display: "flex",
                                          justifyContent: "space-between",
                                        }}>
                                          <s-text>{level.location.name}</s-text>
                                          <span style={{
                                            color: level.quantities[0]?.quantity > 0 ? "#16a34a" : "#dc2626"
                                          }}>
                                            {level.quantities[0]?.quantity || 0} available
                                          </span>
                                        </div>
                                      ))}
                                    </s-stack>
                                  </div>
                                )}

                              </s-stack>
                            </s-box>
                          ))}

                        </s-stack>
                      </s-box>
                    )}

                  </s-stack>
                </s-section>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                marginTop: 20,
              }}>
                <s-button
                  variant="secondary"
                  tone="neutral"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </s-button>

                <s-badge tone="info">
                  Page {currentPage} of {totalPages}
                </s-badge>

                <s-button
                  variant="secondary"
                  tone="neutral"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </s-button>
              </div>
            )}

          </s-stack>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
            <s-text>No products found.</s-text>
          </div>
        )}

      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
