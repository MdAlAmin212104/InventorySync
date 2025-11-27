/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect, useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  const response = await admin.graphql(`
    query GetProducts {
      products(first: 50) {
        nodes {
          id
          title
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
  
  return({
    shop: session.shop,
    products: data.data?.products?.nodes || [],
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  console.log(admin, session);
  // Future actions here
  return null;
};

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  const [productDetails, setProductDetails] = useState<any[]>(products);
  const [loading, setLoading] = useState(false);
  const [error, ] = useState<string | null>(null);
  const fetcher = useFetcher();


  // Update products when fetcher data changes
  useEffect(() => {
    if (fetcher.data?.products) {
      setProductDetails(fetcher.data.products);
      setLoading(false);
    }
  }, [fetcher.data]);

  return (
    <s-page heading="Shopify Product Inventory">
      <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1>All Products Inventory</h1>
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
          <div style={{textAlign: 'center', padding: '40px'}}>
            <p>Loading products...</p>
          </div>
        )}
        
        {!loading && fetcher.state !== "loading" && productDetails.length > 0 && (
          <div style={{marginTop: '20px'}}>
            <h2 style={{marginBottom: '20px'}}>
              Total Products: {productDetails.length}
            </h2>
            
            {productDetails.map((product: any) => (
              <div key={product.id} style={{
                border: '1px solid #ddd',
                padding: '20px',
                marginBottom: '20px',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{marginBottom: '10px', color: '#333'}}>
                  {product.title}
                </h3>
                <p style={{color: '#666', fontSize: '14px', marginBottom: '15px'}}>
                  Product ID: {product.id}
                </p>
                
                <div style={{marginTop: '15px'}}>
                  <h4 style={{marginBottom: '10px', color: '#555'}}>
                    Variants ({product.variants.nodes.length})
                  </h4>
                  
                  {product.variants.nodes.map((variant: any) => (
                    <div key={variant.id} style={{
                      marginLeft: '0',
                      marginTop: '10px',
                      padding: '15px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '5px',
                      borderLeft: '3px solid #5c6ac4'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        marginBottom: '10px'
                      }}>
                        <p>
                          <strong>Variant:</strong> {variant.title}
                        </p>
                        <p>
                          <strong>SKU:</strong> {variant.sku || 'N/A'}
                        </p>
                        <p>
                          <strong>Total Inventory:</strong> {variant.inventoryQuantity}
                        </p>
                      </div>
                      
                      {variant.inventoryItem.inventoryLevels.nodes.length > 0 && (
                        <div style={{marginTop: '15px'}}>
                          <strong style={{display: 'block', marginBottom: '8px'}}>
                            Location Inventory:
                          </strong>
                          <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                          }}>
                            {variant.inventoryItem.inventoryLevels.nodes.map((level: any, idx: number) => (
                              <li key={idx} style={{
                                padding: '8px 12px',
                                backgroundColor: 'white',
                                marginBottom: '5px',
                                borderRadius: '3px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span style={{fontWeight: '500'}}>
                                  {level.location.name}
                                </span>
                                <span style={{
                                  color: level.quantities[0]?.quantity > 0 ? '#16a34a' : '#dc2626',
                                  fontWeight: 'bold'
                                }}>
                                  {level.quantities[0]?.quantity || 0} available
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && fetcher.state !== "loading" && productDetails.length === 0 && !error && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <p style={{fontSize: '18px'}}>No products found.</p>
          </div>
        )}
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};