/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {Modal, TitleBar, useAppBridge} from "@shopify/app-bridge-react";


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

  const notification = () => {
    shopify.toast.show('Message sent', {duration: 1000});
  };


  const model = () => {
    console.log("Model");
    shopify.modal.show('my-modal');

  };

  return (
    <div style={{gap: "1rem", display: "flex"}}>
      <s-button onClick={selectProduct}>
      Select products
    </s-button>
    <s-button onClick={notification}>Notifications</s-button>
    <s-button onClick={model}>Model</s-button>
    <Modal id="my-modal">
      <p style={{padding: "15px"}}>Message</p>
      <TitleBar title="Title">
        <button variant="primary">Label</button>
        <button onClick={() => shopify.modal.hide('my-modal')}>Close</button>
      </TitleBar>
    </Modal>

    </div>
    
  );
}