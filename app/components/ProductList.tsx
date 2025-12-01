import ProductPaginationButton from "./ProductPaginationButton";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ProductListProps = {
    currentProducts: any[];
    openProducts: any;
    toggleProduct: (id: string) => void;
    getTotalInventory: (product: any) => number;
    getAlt: (product: any) => string;
    getImage: (product: any) => string;
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

const ProductList = ({ currentProducts, openProducts, toggleProduct, getTotalInventory, getAlt, getImage, currentPage, totalPages, setCurrentPage }: ProductListProps) => {

    return (
        <div>
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
                        <ProductPaginationButton
                            currentPage={currentPage}
                            totalPages={totalPages}
                            setCurrentPage={setCurrentPage}
                        />
                    )}

                </s-stack>
            ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
                    <s-text>No products found.</s-text>
                </div>
            )}
        </div>
    );
};

export default ProductList;