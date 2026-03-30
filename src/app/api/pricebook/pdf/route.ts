import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getPartFlatRate, formatCurrency, pricebookToPricingConfig } from '@/lib/pricing';
import type { Pricebook, Category, Part, PricingConfig } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pricebookId = searchParams.get('pricebookId');

  if (!pricebookId) {
    return new Response(JSON.stringify({ error: 'pricebookId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = await createClient();

  // Verify authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch pricebook and verify ownership
  const { data: pricebook, error: pricebookError } = await supabase
    .from('pricebooks')
    .select('*')
    .eq('id', pricebookId)
    .eq('user_id', user.id)
    .single();

  if (pricebookError || !pricebook) {
    return new Response(
      JSON.stringify({ error: 'Pricebook not found or access denied' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch categories and parts
  const [categoriesRes, partsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('pricebook_id', pricebookId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('parts')
      .select('*')
      .eq('pricebook_id', pricebookId)
      .order('name', { ascending: true }),
  ]);

  const categories: Category[] = categoriesRes.data ?? [];
  const parts: Part[] = partsRes.data ?? [];

  const pricingConfig = pricebookToPricingConfig(pricebook as Pricebook);

  // Group parts by category
  const categoryMap = new Map<string, Category>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  const partsByCategory = new Map<string, Part[]>();
  const uncategorizedParts: Part[] = [];

  for (const part of parts) {
    if (part.category_id && categoryMap.has(part.category_id)) {
      const existing = partsByCategory.get(part.category_id) ?? [];
      existing.push(part);
      partsByCategory.set(part.category_id, existing);
    } else {
      uncategorizedParts.push(part);
    }
  }

  // Generate PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors
  const navyR = 30,
    navyG = 41,
    navyB = 59;
  const orangeR = 249,
    orangeG = 115,
    orangeB = 22;

  // ── Header ──
  doc.setFillColor(navyR, navyG, navyB);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(pricebook.name, margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const tradeLabel = (pricebook as Pricebook).trade.toUpperCase();
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`${tradeLabel} Pricebook  |  Generated ${dateStr}`, margin, 27);

  // ── Pricing summary bar ──
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 35, pageWidth, 12, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(
    `Labor Rate: ${formatCurrency(pricingConfig.laborRate)}/hr   |   Parts Markup: ${pricingConfig.partsMarkup}%   |   Tax Rate: ${pricingConfig.taxRate}%`,
    margin,
    42.5
  );

  let yPos = 55;

  // Helper to render a category section
  function renderCategorySection(
    categoryName: string,
    categoryParts: Part[],
    config: PricingConfig
  ) {
    if (categoryParts.length === 0) return;

    // Check if we need a new page (need at least 40mm for header + one row)
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Category header
    doc.setFillColor(orangeR, orangeG, orangeB);
    doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(categoryName, margin + 3, yPos);
    yPos += 8;

    // Table data
    const tableData = categoryParts.map((part) => {
      const flatRate = getPartFlatRate(part, config);
      return [
        part.name,
        part.part_number ?? '-',
        part.description ?? '-',
        formatCurrency(flatRate, (pricebook as Pricebook).currency),
      ];
    });

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Item', 'Part #', 'Description', 'Flat Rate Price']],
      body: tableData,
      headStyles: {
        fillColor: [navyR, navyG, navyB],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 28 },
        2: { cellWidth: 62 },
        3: {
          cellWidth: 30,
          halign: 'right',
          fontStyle: 'bold',
          textColor: [orangeR, orangeG, orangeB],
        },
      },
      didDrawPage: () => {
        // Footer on every page
        addPageFooter(doc);
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Render each category
  for (const cat of categories) {
    const catParts = partsByCategory.get(cat.id) ?? [];
    const config: PricingConfig = {
      laborRate: cat.labor_rate_override ?? pricingConfig.laborRate,
      partsMarkup: cat.parts_markup_override ?? pricingConfig.partsMarkup,
      materialsMarkup: pricingConfig.materialsMarkup,
      taxRate: pricingConfig.taxRate,
    };
    renderCategorySection(cat.name, catParts, config);
  }

  // Render uncategorized parts
  if (uncategorizedParts.length > 0) {
    renderCategorySection('Uncategorized', uncategorizedParts, pricingConfig);
  }

  // Add footer to last page (in case autoTable didn't trigger didDrawPage)
  addPageFooter(doc);

  // Return PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pricebook.name}.pdf"`,
    },
  });
}

function addPageFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();
  const currentPage = doc.getCurrentPageInfo().pageNumber;

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Page ${currentPage} of ${pageCount}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
  doc.text('Generated by TradeBooks', 15, pageHeight - 8);
}
