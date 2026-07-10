import niftyUniverse from "@/data/nifty100.json";

export interface CanonicalStock {
  id: string;
  symbol: string; // e.g. "TCS.NS"
  ticker: string; // e.g. "TCS"
  exchange: "NSE" | "BSE";
  country: "India";
  companyName: string;
  sector: string;
  industry: string;
  isin: string;
  logoUrl: string;
}

// Map of base tickers to domains and official names to avoid any ticker collisions
const COMPANY_REGISTRY: Record<
  string,
  { name: string; domain: string; isin: string; industry: string }
> = {
  RELIANCE: { name: "Reliance Industries Limited", domain: "ril.com", isin: "INE002A01018", industry: "Oil & Gas" },
  TCS: { name: "Tata Consultancy Services Limited", domain: "tcs.com", isin: "INE467B01029", industry: "IT Consulting & Software" },
  HDFCBANK: { name: "HDFC Bank Limited", domain: "hdfcbank.com", isin: "INE040A01034", industry: "Banking & Financials" },
  INFY: { name: "Infosys Limited", domain: "infosys.com", isin: "INE009A01021", industry: "IT Consulting & Software" },
  ICICIBANK: { name: "ICICI Bank Limited", domain: "icicibank.com", isin: "INE090A01021", industry: "Banking & Financials" },
  HINDUNILVR: { name: "Hindustan Unilever Limited", domain: "hul.co.in", isin: "INE030A01027", industry: "FMCG / Cosmetics" },
  ITC: { name: "ITC Limited", domain: "itcportal.com", isin: "INE154A01025", industry: "FMCG / Tobacco" },
  SBIN: { name: "State Bank of India", domain: "sbi.co.in", isin: "INE062A01020", industry: "Banking & Financials" },
  BHARTIARTL: { name: "Bharti Airtel Limited", domain: "airtel.in", isin: "INE397D01024", industry: "Telecommunication" },
  KOTAKBANK: { name: "Kotak Mahindra Bank Limited", domain: "kotak.com", isin: "INE237A01028", industry: "Banking & Financials" },
  LT: { name: "Larsen & Toubro Limited", domain: "larsentoubro.com", isin: "INE018A01030", industry: "Engineering & Construction" },
  AXISBANK: { name: "Axis Bank Limited", domain: "axisbank.com", isin: "INE238A01034", industry: "Banking & Financials" },
  ASIANPAINT: { name: "Asian Paints Limited", domain: "asianpaints.com", isin: "INE021A01026", industry: "Paints & Chemicals" },
  MARUTI: { name: "Maruti Suzuki India Limited", domain: "marutisuzuki.com", isin: "INE585B01010", industry: "Automobile" },
  SUNPHARMA: { name: "Sun Pharmaceutical Industries Limited", domain: "sunpharma.com", isin: "INE044A01045", industry: "Pharmaceuticals" },
  TITAN: { name: "Titan Company Limited", domain: "titan.co.in", isin: "INE280A01028", industry: "Consumer Goods / Luxury" },
  BAJFINANCE: { name: "Bajaj Finance Limited", domain: "bajajfinserv.in", isin: "INE296A01024", industry: "Financial Services" },
  WIPRO: { name: "Wipro Limited", domain: "wipro.com", isin: "INE075A01022", industry: "IT Consulting & Software" },
  ULTRACEMCO: { name: "UltraTech Cement Limited", domain: "ultratechcement.com", isin: "INE481G01011", industry: "Cement & Materials" },
  NESTLEIND: { name: "Nestle India Limited", domain: "nestle.in", isin: "INE239A01016", industry: "Food Processing" },
  POWERGRID: { name: "Power Grid Corporation of India Limited", domain: "powergrid.in", isin: "INE752E01010", industry: "Power Transmission" },
  NTPC: { name: "NTPC Limited", domain: "ntpc.co.in", isin: "INE733E01010", industry: "Power Generation" },
  "M&M": { name: "Mahindra & Mahindra Limited", domain: "mahindra.com", isin: "INE101A01026", industry: "Automobile" },
  HCLTECH: { name: "HCL Technologies Limited", domain: "hcltech.com", isin: "INE860A01027", industry: "IT Consulting & Software" },
  TECHM: { name: "Tech Mahindra Limited", domain: "techmahindra.com", isin: "INE669C01036", industry: "IT Consulting & Software" },
  TATAMOTORS: { name: "Tata Motors Limited", domain: "tatamotors.com", isin: "INE155A01022", industry: "Automobile" },
  ADANIENT: { name: "Adani Enterprises Limited", domain: "adanienterprises.com", isin: "INE423A01024", industry: "Conglomerate" },
  ADANIPORTS: { name: "Adani Ports and Special Economic Zone Limited", domain: "adaniports.com", isin: "INE742F01042", industry: "Port Infrastructure" },
  JSWSTEEL: { name: "JSW Steel Limited", domain: "jsw.in", isin: "INE019A01030", industry: "Metals & Mining" },
  TATASTEEL: { name: "Tata Steel Limited", domain: "tatasteel.com", isin: "INE081A01012", industry: "Metals & Mining" },
  INDUSINDBK: { name: "IndusInd Bank Limited", domain: "indusind.com", isin: "INE095A01012", industry: "Banking & Financials" },
  BAJAJFINSV: { name: "Bajaj Finserv Limited", domain: "bajajfinserv.in", isin: "INE918I01018", industry: "Financial Services" },
  HAL: { name: "Hindustan Aeronautics Limited", domain: "hal-india.co.in", isin: "INE066F01012", industry: "Defense & Aerospace" },
  BEL: { name: "Bharat Electronics Limited", domain: "bel-india.in", isin: "INE263A01024", industry: "Defense Electronics" },
  COALINDIA: { name: "Coal India Limited", domain: "coalindia.in", isin: "INE522F01014", industry: "Mining" },
  ONGC: { name: "Oil and Natural Gas Corporation Limited", domain: "ongcindia.com", isin: "INE213A01029", industry: "Oil & Gas Exploration" },
  GRASIM: { name: "Grasim Industries Limited", domain: "grasim.com", isin: "INE047A01021", industry: "Cement & Textiles" },
  DRREDDY: { name: "Dr. Reddy's Laboratories Limited", domain: "drreddys.com", isin: "INE089A01023", industry: "Pharmaceuticals" },
  CIPLA: { name: "Cipla Limited", domain: "cipla.com", isin: "INE059A01026", industry: "Pharmaceuticals" },
  EICHERMOT: { name: "Eicher Motors Limited", domain: "eicher.in", isin: "INE066A01013", industry: "Automobile" },
  HEROMOTOCO: { name: "Hero MotoCorp Limited", domain: "heromotocorp.com", isin: "INE158A01026", industry: "Automobile" },
  DIVISLAB: { name: "Divi's Laboratories Limited", domain: "divislabs.com", isin: "INE361B01024", industry: "Pharmaceuticals" },
  APOLLOHOSP: { name: "Apollo Hospitals Enterprise Limited", domain: "apollohospitals.com", isin: "INE439A01020", industry: "Healthcare & Hospitals" },
  SBILIFE: { name: "SBI Life Insurance Company Limited", domain: "sbilife.co.in", isin: "INE123W01016", industry: "Insurance" },
  HDFCLIFE: { name: "HDFC Life Insurance Company Limited", domain: "hdfclife.com", isin: "INE795G01014", industry: "Insurance" },
  TRENT: { name: "Trent Limited", domain: "mywestside.com", isin: "INE848E01016", industry: "Retail" },
  DIXON: { name: "Dixon Technologies (India) Limited", domain: "dixoninfo.com", isin: "INE835R01011", industry: "Consumer Electronics" },
  POLYCAB: { name: "Polycab India Limited", domain: "polycab.com", isin: "INE455K01017", industry: "Cables & Electricals" },
  PERSISTENT: { name: "Persistent Systems Limited", domain: "persistent.com", isin: "INE620B01019", industry: "IT Consulting & Software" },
  COFORGE: { name: "Coforge Limited", domain: "coforge.com", isin: "INE541A01011", industry: "IT Consulting & Software" },
  CGPOWER: { name: "CG Power and Industrial Solutions Limited", domain: "cgpower.com", isin: "INE067A01029", industry: "Electrical Equipments" },
  BSE: { name: "BSE Limited", domain: "bseindia.com", isin: "INE118H01025", industry: "Capital Markets" },
  KEI: { name: "KEI Industries Limited", domain: "kei-ind.com", isin: "INE878B01027", industry: "Cables & Wires" },
  KPIGREEN: { name: "KPI Green Energy Limited", domain: "kpigreenenergy.in", isin: "INE542W01017", industry: "Renewables / Power" },
};

export class CompanyMetadataService {
  /**
   * Retrieves canonical stock details using symbol/ticker.
   * Ensures Indian stocks are correctly resolved with no US collisions.
   */
  static resolveStock(ticker: string): CanonicalStock {
    const baseTicker = ticker.replace(/\.NS$|\.BO$/i, "").toUpperCase();
    const registryEntry = COMPANY_REGISTRY[baseTicker];

    // Read default values from JSON universe or fallback
    const universeEntry = (niftyUniverse as Array<{ ticker: string; company: string; sector: string }>).find(
      (u) => u.ticker.toUpperCase() === baseTicker
    );

    const companyName = registryEntry?.name || universeEntry?.company || `${baseTicker} Limited`;
    const domain = registryEntry?.domain || "";
    const isin = registryEntry?.isin || "INE000000000";
    const sector = universeEntry?.sector || "Other";
    const industry = registryEntry?.industry || sector;

    // Use clearbit as the production-grade logo provider resolved by official domain
    // If not verified in our registry, set to empty to display the circular initials fallback avatar
    const logoUrl = domain
      ? `https://logo.clearbit.com/${domain}`
      : "";

    return {
      id: `${baseTicker}-NSE-India`,
      symbol: `${baseTicker}.NS`,
      ticker: baseTicker,
      exchange: "NSE",
      country: "India",
      companyName,
      sector,
      industry,
      isin,
      logoUrl,
    };
  }

  /**
   * Cleans and returns the official company name.
   */
  static getOfficialName(ticker: string, rawName?: string): string {
    const baseTicker = ticker.replace(/\.NS$|\.BO$/i, "").toUpperCase();
    const entry = COMPANY_REGISTRY[baseTicker];
    if (entry) return entry.name;
    
    if (!rawName) return `${baseTicker} Limited`;
    
    // Fallback cleanup if name is not in registry
    let cleanName = rawName;
    // Replace standard contractions
    cleanName = cleanName
      .replace(/\bLTD\b\.?/gi, "Limited")
      .replace(/\bLT\b\.?/gi, "Limited")
      .replace(/\bSERV\b\.?/gi, "Services")
      .replace(/\bIND\b\.?/gi, "Industries")
      .replace(/\bCORP\b\.?/gi, "Corporation");
      
    return cleanName;
  }
}

export class LogoService {
  private static logoCache: Record<string, string> = {};

  /**
   * Resolves logo URL using validated parameters.
   */
  static getLogoUrl(ticker: string): string {
    const baseTicker = ticker.replace(/\.NS$|\.BO$/i, "").toUpperCase();
    if (this.logoCache[baseTicker]) {
      return this.logoCache[baseTicker];
    }

    const canonical = CompanyMetadataService.resolveStock(baseTicker);
    this.logoCache[baseTicker] = canonical.logoUrl;
    return canonical.logoUrl;
  }
}

export class StockResolver {
  /**
   * Resolves clean metadata and company name for views.
   */
  static resolve(ticker: string) {
    return CompanyMetadataService.resolveStock(ticker);
  }
}
