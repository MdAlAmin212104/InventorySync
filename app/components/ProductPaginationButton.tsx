/* eslint-disable react/prop-types */

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};
const ProductPaginationButton = ({ currentPage, totalPages, setCurrentPage }: PaginationProps) => {
    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
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
    );
};

export default ProductPaginationButton;