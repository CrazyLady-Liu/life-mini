export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: string; label: string }[]
): void => {
  const headerRow = columns.map((col) => col.label).join(',');
  const dataRows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value ?? '';
    }).join(',')
  );
  
  const csvContent = [headerRow, ...dataRows].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = <T>(data: T, filename: string): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface VoucherExportItem {
  description: string;
  amount: number;
  remark?: string;
}

export interface VoucherExportData {
  voucherNo: string;
  type: 'receipt' | 'payment';
  customerName: string;
  rentalId: string;
  operator: string;
  issuedAt: string;
  amount: number;
  items: VoucherExportItem[];
}

export const exportVoucherHTML = (voucher: VoucherExportData): void => {
  const typeLabel = voucher.type === 'receipt' ? '收款凭证' : '付款凭证';
  const amountText = voucher.type === 'receipt' 
    ? `¥${voucher.amount.toFixed(2)}` 
    : `¥${voucher.amount.toFixed(2)}`;
  
  const itemsHTML = voucher.items.map((item, index) => `
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center;">${index + 1}</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: right;">¥${item.amount.toFixed(2)}</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${item.remark || '-'}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${typeLabel}-${voucher.voucherNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Microsoft YaHei", "SimHei", sans-serif; padding: 40px; background: #f5f5f5; }
    .voucher-container { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #ddd; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .voucher-header { text-align: center; margin-bottom: 30px; }
    .voucher-title { font-size: 24px; font-weight: bold; color: #111; margin-bottom: 8px; }
    .voucher-no { font-size: 14px; color: #666; }
    .voucher-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 14px; }
    .info-item { display: flex; gap: 8px; }
    .info-label { color: #666; flex-shrink: 0; }
    .info-value { color: #111; font-weight: 500; }
    .voucher-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
    .voucher-table th { background: #f9fafb; padding: 10px 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; text-align: left; }
    .voucher-table .amount-col { text-align: right; }
    .total-row { font-weight: bold; background: #f9fafb; }
    .total-amount { font-size: 16px; color: ${voucher.type === 'receipt' ? '#059669' : '#dc2626'}; }
    .voucher-footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 14px; color: #666; }
    .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-item { text-align: center; }
    .signature-line { width: 120px; border-bottom: 1px solid #333; margin: 0 auto 8px; height: 40px; }
    @media print {
      body { padding: 0; background: #fff; }
      .voucher-container { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="voucher-container">
    <div class="voucher-header">
      <div class="voucher-title">${typeLabel}</div>
      <div class="voucher-no">凭证编号：${voucher.voucherNo}</div>
    </div>
    
    <div class="voucher-info">
      <div class="info-item">
        <span class="info-label">客户名称：</span>
        <span class="info-value">${voucher.customerName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">关联单号：</span>
        <span class="info-value">${voucher.rentalId}</span>
      </div>
      <div class="info-item">
        <span class="info-label">开单日期：</span>
        <span class="info-value">${voucher.issuedAt}</span>
      </div>
      <div class="info-item">
        <span class="info-label">操作人：</span>
        <span class="info-value">${voucher.operator}</span>
      </div>
    </div>
    
    <table class="voucher-table">
      <thead>
        <tr>
          <th style="width: 60px; text-align: center;">序号</th>
          <th>项目说明</th>
          <th style="width: 120px;" class="amount-col">金额</th>
          <th style="width: 150px;">备注</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
        <tr class="total-row">
          <td colspan="2" style="padding: 10px 12px; border: 1px solid #e5e7eb; text-align: right;">合计金额：</td>
          <td class="amount-col total-amount" style="padding: 10px 12px; border: 1px solid #e5e7eb;">${amountText}</td>
          <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">元</td>
        </tr>
      </tbody>
    </table>
    
    <div class="voucher-footer">
      <div>金额大写：<span style="font-weight: 500; color: #111;">${numberToChinese(voucher.amount)}</span></div>
    </div>
    
    <div class="signature-section">
      <div class="signature-item">
        <div class="signature-line"></div>
        <div>制单人</div>
      </div>
      <div class="signature-item">
        <div class="signature-line"></div>
        <div>审核人</div>
      </div>
      <div class="signature-item">
        <div class="signature-line"></div>
        <div>收款人</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${typeLabel}_${voucher.voucherNo}.html`;
  link.click();
  URL.revokeObjectURL(url);
};

function numberToChinese(num: number): string {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];
  
  if (num === 0) return '零元整';
  
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  
  let result = '';
  const intStr = intPart.toString();
  const len = intStr.length;
  
  let zeroFlag = false;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(intStr[i]);
    const pos = len - i - 1;
    const unitPos = pos % 4;
    const bigUnitPos = Math.floor(pos / 4);
    
    if (digit === 0) {
      zeroFlag = true;
      if (unitPos === 0 && bigUnitPos > 0) {
        result += bigUnits[bigUnitPos];
        zeroFlag = false;
      }
    } else {
      if (zeroFlag) {
        result += '零';
        zeroFlag = false;
      }
      result += digits[digit] + units[unitPos];
      if (unitPos === 0 && bigUnitPos > 0) {
        result += bigUnits[bigUnitPos];
      }
    }
  }
  
  result += '元';
  
  if (decPart === 0) {
    result += '整';
  } else {
    const jiao = Math.floor(decPart / 10);
    const fen = decPart % 10;
    if (jiao > 0) result += digits[jiao] + '角';
    if (fen > 0) result += digits[fen] + '分';
  }
  
  return result;
}

