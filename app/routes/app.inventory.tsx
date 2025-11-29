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
                    location {
                      name
                    }
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
  const { admin, session } = await authenticate.admin(request);
  console.log(admin, session);
  return null;
};

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  const [productDetails, setProductDetails] = useState<any[]>(products);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [openProducts, setOpenProducts] = useState<{ [key: string]: boolean }>({});
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data?.products) {
      setProductDetails(fetcher.data.products);
      setLoading(false);
    }
  }, [fetcher.data]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      s-clickable:hover,
      s-clickable:hover::part(base) {
        background-color: transparent !important;
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const toggleProduct = useCallback((productId: string) => {
    setOpenProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  }, []);

  // Calculate total inventory for a product
  const getTotalInventory = (product: any) => {
    return product.variants.nodes.reduce((total: number, variant: any) => {
      return total + (variant.inventoryQuantity || 0);
    }, 0);
  };

  // Get product image URL safely
  const getProductImage = (product: any) => {
    return product?.media?.nodes?.[0]?.preview?.image?.url || null;
  };

  // Get product image alt text safely
  const getProductImageAlt = (product: any) => {
    return product?.media?.nodes?.[0]?.preview?.image?.altText || product.title;
  };

  return (
    <s-page heading="Shopify Product Inventory">
      <s-section>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2>All Products Inventory</h2>
          {productDetails.length > 0 && (
            <s-text>
              Total Products: {productDetails.length}
            </s-text>
          )}
        </div>

        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            Error: {error}
          </div>
        )}

        {(loading || fetcher.state === "loading") && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading products...</p>
          </div>
        )}

        {!loading && fetcher.state !== "loading" && productDetails.length > 0 && (
          <s-stack gap="base" direction="block">
            {productDetails.map((product: any) => {
              const isOpen = openProducts[product.id] || false;
              const totalInventory = getTotalInventory(product);
              const productImage = getProductImage(product);
              const productImageAlt = getProductImageAlt(product);

              return (
                <s-section key={product.id}>
                  <s-stack gap="base" direction="block">
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
                        <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                          {productImage ? (
                            <s-thumbnail
                              alt={productImageAlt}
                              src={productImage }
                              size="small"
                            />
                          ) : (
                            <s-thumbnail
                              alt={productImageAlt}
                              src="https://cdn.shopify.com/s/files/1/0781/9391/7986/files/Main_b13ad453-477c-4ed1-9b43-81f3345adfd6.jpg?v=1738404310"
                              size="small"
                            />
                          )}
                          <s-text>{product.title}</s-text>
                        </div>
                        
                        <s-text>
                          <div style={{ color: totalInventory > 0 ? '#16a34a' : '#dc2626' }}>
                            Total Inventory: {totalInventory}
                          </div>
                        </s-text>
                      </div>
                    </s-clickable>

                    {isOpen && (
                      <s-box padding="base" background="subdued" borderRadius="base">
                        <s-stack gap="base" direction="block">
                          <div>
                            <s-text>
                              <div style={{ marginBottom: "10px" }}>
                                Variants ({product.variants.nodes.length})
                              </div>
                            </s-text>
                            <s-stack gap="base" direction="block">
                              {product.variants.nodes.map((variant: any) => (
                                <s-box
                                  key={variant.id}
                                  padding="base"
                                  borderRadius="base"
                                  border="base"
                                >
                                  <s-stack gap="base" direction="block">
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: '10px'
                                    }}>
                                      <div>
                                        <s-text>Variant: {variant.title}</s-text>
                                      </div>
                                      <div>
                                        <s-text>SKU: {variant.sku || 'N/A'}</s-text>
                                      </div>
                                      <div>
                                        <s-text>Total Inventory: {variant.inventoryQuantity}</s-text>
                                      </div>
                                    </div>

                                    {variant.inventoryItem.inventoryLevels.nodes.length > 0 && (
                                      <div style={{ marginTop: '5px' }}>
                                        <div style={{ marginBottom: "10px" }}>
                                          Location Inventory:
                                        </div>
                                        <s-stack direction="block" gap="small">
                                          {variant.inventoryItem.inventoryLevels.nodes.map((level: any, idx: number) => (
                                            <div
                                              key={idx}
                                              style={{
                                                padding: '8px 12px',
                                                backgroundColor: 'white',
                                                borderRadius: '5px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                border: '1px solid #e5e7eb'
                                              }}
                                            >
                                              <s-text>
                                                {level.location.name}
                                              </s-text>
                                              <div
                                                style={{
                                                  color: level.quantities[0]?.quantity > 0 ? '#16a34a' : '#dc2626'
                                                }}
                                              >
                                                {level.quantities[0]?.quantity || 0} available
                                              </div>
                                            </div>
                                          ))}
                                        </s-stack>
                                      </div>
                                    )}
                                  </s-stack>
                                </s-box>
                              ))}
                            </s-stack>
                          </div>
                        </s-stack>
                      </s-box>
                    )}
                  </s-stack>
                </s-section>
              );
            })}
          </s-stack>
        )}

        {!loading && fetcher.state !== "loading" && productDetails.length === 0 && !error && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <s-text>No products found.</s-text>
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};