import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./pagination.css";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = "records",
  className = ""
}) {
  const safePageSize = Math.max(1, Number(pageSize) || 25);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

  const fromItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
  const toItem = Math.min(safeCurrentPage * safePageSize, totalItems);

  // Generate smart page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const leftBound = Math.max(2, safeCurrentPage - 1);
    const rightBound = Math.min(totalPages - 1, safeCurrentPage + 1);

    pages.push(1);

    if (leftBound > 2) {
      pages.push("ellipsis-left");
    } else if (leftBound === 2) {
      pages.push(2);
    }

    for (let i = Math.max(2, leftBound); i <= rightBound; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push("ellipsis-right");
    } else if (rightBound === totalPages - 1) {
      if (!pages.includes(totalPages - 1)) pages.push(totalPages - 1);
    }

    if (!pages.includes(totalPages)) pages.push(totalPages);

    return pages;
  };

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== safeCurrentPage) {
      onPageChange?.(page);
    }
  };

  return (
    <div className={`ff-pagination-container ${className}`}>
      {/* Range Display */}
      <div className="ff-pagination-info">
        <span>
          Showing <b>{fromItem}</b>–<b>{toItem}</b> of <b>{totalItems}</b> {itemName}
        </span>
      </div>

      <div className="ff-pagination-controls">
        {/* Rows per page dropdown */}
        {onPageSizeChange && (
          <div className="ff-pagination-size-select">
            <label htmlFor="ff-page-size-select">Rows per page:</label>
            <select
              id="ff-page-size-select"
              value={safePageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange?.(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mobile current status text */}
        <span className="ff-pagination-status-mobile">
          Page {safeCurrentPage} of {totalPages}
        </span>

        {/* Navigation Buttons */}
        <div className="ff-pagination-nav">
          <button
            type="button"
            className="ff-page-btn jump-btn"
            disabled={safeCurrentPage <= 1}
            onClick={() => handlePageClick(1)}
            title="First Page"
            aria-label="First page"
          >
            <ChevronsLeft />
          </button>

          <button
            type="button"
            className="ff-page-btn"
            disabled={safeCurrentPage <= 1}
            onClick={() => handlePageClick(safeCurrentPage - 1)}
            title="Previous Page"
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>

          {/* Numbered Page Buttons */}
          {getPageNumbers().map((item, idx) => {
            if (typeof item === "string") {
              return (
                <span key={`ellipsis-${idx}`} className="ff-page-ellipsis">
                  …
                </span>
              );
            }
            return (
              <button
                key={item}
                type="button"
                className={`ff-page-btn page-num ${safeCurrentPage === item ? "active" : ""}`}
                onClick={() => handlePageClick(item)}
                aria-label={`Page ${item}`}
                aria-current={safeCurrentPage === item ? "page" : undefined}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            className="ff-page-btn"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => handlePageClick(safeCurrentPage + 1)}
            title="Next Page"
            aria-label="Next page"
          >
            <ChevronRight />
          </button>

          <button
            type="button"
            className="ff-page-btn jump-btn"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => handlePageClick(totalPages)}
            title="Last Page"
            aria-label="Last page"
          >
            <ChevronsRight />
          </button>
        </div>
      </div>
    </div>
  );
}

