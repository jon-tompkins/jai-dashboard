import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
  date: string;
  account: string;
  action: string;
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  amount: number;
  source: 'fidelity' | 'etrade';
}

interface Position {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
  account: string;
  isOption: boolean;
  optionDetails?: {
    type: 'call' | 'put';
    strike: number;
    expiry: string;
    underlying: string;
  };
}

function parseFidelityCSV(content: string): Transaction[] {
  const lines = content.split('\n');
  const transactions: Transaction[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV (handle quoted fields)
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    const [date, account, , action, symbol, description, , priceStr, qtyStr, , , , amountStr] = fields;
    
    if (!symbol || symbol === 'No Description') continue;
    
    // Clean symbol (remove leading dash for options)
    const cleanSymbol = symbol.startsWith('-') ? symbol.slice(1) : symbol;
    
    // Parse numbers
    const quantity = parseFloat(qtyStr) || 0;
    const price = parseFloat(priceStr) || 0;
    const amount = parseFloat(amountStr?.replace(/[+,]/g, '')) || 0;
    
    if (quantity === 0 && amount === 0) continue;
    
    transactions.push({
      date,
      account: account?.replace(/"/g, '') || 'Fidelity',
      action,
      symbol: cleanSymbol,
      description,
      quantity,
      price,
      amount,
      source: 'fidelity',
    });
  }
  
  return transactions;
}

function parseETradeXLSX(buffer: ArrayBuffer): Transaction[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  const transactions: Transaction[] = [];
  
  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]?.[0] === 'Activity/Trade Date') {
      headerIdx = i;
      break;
    }
  }
  
  if (headerIdx === -1) return [];
  
  // Parse data rows
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    
    const [date, , , action, description, symbol, , qtyRaw, priceRaw, amountRaw] = row;
    
    if (!symbol || symbol === '--') continue;
    
    const quantity = parseFloat(qtyRaw) || 0;
    const price = parseFloat(priceRaw) || 0;
    const amount = parseFloat(amountRaw) || 0;
    
    transactions.push({
      date: String(date),
      account: 'E*Trade',
      action: String(action),
      symbol: String(symbol),
      description: String(description),
      quantity,
      price,
      amount,
      source: 'etrade',
    });
  }
  
  return transactions;
}

function isOptionSymbol(symbol: string, description: string): boolean {
  // Options have complex symbols or descriptions with PUT/CALL
  return description?.includes('PUT') || 
         description?.includes('CALL') ||
         symbol.match(/\d{6}[CP]\d+/) !== null;
}

function parseOptionDetails(symbol: string, description: string): Position['optionDetails'] | undefined {
  // Try to parse option details from description
  // Format: "PUT (IBIT) ISHARES BITCOIN MAR 20 26 $44"
  const putMatch = description?.match(/PUT\s+\((\w+)\).*?(\w+)\s+(\d+)\s+(\d+)\s+\$(\d+(?:\.\d+)?)/i);
  const callMatch = description?.match(/CALL\s+\((\w+)\).*?(\w+)\s+(\d+)\s+(\d+)\s+\$(\d+(?:\.\d+)?)/i);
  
  const match = putMatch || callMatch;
  if (match) {
    const [, underlying, month, day, year, strike] = match;
    return {
      type: putMatch ? 'put' : 'call',
      strike: parseFloat(strike),
      expiry: `20${year}-${month}-${day}`, // Simplified
      underlying,
    };
  }
  
  return undefined;
}

function aggregateToPositions(transactions: Transaction[]): Position[] {
  const positionMap = new Map<string, Position>();
  
  for (const tx of transactions) {
    const isOption = isOptionSymbol(tx.symbol, tx.description);
    const key = `${tx.symbol}-${tx.account}`;
    
    const existing = positionMap.get(key);
    
    if (existing) {
      // Update position
      const newQty = existing.quantity + tx.quantity;
      if (tx.quantity > 0) {
        // Buy - update cost basis
        existing.costBasis = (existing.costBasis * existing.quantity + Math.abs(tx.amount)) / newQty;
      }
      existing.quantity = newQty;
    } else {
      // New position
      positionMap.set(key, {
        symbol: tx.symbol,
        name: tx.description,
        quantity: tx.quantity,
        costBasis: tx.quantity !== 0 ? Math.abs(tx.amount / tx.quantity) : tx.price,
        account: tx.account,
        isOption,
        optionDetails: isOption ? parseOptionDetails(tx.symbol, tx.description) : undefined,
      });
    }
  }
  
  // Filter out closed positions (quantity ~= 0)
  return Array.from(positionMap.values()).filter(p => Math.abs(p.quantity) > 0.0001);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    const allTransactions: Transaction[] = [];
    
    for (const file of files) {
      const content = await file.arrayBuffer();
      
      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(content);
        const txs = parseFidelityCSV(text);
        allTransactions.push(...txs);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const txs = parseETradeXLSX(content);
        allTransactions.push(...txs);
      }
    }
    
    // Aggregate to positions
    const positions = aggregateToPositions(allTransactions);
    
    // Upsert to database
    let inserted = 0;
    let updated = 0;
    
    for (const pos of positions) {
      const { data: existing } = await supabase
        .from('positions')
        .select('id')
        .eq('symbol', pos.symbol)
        .eq('account', pos.account)
        .single();
      
      const record = {
        symbol: pos.symbol,
        name: pos.name?.slice(0, 100) || pos.symbol,
        type: pos.isOption ? 'option' : 'equity',
        units: pos.quantity,
        cost_basis: pos.costBasis,
        account: pos.account,
        source: 'import',
        option_type: pos.optionDetails?.type,
        strike_price: pos.optionDetails?.strike,
        expiry_date: pos.optionDetails?.expiry,
      };
      
      if (existing) {
        await supabase.from('positions').update(record).eq('id', existing.id);
        updated++;
      } else {
        await supabase.from('positions').insert(record);
        inserted++;
      }
    }
    
    return NextResponse.json({
      success: true,
      transactions_parsed: allTransactions.length,
      positions_calculated: positions.length,
      inserted,
      updated,
      positions: positions.map(p => ({
        symbol: p.symbol,
        quantity: p.quantity,
        costBasis: p.costBasis,
        account: p.account,
        isOption: p.isOption,
      })),
    });
    
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
