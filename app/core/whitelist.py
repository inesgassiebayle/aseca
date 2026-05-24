# S&P 500 companies — used as the price batch whitelist.
# Updated based on index composition as of 2024.
TICKER_WHITELIST = [
    # Technology
    "AAPL", "MSFT", "NVDA", "AVGO", "ORCL", "CRM", "ADBE", "AMD", "QCOM",
    "TXN", "INTC", "AMAT", "LRCX", "KLAC", "MU", "ADI", "MCHP", "CDNS",
    "SNPS", "NXPI", "FTNT", "PANW", "CRWD", "CTSH", "IT", "EPAM",
    "PTC", "AKAM", "SWKS", "QRVO", "TER", "KEYS", "TRMB",
    # Communication Services
    "GOOGL", "GOOG", "META", "NFLX", "DIS", "CMCSA", "T", "VZ", "TMUS",
    "CHTR", "NDAQ", "OMC", "NWS", "NWSA", "FOX", "FOXA", "LYV",
    "WBD", "MTCH",
    # Consumer Discretionary
    "AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "TJX", "BKNG",
    "LOW", "TGT", "GM", "F", "ROST", "ORLY", "AZO", "DHI", "LEN", "NVR",
    "PHM", "CCL", "RCL", "NCLH", "LVS", "WYNN", "MGM", "EXPE", "ULTA",
    "TPR", "RL", "PVH", "HAS", "MAT", "YUM", "DPZ", "CMG", "MHK", "WHR",
    "LKQ", "KMX",
    # Consumer Staples
    "WMT", "PG", "KO", "PEP", "COST", "PM", "MO", "MDLZ", "CL", "GIS",
    "KMB", "SJM", "HSY", "MKC", "HRL", "CPB", "CAG", "TAP", "KHC",
    "CHD", "CLX", "EL", "KVUE",
    # Energy
    "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "DVN",
    "HAL", "OXY", "BKR", "FANG", "APA", "CTRA", "OKE", "WMB",
    "KMI", "TRGP",
    # Financials
    "JPM", "BAC", "WFC", "GS", "MS", "C", "BLK", "SCHW", "AXP", "COF",
    "USB", "PNC", "TFC", "BK", "STT", "MTB", "CFG", "HBAN", "RF", "KEY",
    "SYF", "V", "MA", "PYPL", "FIS", "CPRT", "BR",
    "IVZ", "BEN", "RJF", "AMP", "PRU", "MET", "AFL", "ALL", "TRV", "CB",
    "PGR", "HIG", "WRB", "ACGL", "AIG", "L", "AIZ", "UNM",
    # Health Care
    "JNJ", "LLY", "UNH", "ABBV", "MRK", "ABT", "TMO", "DHR", "PFE",
    "AMGN", "BMY", "GILD", "CVS", "CI", "MCK", "CAH", "ISRG",
    "MDT", "EW", "SYK", "BSX", "ZBH", "BDX", "HOLX", "BAX", "RMD",
    "IDXX", "PODD", "DXCM", "IQV", "LH", "DGX", "RVTY", "CRL", "MTD",
    "TECH", "BIO", "REGN", "BIIB", "MRNA", "VRTX", "INCY", "ALNY",
    "VTRS", "PFG",
    # Industrials
    "GE", "CAT", "HON", "BA", "RTX", "LMT", "NOC", "GD", "TDG",
    "TT", "EMR", "ETN", "ROK", "AME", "PH", "IR", "SWK", "SNA", "ITW",
    "GPC", "MMM", "PCAR", "DE", "FDX", "UPS", "DAL", "UAL", "LUV", "AAL",
    "EXPD", "CHRW", "JBHT", "XYL", "NDSN", "GWW", "MSI", "OTIS", "CARR",
    "LDOS", "BAH", "SAIC", "HII", "AXON", "WAB", "GEV", "GEHC",
    # Information Technology (additional)
    "IBM", "HPQ", "HPE", "CSCO", "ANET", "WDC", "STX", "NTAP", "CDW",
    "FFIV", "JKHY", "ADSK", "INTU", "PAYC", "PAYX",
    # Materials
    "LIN", "APD", "SHW", "ECL", "PPG", "NEM", "FCX", "NUE", "STLD", "RS",
    "ALB", "CE", "EMN", "LYB", "IFF", "DD", "DOW", "PPL", "FMC", "VMC",
    "MLM", "PKG", "AMCR", "IP", "AVY", "SEE", "BALL", "CCK", "ATR",
    # Real Estate
    "AMT", "PLD", "EQIX", "CCI", "PSA", "DLR", "O", "WELL", "EXR", "IRM",
    "SPG", "EQR", "AVB", "ESS", "UDR", "CPT", "MAA", "HST", "REG", "FRT",
    "VTR", "INVH", "SBAC", "VICI",
    # Utilities
    "NEE", "SO", "DUK", "SRE", "AEP", "EXC", "D", "PCG", "XEL", "ED",
    "ES", "EIX", "ETR", "FE", "WEC", "CMS", "NI", "AES", "CNP",
    "LNT", "EVRG", "ATO", "NRG", "PNW",
]