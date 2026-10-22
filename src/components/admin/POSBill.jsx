"use client";

import { useRef } from "react";
import { FiPrinter, FiDownload, FiX } from "react-icons/fi";

// ============================================================
// POS BILL — Preview + Print + Download
// ============================================================

export default function POSBill({ bill, onClose }) {
  const billRef = useRef(null);

  if (!bill) return null;

  // ----------------------------------------------------------
  // PRINT
  // ----------------------------------------------------------
  const handlePrint = () => {
    const printContents = billRef.current.innerHTML;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${bill.billNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
              padding: 24px;
              color: #111;
              font-size: 13px;
            }
            h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: 2px; }
            h2 { font-size: 14px; margin: 0 0 16px; color: #666; font-weight: 500; }
            .meta { margin-bottom: 16px; line-height: 1.7; }
            .meta div { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { padding: 8px 6px; border-bottom: 1px solid #ddd; text-align: left; }
            th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
            .totals { margin-top: 16px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
            .totals .grand { font-weight: 700; font-size: 15px; border-top: 2px solid #111; padding-top: 8px; margin-top: 8px; color: #DB4444; }
            .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #888; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // ----------------------------------------------------------
  // DOWNLOAD (print-to-PDF)
  // ----------------------------------------------------------
  const handleDownload = () => {
    handlePrint();
  };

  const isWholesale = bill.customerType === "wholesale";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3 sm:px-5">
          <h3 className="text-[13px] font-semibold text-black sm:text-[14px]">
            Bill Preview
          </h3>

          <button
            onClick={onClose}
            className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Bill body */}
        <div ref={billRef} className="p-4 sm:p-6">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h1 style={{ fontSize: 20, letterSpacing: 2, margin: 0 }}>
              EXCLUSIVE
              <span style={{ color: "#DB4444" }}>.</span>
            </h1>
            <h2
              style={{
                fontSize: 14,
                color: "#666",
                fontWeight: 500,
                margin: "4px 0 0",
              }}
            >
              {isWholesale ? "Wholesale Tax Invoice" : "Retail Bill"}
            </h2>
          </div>

          <div className="meta" style={{ lineHeight: 1.7, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7A7A7A" }}>Bill No:</span>
              <strong>{bill.billNumber}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7A7A7A" }}>Date:</span>
              <span>
                {new Date(bill.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7A7A7A" }}>Customer Type:</span>
              <strong style={{ textTransform: "capitalize" }}>
                {bill.customerType}
              </strong>
            </div>
            {bill.customerName && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7A7A7A" }}>Customer:</span>
                <span>{bill.customerName}</span>
              </div>
            )}
            {bill.customerPhone && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7A7A7A" }}>Phone:</span>
                <span>{bill.customerPhone}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7A7A7A" }}>Cashier:</span>
              <span>{bill.cashierName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7A7A7A" }}>Payment:</span>
              <strong style={{ textTransform: "capitalize" }}>
                {bill.paymentMethod}
              </strong>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 6px" }}>#</th>
                  <th style={{ textAlign: "left", padding: "8px 6px" }}>
                    Product
                  </th>
                  {isWholesale && (
                    <th style={{ textAlign: "right", padding: "8px 6px" }}>
                      MRP
                    </th>
                  )}
                  {isWholesale && (
                    <th style={{ textAlign: "right", padding: "8px 6px" }}>
                      Disc
                    </th>
                  )}
                  <th style={{ textAlign: "right", padding: "8px 6px" }}>
                    Unit
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 6px" }}>
                    Qty
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 6px" }}>
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {bill.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 6px" }}>{i + 1}</td>
                    <td style={{ padding: "8px 6px" }}>{it.productName}</td>
                    {isWholesale && (
                      <td style={{ textAlign: "right", padding: "8px 6px" }}>
                        ₹{it.mrp.toLocaleString("en-IN")}
                      </td>
                    )}
                    {isWholesale && (
                      <td style={{ textAlign: "right", padding: "8px 6px" }}>
                        {it.wholesaleDiscountPercentage > 0
                          ? `${it.wholesaleDiscountPercentage}%`
                          : "—"}
                      </td>
                    )}
                    <td style={{ textAlign: "right", padding: "8px 6px" }}>
                      ₹{it.unitPrice.toLocaleString("en-IN")}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 6px" }}>
                      {it.quantity}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "8px 6px",
                        fontWeight: 600,
                      }}
                    >
                      ₹{it.lineTotal.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals" style={{ marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
              }}
            >
              <span style={{ color: "#7A7A7A" }}>Subtotal (MRP):</span>
              <span>₹{bill.subtotal.toLocaleString("en-IN")}</span>
            </div>

            {bill.discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  color: "#DB4444",
                }}
              >
                <span>Wholesale Discount:</span>
                <span>−₹{bill.discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                marginTop: 8,
                borderTop: "2px solid #111",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              <span>Total:</span>
              <span style={{ color: "#DB4444" }}>
                ₹{bill.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <p
            style={{
              marginTop: 32,
              textAlign: "center",
              fontSize: 11,
              color: "#888",
            }}
          >
            Thank you for your purchase!
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-[#E5E5E5] px-4 py-4 sm:gap-3 sm:px-5">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-4 py-2.5 text-[12px] font-semibold text-white shadow-md shadow-[#DB4444]/20 transition-all hover:bg-[#c93a3a] sm:text-[13px]"
          >
            <FiPrinter size={16} />
            Print
          </button>

          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-[12px] font-semibold text-black transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:text-[13px]"
          >
            <FiDownload size={16} />
            Download
          </button>

          <button
            onClick={onClose}
            className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-[12px] font-medium text-[#7A7A7A] transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:text-[13px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
