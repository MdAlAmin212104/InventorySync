/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
    ActionFunctionArgs,
    HeadersFunction,
    LoaderFunctionArgs,
} from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useState, useCallback } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    console.log(admin, session);
    return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    console.log(admin, session);
    return null;
};

export default function Index() {
    const [section1Open, setSection1Open] = useState(false);

    const toggleSection1 = useCallback(() => setSection1Open((v) => !v), []);

    return (
            <s-page heading="Collapsible Sections">
                <s-section>
                <s-stack gap="base" direction="block">
                    {/* Section 1 */}
                    <s-section>
                        <s-stack gap="base" direction="block">
                            <s-clickable
                                border="base"
                                padding="base"
                                background="subdued"
                                borderRadius="base"
                                onClick={toggleSection1}
                            >
                                <div style={{display: "flex", justifyContent: "space-between"}}>
                                    <s-text>Section 1</s-text>
                                    <s-text>Totle Inventory</s-text>
                                </div>
                            </s-clickable>

                            {section1Open && (
                                <s-box padding="base" background="subdued" borderRadius="base">
                                    <s-text>
                                        This is the content of Section 1. You can add any content here
                                        like forms, data tables, or additional information.
                                    </s-text>
                                </s-box>
                            )}
                        </s-stack>
                    </s-section>
                </s-stack>
                </s-section>
            </s-page>
    );
}

export const headers: HeadersFunction = (headersArgs) => {
    return boundary.headers(headersArgs);
};