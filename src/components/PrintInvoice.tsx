import React from 'react';
import { SaleWithDetails } from '@/hooks/useSales';

interface PrintInvoiceProps {
  sale: SaleWithDetails;
  onClose: () => void;
}

export const PrintInvoice: React.FC<PrintInvoiceProps> = ({ sale, onClose }) => {
  React.useEffect(() => {
    const printContent = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const invoiceHTML = generateInvoiceHTML(sale);
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      onClose();
    };

    printContent();
  }, [sale, onClose]);

  return null;
};

const generateInvoiceHTML = (sale: SaleWithDetails): string => {
  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Hóa đơn #${sale.ma_don_hang}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.4;
                color: #333;
                max-width: 302px; /* 8cm */
                margin: 0 auto;
                padding: 10px;
                font-size: 13px;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }
            .company-name {
                font-size: 18px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 3px;
            }
            .invoice-title {
                font-size: 16px;
                font-weight: bold;
                margin-top: 8px;
            }
            .invoice-info {
                margin-bottom: 15px;
                padding: 8px;
                background-color: #f8fafc;
                border-radius: 4px;
            }
            .customer-details h3 {
                color: #1e40af;
                margin-bottom: 6px;
                font-size: 15px;
            }
            .detail-item {
                margin-bottom: 3px;
                display: flex;
                font-size: 13px;
            }
            .label {
                font-weight: bold;
                width: 70px;
                color: #374151;
                font-size: 13px;
            }
            .value {
                color: #111827;
                flex: 1;
                font-size: 13px;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                border: 1px solid #e5e7eb;
                font-size: 13px;
            }
            .items-table th {
                background-color: #1e40af;
                color: #000000;
                padding: 4px;
                text-align: left;
                font-weight: bold;
            }
            .items-table td {
                padding: 3px 4px;
                border-bottom: 1px solid #e5e7eb;
            }
            .product-name {
                font-weight: 500;
                padding: 3px 4px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
            }
            .product-details {
                background-color: #f9fafb;
            }
            .product-details td {
                border-bottom: none;
                font-size: 13px;
            }
            .text-right {
                text-align: right;
            }
            .text-center {
                text-align: center;
            }
            .total-row {
                background-color: #1e40af !important;
                color: #000000 !important;
                font-weight: bold;
            }
            .total-row td {
                border-bottom: none !important;
                padding: 6px 4px;
            }
            .notes {
                margin-top: 10px;
                padding: 8px;
                background-color: #f3f4f6;
                border-radius: 4px;
                border-left: 3px solid #1e40af;
                font-size: 13px;
            }
            .notes h4 {
                color: #1e40af;
                margin-bottom: 4px;
                font-size: 14px;
            }
            .footer {
                margin-top: 15px;
                text-align: center;
                padding-top: 10px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 12px;
            }
            .status-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
                background-color: #fef3c7;
                color: #92400e;
            }
            @media print {
                body {
                    padding: 0;
                    width: 302px; /* 8cm */
                }
                .header {
                    border-bottom: 1px solid #000;
                }
                .items-table th {
                    background-color: #000 !important;
                    color: #000000 !important;
                }
                .total-row {
                    background-color: #000 !important;
                    color: #000000 !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">Ánh Tuyết Cosmetics</div>
            <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
            <div style="margin-top: 10px;">
                <strong style="font-size: 15px;">Số: ${sale.ma_don_hang}</strong>
            </div>
            <div style="margin-top: 5px; color: #000; font-size: 14px;">
                Ngày: ${sale.ngay_ban ? new Date(sale.ngay_ban).toLocaleDateString('vi-VN') : 'N/A'}
            </div>
        </div>

        <div class="invoice-info">
            <div class="customer-details">
                <h3>Thông tin khách hàng</h3>
                <div class="detail-item">
                    <span class="label">Tên:</span>
                    <span class="value">${sale.customers?.ten_khach_hang || 'Khách lẻ'}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Điện thoại:</span>
                    <span class="value">${sale.customers?.dien_thoai || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Địa chỉ:</span>
                    <span class="value">${sale.customers?.dia_chi || 'N/A'}</span>
                </div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th colspan="4">Sản phẩm</th>
                </tr>
                <tr>
                    <th style="width: 40%;">Đơn giá</th>
                    <th style="width: 20%; text-align: center;">SL</th>
                    <th style="width: 40%; text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                ${sale.sale_items?.map((item, index) => `
                    <tr>
                        <td colspan="4" class="product-name">${item.products?.ten_hang || 'Sản phẩm không xác định'}</td>
                    </tr>
                    <tr class="product-details">
                        <td>${item.gia_ban.toLocaleString('vi-VN')} ₫</td>
                        <td class="text-center">${item.so_luong}</td>
                        <td class="text-right">${(item.thanh_tien || item.so_luong * item.gia_ban).toLocaleString('vi-VN')} ₫</td>
                    </tr>
                `).join('') || ''}
                <tr class="product-details">
                    <td colspan="2" class="text-right">Tổng tiền hàng:</td>
                    <td class="text-right">${sale.tong_tien.toLocaleString('vi-VN')} ₫</td>
                </tr>
                ${sale.giam_gia_so_tien ? `
                    <tr class="product-details">
                        <td colspan="2" class="text-right">Giảm giá:</td>
                        <td class="text-right text-red-600">-${sale.giam_gia_so_tien.toLocaleString('vi-VN')} ₫</td>
                    </tr>
                ` : ''}
                <tr class="total-row">
                    <td colspan="2" class="text-right"><strong>TỔNG CỘNG:</strong></td>
                    <td class="text-right"><strong>${sale.thanh_tien.toLocaleString('vi-VN')} ₫</strong></td>
                </tr>
            </tbody>
        </table>

        ${sale.ghi_chu ? `
            <div class="notes">
                <h4>Ghi chú đơn hàng:</h4>
                <p>${sale.ghi_chu}</p>
            </div>
        ` : ''}

        <div class="footer">
            <p>Cảm ơn quý khách đã mua hàng!</p>
            <p>Hóa đơn được in vào ${new Date().toLocaleString('vi-VN')}</p>
        </div>
    </body>
    </html>
  `;
};
