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
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #1e40af;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 5px;
            }
            .invoice-title {
                font-size: 20px;
                font-weight: bold;
                margin-top: 15px;
            }
            .invoice-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding: 15px;
                background-color: #f8fafc;
                border-radius: 8px;
            }
            .invoice-details, .customer-details {
                flex: 1;
            }
            .invoice-details h3, .customer-details h3 {
                color: #1e40af;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .detail-item {
                margin-bottom: 5px;
                display: flex;
            }
            .label {
                font-weight: bold;
                width: 120px;
                color: #374151;
            }
            .value {
                color: #111827;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                border: 1px solid #e5e7eb;
            }
            .items-table th {
                background-color: #1e40af;
                color: #000000;
                padding: 12px;
                text-align: left;
                font-weight: bold;
            }
            .items-table td {
                padding: 10px 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            .items-table tr:nth-child(even) {
                background-color: #f9fafb;
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
            }
            .notes {
                margin-top: 20px;
                padding: 15px;
                background-color: #f3f4f6;
                border-radius: 6px;
                border-left: 4px solid #1e40af;
            }
            .notes h4 {
                color: #1e40af;
                margin-bottom: 8px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                background-color: #fef3c7;
                color: #92400e;
            }
            @media print {
                body {
                    padding: 0;
                }
                .header {
                    border-bottom: 2px solid #000;
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
                <strong>Số: ${sale.ma_don_hang}</strong>
            </div>
            <div style="margin-top: 5px; color: #666;">
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
                    <th>Sản phẩm</th>
                    <th style="width: 80px; text-align: center;">SL</th>
                    <th style="width: 120px; text-align: right;">Đơn giá</th>
                    <th style="width: 120px; text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                ${sale.sale_items?.map((item, index) => `
                    <tr>
                        <td>${item.products?.ten_hang || 'Sản phẩm không xác định'}</td>
                        <td class="text-center">${item.so_luong}</td>
                        <td class="text-right">${item.gia_ban.toLocaleString('vi-VN')} ₫</td>
                        <td class="text-right">${(item.thanh_tien || item.so_luong * item.gia_ban).toLocaleString('vi-VN')} ₫</td>
                    </tr>
                `).join('') || ''}
                <tr class="total-row">
                    <td colspan="3" class="text-right"><strong>TỔNG CỘNG:</strong></td>
                    <td class="text-right"><strong>${sale.tong_tien.toLocaleString('vi-VN')} ₫</strong></td>
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
