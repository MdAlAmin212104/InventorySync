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
import { getAllProducts } from "app/models/Products";
import ProductList from "app/components/ProductList";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const products = await getAllProducts(request);

  return {
    products: products,
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
        <ProductList
          currentProducts={currentProducts}
          openProducts={openProducts}
          toggleProduct={toggleProduct}
          getTotalInventory={getTotalInventory}
          getAlt={getAlt}
          getImage={getImage}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />

      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
