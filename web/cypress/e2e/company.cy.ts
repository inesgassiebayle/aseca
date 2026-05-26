const COMPANY = { name: "Apple Inc.", ticker: "AAPL", cik: 320193 };

const FILINGS = [
  {
    type: "10-K",
    date: "2023-10-27",
    url: "https://www.sec.gov/Archives/edgar/data/320193/000032019323000106/aapl20230930.htm",
  },
  {
    type: "10-Q",
    date: "2023-07-28",
    url: "https://www.sec.gov/Archives/edgar/data/320193/000032019323000077/aapl20230701.htm",
  },
  {
    type: "10-Q",
    date: "2023-04-28",
    url: "https://www.sec.gov/Archives/edgar/data/320193/000032019323000045/aapl20230401.htm",
  },
];

function interceptCompany() {
  cy.intercept("GET", "/api/v1/edgar/search?q=AAPL", {
    statusCode: 200,
    body: [COMPANY],
  }).as("searchCompany");
}

function interceptPrice(price: number | null) {
  cy.intercept("GET", `/api/v1/prices/${COMPANY.ticker}`, {
    statusCode: 200,
    body: { ticker: COMPANY.ticker, price },
  }).as("getPrice");
}

function interceptFilings() {
  cy.intercept("GET", `/api/v1/edgar/companies/${COMPANY.cik}/filings`, {
    statusCode: 200,
    body: { filings: FILINGS, message: null },
  }).as("getFilings");
}

describe("Company page", () => {
  beforeEach(() => {
    interceptCompany();
    interceptPrice(175.5);
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
  });

  it("muestra el nombre y ticker de la empresa", () => {
    cy.contains(COMPANY.name).should("be.visible");
    cy.contains(COMPANY.ticker).should("be.visible");
  });

  it("muestra el CIK de la empresa", () => {
    cy.contains(`CIK ${COMPANY.cik}`).should("be.visible");
  });

  it("muestra el tab overview activo por defecto", () => {
    cy.contains("button", "overview").should("have.class", "bg-foreground");
  });

  it("muestra el tab filings", () => {
    cy.contains("button", "filings").should("be.visible");
  });

  it("tiene un botón de vuelta", () => {
    cy.contains("Back").should("be.visible");
  });

  it("muestra el logo StockWatch con link a home", () => {
    cy.contains("StockWatch").closest("a").should("have.attr", "href", "/");
  });
});

describe("Company page — precio", () => {
  it("muestra el precio cuando está disponible", () => {
    interceptCompany();
    interceptPrice(213.50);
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.wait("@getPrice");

    cy.contains("$213.50").should("be.visible");
  });

  it("muestra Precio no disponible cuando el ticker no tiene precio", () => {
    interceptCompany();
    interceptPrice(null);
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.wait("@getPrice");

    cy.contains("Price not available").should("be.visible");
  });

  it("llama al endpoint de precio con el ticker correcto", () => {
    interceptCompany();
    interceptPrice(175.5);
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.wait("@getPrice").its("request.url").should("include", COMPANY.ticker);
  });

  it("el precio aparece en el header de la card", () => {
    interceptCompany();
    interceptPrice(150.0);
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.wait("@getPrice");

    cy.contains("$150.00").should("be.visible");
    cy.contains(COMPANY.name).should("be.visible");
  });

  it("el precio se muestra con dos decimales", () => {
    interceptCompany();
    interceptPrice(213.5);
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.wait("@getPrice");

    cy.contains("$213.50").should("be.visible");
  });
});

describe("Company page — tab Overview", () => {
  beforeEach(() => {
    interceptCompany();
    interceptPrice(175.5);
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
  });

  it("muestra ticker, CIK y nombre en cards", () => {
    cy.contains("AAPL").should("be.visible");
    cy.contains(`${COMPANY.cik}`).should("be.visible");
    cy.contains(COMPANY.name).should("be.visible");
  });

  it("no llama al endpoint de filings en overview", () => {
    cy.intercept("GET", `/api/v1/edgar/companies/${COMPANY.cik}/filings`).as("filings");
    cy.wait(500);
    cy.get("@filings.all").should("have.length", 0);
  });
});

describe("Company page — tab Filings", () => {
  beforeEach(() => {
    interceptCompany();
    interceptPrice(175.5);
    interceptFilings();
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.contains("button", "filings").click();
    cy.wait("@getFilings");
  });

  it("llama al endpoint de filings con el CIK correcto", () => {
    cy.get("@getFilings").its("request.url").should("include", `${COMPANY.cik}`);
  });

  it("muestra los filings recibidos", () => {
    cy.get("a").filter(":contains('SEC EDGAR submission')").should("have.length", FILINGS.length);
  });

  it("muestra el tipo de cada filing", () => {
    cy.contains("10-K").should("be.visible");
    cy.contains("10-Q").should("be.visible");
  });

  it("muestra la fecha de cada filing", () => {
    cy.contains("2023-10-27").should("be.visible");
    cy.contains("2023-07-28").should("be.visible");
  });

  it("cada filing tiene link a sec.gov", () => {
    cy.get("a").filter(":contains('SEC EDGAR submission')").each(($a) => {
      expect($a.attr("href")).to.include("sec.gov");
    });
  });

  it("los links abren en tab nueva", () => {
    cy.get("a").filter(":contains('SEC EDGAR submission')").each(($a) => {
      expect($a.attr("target")).to.equal("_blank");
    });
  });

  it("no llama al endpoint de filings dos veces al cambiar de tab", () => {
    cy.contains("button", "overview").click();
    cy.contains("button", "filings").click();
    cy.get("@getFilings.all").should("have.length", 1);
  });
});

describe("Company page — sin filings", () => {
  it("muestra mensaje informativo cuando no hay 10-K ni 10-Q", () => {
    interceptCompany();
    interceptPrice(null);
    cy.intercept("GET", `/api/v1/edgar/companies/${COMPANY.cik}/filings`, {
      statusCode: 200,
      body: { filings: [], message: "Esta empresa no tiene filings 10-K o 10-Q disponibles." },
    }).as("getFilings");

    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.contains("button", "filings").click();
    cy.wait("@getFilings");

    cy.contains("Esta empresa no tiene filings 10-K o 10-Q disponibles.").should("be.visible");
  });
});

describe("Company page — empresa no encontrada", () => {
  it("muestra mensaje de not found si el ticker no existe", () => {
    cy.intercept("GET", "/api/v1/edgar/search?q=XYZFAKE", {
      statusCode: 200,
      body: [],
    }).as("search");

    cy.visit("/company/XYZFAKE");
    cy.wait("@search");

    cy.contains("XYZFAKE").should("be.visible");
    cy.contains("Back to search").should("be.visible");
  });
});