/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {useAppBridge} from "@shopify/app-bridge-react";


export default function ProductPicker() {
  const shopify = useAppBridge();

  const selectProduct = async () => {
    try {
      const selection = await shopify.resourcePicker({
  type: "product",
  multiple: true,
  action: "select",
  filter: {
    variants: false, // Additional filter to exclude variants
  },
});

      if (selection) {
        console.log("Selected products:", selection);
        // selection is an array of selected products without variants
      }
    } catch (error) {
      console.log("User cancelled or error:", error);
    }
  };

  return (
    <s-button onClick={selectProduct}>
      Select products
    </s-button>
  );
}