/* ============================================
   PharmaTrack Pro — Main Application Logic
   ============================================ */

// ---------- DATA (loaded from JSON files) ----------
let PRODUCTS = [];
let DEFAULT_CONTACTS = [];
let OBJECTIONS = [];

// ---------- STATE ----------
let contacts = [];
let visits = [];
let activeRole = null;
let activeContact = null;
let rep = { name: "", territory: "" };
let isLoggedIn = false;

// Storage keys
const STORE_KEY_CONTACTS = "ptp:contacts";
const STORE_KEY_VISITS = "ptp:visits";

// Chart instances
let chartRegion, chartPersona, chartOutcome, chartVisittype;
let leafletMap;

// ---------- TOAST NOTIFICATION ----------
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- LOAD DATA ----------
function loadData() {
  // Products
  if (typeof PRODUCTS_DATA !== "undefined") {
    PRODUCTS = PRODUCTS_DATA;
  } else {
    // Fallback data
    PRODUCTS = [
      {
        id: "ADC-LOP",
        company: "Adcock Ingram",
        name: "Adco Loperamide",
        strength: "2mg",
        pack: "10 tablets",
        category: "Anti-diarrheal",
        price: 24.5,
        rivalPrice: 38.9,
        rival: "Imodium",
        units: 1240,
        sahpraRef: "SAHPRA_2024_001",
      },
      {
        id: "ASP-OMZ",
        company: "Aspen Pharmacare",
        name: "Aspen Omeprazole",
        strength: "20mg",
        pack: "30 capsules",
        category: "PPI",
        price: 85.0,
        rivalPrice: 165.0,
        rival: "Losec",
        units: 1850,
        sahpraRef: "SAHPRA_2023_045",
      },
      {
        id: "BIO-FLX",
        company: "Biotech Laboratories",
        name: "Defiton (Fluoxetine)",
        strength: "20mg",
        pack: "30 caps",
        category: "Antidepressant",
        price: 62.0,
        rivalPrice: 110.0,
        rival: "Prozac",
        units: 780,
        sahpraRef: "SAHPRA_2023_089",
      },
    ];
  }

  // Contacts
  if (typeof CONTACTS_DATA !== "undefined") {
    DEFAULT_CONTACTS = CONTACTS_DATA;
  } else {
    DEFAULT_CONTACTS = [
      {
        id: 1,
        name: "Dr. N. Mokoena",
        role: "doctor",
        facility: "Steve Biko Academic Hospital",
        region: "Gauteng",
        tier: "High",
        lastVisit: "2026-06-18",
        lat: -25.7449,
        lng: 28.1878,
      },
      {
        id: 2,
        name: "S. van der Berg (Pharm.)",
        role: "pharmacist",
        facility: "Clicks Brooklyn Mall",
        region: "Gauteng",
        tier: "Medium",
        lastVisit: "2026-06-22",
        lat: -25.7602,
        lng: 28.2378,
      },
      {
        id: 3,
        name: "T. Dlamini",
        role: "clinicmanager",
        facility: "Sunward Park Community Clinic",
        region: "Gauteng",
        tier: "Medium",
        lastVisit: "2026-05-30",
        lat: -26.2841,
        lng: 28.1234,
      },
      {
        id: 4,
        name: "Dr. A. Petersen",
        role: "doctor",
        facility: "Groote Schuur Hospital",
        region: "Western Cape",
        tier: "High",
        lastVisit: "2026-06-10",
        lat: -33.9406,
        lng: 18.4657,
      },
      {
        id: 5,
        name: "L. Adams (Pharm.)",
        role: "pharmacist",
        facility: "Dis-Chem Canal Walk",
        region: "Western Cape",
        tier: "Low",
        lastVisit: "2026-04-12",
        lat: -33.8938,
        lng: 18.5116,
      },
      {
        id: 6,
        name: "Dr. R. Naidoo",
        role: "doctor",
        facility: "Inkosi Albert Luthuli Hospital",
        region: "KwaZulu-Natal",
        tier: "High",
        lastVisit: "2026-06-25",
        lat: -29.8393,
        lng: 30.9297,
      },
      {
        id: 7,
        name: "M. Zulu",
        role: "clinicmanager",
        facility: "Umlazi Community Health Centre",
        region: "KwaZulu-Natal",
        tier: "Medium",
        lastVisit: "2026-05-05",
        lat: -29.9603,
        lng: 30.8886,
      },
    ];
  }

  // Objections
  if (typeof OBJECTIONS_DATA !== "undefined") {
    OBJECTIONS = OBJECTIONS_DATA;
  } else {
    OBJECTIONS = [
      {
        q: '"It\'s too expensive compared to other generics."',
        a: "Reframe on cost-per-day versus the originator brand — our generics run 30-45% cheaper per course while matching bioequivalence data.",
        tags: "price expensive cost cheap",
      },
      {
        q: '"I\'m worried about side effects / safety with generics."',
        a: "Point to the SAHPRA-approved Professional Information — the safety profile is identical to the originator since bioequivalence is a registration requirement.",
        tags: "side effect safety risk",
      },
      {
        q: '"We\'ve had stock issues with generics before."',
        a: "Share the manufacturer's supply chain track record — Adcock Ingram has a 98% fulfillment rate across major pharmacies.",
        tags: "stock availability supply",
      },
      {
        q: '"My patients / customers trust the original brand more."',
        a: "Acknowledge the concern, then walk through the bioequivalence data and offer patient-facing material explaining generic substitution.",
        tags: "trust switch generic brand",
      },
      {
        q: '"I don\'t have time for a full presentation."',
        a: "Offer the 60-second version: one comparison stat — this product is 37% cheaper than the originator with identical safety data.",
        tags: "time busy short quick",
      },
    ];
  }
}

// ---------- SCRIPTS ----------
const SCRIPTS = {
  doctor: {
    label: "Doctor",
    icon: "user-md",
    tone: "Evidence-based, clinical",
    script:
      '"Doctor, Adco Loperamide is a trusted anti-diarrheal with a well-established safety profile. Clinical data shows it reduces stool frequency and improves patient comfort within hours. Its affordability ensures patients can adhere to treatment without financial strain — a SAHPRA-approved option that supports compliance and outcomes."',
    checklist: [
      "Lead with clinical/efficacy data",
      "Reference SAHPRA-approved safety profile (SAHPRA_2024_001)",
      "Tie back to patient compliance & outcomes",
      "Leave printed PI summary",
      "Discuss bioequivalence data vs innovator",
    ],
    sellingPoints: [
      "Bio-equivalence data vs innovator brands",
      "Lower cost to patients without compromising quality",
      "Positive formulary recommendations from leading institutions",
    ],
  },
  pharmacist: {
    label: "Pharmacist",
    icon: "prescription-bottle-alt",
    tone: "Practical, cost-focused",
    script:
      '"Adco Loperamide offers your pharmacy a strong generic alternative with better margins compared to leading brands. It\'s packaged in compact blister packs for easy shelving and stock rotation. Customers appreciate its affordability and effectiveness, which increases repeat purchases. By stocking Adco Loperamide, you can improve profitability while meeting customer demand for trusted generics."',
    checklist: [
      "Highlight cost savings vs originator (savings: 37%)",
      "Provide pricing sheet with volume discounts",
      "Confirm stock availability & pack size",
      "Record stock feedback for reorder planning",
      "Discuss shelf placement for OTC visibility",
    ],
    sellingPoints: [
      "Competitive pricing with better margins",
      "Reliable supply chain and stock availability",
      "Patient satisfaction and repeat business",
    ],
  },
  clinicmanager: {
    label: "Clinic Manager",
    icon: "hospital",
    tone: "Strategic, operational",
    script:
      '"Adco Loperamide ensures your clinic can provide fast relief for patients with acute diarrhea, reducing discomfort and improving turnaround time. Its consistent supply chain from Adcock Ingram minimizes procurement delays. Bulk ordering options make it cost-effective for your clinic, while its SAHPRA approval supports your reputation for safe, reliable care."',
    checklist: [
      "Focus on supply reliability and procurement ease",
      "Discuss bulk ordering / volume discounts",
      "Link to patient turnaround & satisfaction metrics",
      "Confirm reorder cadence and delivery schedule",
      "Highlight cost savings for clinic budget",
    ],
    sellingPoints: [
      "Volume-based pricing and bulk discounts",
      "Consistent quality and regulatory compliance",
      "Comprehensive product portfolio for formulary inclusion",
    ],
  },
};

// ---------- STORAGE ----------
async function loadState() {
  try {
    const c = localStorage.getItem(STORE_KEY_CONTACTS);
    contacts = c ? JSON.parse(c) : JSON.parse(JSON.stringify(DEFAULT_CONTACTS));
  } catch (e) {
    contacts = JSON.parse(JSON.stringify(DEFAULT_CONTACTS));
  }
  try {
    const v = localStorage.getItem(STORE_KEY_VISITS);
    visits = v ? JSON.parse(v) : [];
  } catch (e) {
    visits = [];
  }
}

function saveContacts() {
  try {
    localStorage.setItem(STORE_KEY_CONTACTS, JSON.stringify(contacts));
  } catch (e) {
    /* ignore */
  }
}

function saveVisits() {
  try {
    localStorage.setItem(STORE_KEY_VISITS, JSON.stringify(visits));
  } catch (e) {
    /* ignore */
  }
}

// ---------- RENDER FUNCTIONS ----------
function renderAllTabs() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
        <!-- TAB 1: VISIT SETUP -->
        <div class="tab-panel active" id="tab-setup">
            <div class="card" style="margin-bottom:18px;">
                <h3><i class="fas fa-user-md fa-icon"></i> Identify the visit type</h3>
                <p class="card-sub">Select who you're seeing today. This tailors the engagement script and objection library.</p>
                <div class="role-select">
                    <div class="role-card" data-role="doctor" onclick="ptpSelectRole('doctor')">
                        <span class="icon"><i class="fas fa-user-md"></i></span>
                        <span class="label">Doctor</span>
                    </div>
                    <div class="role-card" data-role="pharmacist" onclick="ptpSelectRole('pharmacist')">
                        <span class="icon"><i class="fas fa-prescription-bottle-alt"></i></span>
                        <span class="label">Pharmacist</span>
                    </div>
                    <div class="role-card" data-role="clinicmanager" onclick="ptpSelectRole('clinicmanager')">
                        <span class="icon"><i class="fas fa-hospital"></i></span>
                        <span class="label">Clinic Manager</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="flex-between">
                    <div><h3><i class="fas fa-address-book fa-icon"></i> Select or add a contact</h3><p class="card-sub">Your mini-CRM — filtered by the visit type above.</p></div>
                    <button class="btn btn-ghost" onclick="ptpToggleAddContact()"><i class="fas fa-plus"></i> Add contact</button>
                </div>

                <div id="add-contact-form" style="display:none;margin:14px 0;padding:14px;background:var(--teal-tint);border-radius:8px;">
                    <div class="grid grid-3">
                        <div class="field"><label><i class="fas fa-user fa-icon"></i> Name</label><input id="nc-name" placeholder="e.g. Dr. J. Naidoo"/></div>
                        <div class="field"><label><i class="fas fa-building fa-icon"></i> Facility</label><input id="nc-facility" placeholder="e.g. Sunward Park Clinic"/></div>
                        <div class="field"><label><i class="fas fa-map-marker-alt fa-icon"></i> Region</label>
                            <select id="nc-region"><option>Gauteng</option><option>Western Cape</option><option>KwaZulu-Natal</option><option>Eastern Cape</option></select>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width:auto;" onclick="ptpAddContact()"><i class="fas fa-save"></i> Save contact</button>
                </div>

                <input class="search-box" id="contact-search" placeholder="Search contacts by name or facility…" oninput="ptpRenderContacts()"/>
                <table>
                    <thead><tr><th>Name</th><th>Facility</th><th>Region</th><th>Tier</th><th>Last Visit</th><th></th></tr></thead>
                    <tbody id="contact-table-body"></tbody>
                </table>
            </div>
        </div>

        <!-- TAB 2: ENGAGEMENT STRATEGY -->
        <div class="tab-panel" id="tab-strategy">
            <div class="card" style="margin-bottom:18px;">
                <h3><i class="fas fa-file-alt fa-icon"></i> Tailored Sales Scripts</h3>
                <p class="card-sub">SAHPRA-registered product scripts for each audience type.</p>
                
                <div class="role-tabs">
                    <button class="role-tab active-role-tab" onclick="ptpShowScript('doctor')"><i class="fas fa-user-md"></i> Doctor</button>
                    <button class="role-tab" onclick="ptpShowScript('pharmacist')"><i class="fas fa-prescription-bottle-alt"></i> Pharmacist</button>
                    <button class="role-tab" onclick="ptpShowScript('clinicmanager')"><i class="fas fa-hospital"></i> Clinic Manager</button>
                </div>
                
                <div id="script-display">
                    <div class="script-panel">
                        <div class="panel-header">
                            <span class="role-tag" id="script-role-label"><i class="fas fa-user-md"></i> Doctor Script</span>
                            <span class="sahpra-badge"><i class="fas fa-check-circle"></i> SAHPRA Approved</span>
                        </div>
                        <div class="script-box" id="script-content" style="border-left-color:var(--teal);">
                            <span class="script-role"><i class="fas fa-flask"></i> EVIDENCE-BASED APPROACH</span>
                            "Doctor, Adco Loperamide is a trusted anti-diarrheal with a well-established safety profile..."
                        </div>
                        <div id="script-checklist">
                            <div class="checklist">
                                <label><input type="checkbox"/> Lead with clinical/efficacy data</label>
                                <label><input type="checkbox"/> Reference SAHPRA-approved safety profile</label>
                                <label><input type="checkbox"/> Tie back to patient compliance & outcomes</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <h3><i class="fas fa-star fa-icon"></i> Key Selling Points</h3>
                    <div id="selling-points">
                        <ul style="padding-left:20px;line-height:1.8;">
                            <li><strong>Bio-equivalence</strong> — Matches innovator efficacy</li>
                            <li><strong>Cost savings</strong> — 30-45% cheaper than originator</li>
                            <li><strong>SAHPRA-registered</strong> — Full regulatory compliance</li>
                        </ul>
                    </div>
                </div>
                <div class="card">
                    <h3><i class="fas fa-shield-alt fa-icon"></i> Objection handler library</h3>
                    <p class="card-sub">Searchable rebuttals grounded in SAHPRA-registered product data.</p>
                    <input class="search-box" id="obj-search" placeholder="Search objections (e.g. price, safety, stock)…" oninput="ptpRenderObjections()"/>
                    <div id="obj-list"></div>
                </div>
            </div>
        </div>

        <!-- TAB 3: PRODUCT & PRICING -->
        <div class="tab-panel" id="tab-pricing">
            <div class="card">
                <h3><i class="fas fa-tags fa-icon"></i> Generics vs. Originator Comparison</h3>
                <p class="card-sub"><span class="sahpra-badge"><i class="fas fa-check-circle"></i> SAHPRA-Registered</span> Adcock Ingram &amp; partner generics against originator brand pricing.</p>
                <table>
                    <thead><tr><th>Product</th><th>Company</th><th>Strength</th><th>Category</th><th>Our Price</th><th>Originator</th><th>Savings</th><th>Units (MTD)</th></tr></thead>
                    <tbody id="pricing-table-body"></tbody>
                </table>
            </div>
            <div class="card" style="margin-top:18px;">
                <h3><i class="fas fa-file-pdf fa-icon"></i> SAHPRA Reference Information</h3>
                <p class="card-sub">Professional Information (PI) and Patient Information Leaflets (PIL) are available for all registered products.</p>
                <div class="grid grid-3" style="font-size:13px;" id="sahpra-refs"></div>
            </div>
        </div>

        <!-- TAB 4: MARKET INSIGHTS -->
        <div class="tab-panel" id="tab-insights">
            <div class="grid grid-2">
                <div class="card">
                    <h3><i class="fas fa-chart-bar fa-icon"></i> Regional sales comparison</h3>
                    <p class="card-sub">Units sold by region, current quarter.</p>
                    <canvas id="chart-region" height="220"></canvas>
                </div>
                <div class="card">
                    <h3><i class="fas fa-users fa-icon"></i> Customer persona mix</h3>
                    <p class="card-sub">Contacts by visit type across your territory.</p>
                    <canvas id="chart-persona" height="220"></canvas>
                </div>
            </div>
            <div class="card" style="margin-top:18px;">
                <h3><i class="fas fa-lightbulb fa-icon"></i> Persona insights</h3>
                <div class="grid grid-3" id="persona-notes"></div>
            </div>
        </div>

        <!-- TAB 5: VISIT EXECUTION -->
        <div class="tab-panel" id="tab-visit">
            <div id="visit-no-contact" class="card empty-state">
                <span class="em-icon"><i class="fas fa-clipboard-list"></i></span>
                Select a contact on the Visit Setup tab before logging a visit.
            </div>
            <div id="visit-form-wrap" style="display:none;">
                <div class="grid grid-2">
                    <div class="card">
                        <h3><i class="fas fa-pen-alt fa-icon"></i> Log this visit</h3>
                        <p class="card-sub" id="visit-form-context"></p>
                        <div class="field"><label><i class="fas fa-comment-dots fa-icon"></i> Discussion notes</label><textarea id="visit-notes" rows="3" placeholder="Key points covered…"></textarea></div>
                        <div class="field"><label><i class="fas fa-flag-checkered fa-icon"></i> Outcome</label>
                            <select id="visit-outcome"><option>Positive</option><option>Neutral</option><option>Objection raised</option></select>
                        </div>
                        <div class="field"><label><i class="fas fa-comment fa-icon"></i> Feedback / objection detail</label><textarea id="visit-feedback" rows="2" placeholder="e.g. pharmacist raised price concern"></textarea></div>
                        <div class="field"><label><i class="fas fa-calendar-alt fa-icon"></i> Follow-up date</label><input id="visit-followup" type="date"/></div>
                        <button class="btn btn-primary" style="width:auto;" onclick="ptpLogVisit()"><i class="fas fa-save"></i> Save visit</button>
                    </div>
                    <div class="card">
                        <h3><i class="fas fa-shopping-cart fa-icon"></i> Quick order</h3>
                        <p class="card-sub">Generate a sample order to send after the visit.</p>
                        <div class="field"><label><i class="fas fa-capsules fa-icon"></i> Product</label><select id="qo-product"></select></div>
                        <div class="field"><label><i class="fas fa-hashtag fa-icon"></i> Quantity</label><input id="qo-qty" type="number" min="1" value="10"/></div>
                        <button class="btn btn-ghost" style="width:auto;" onclick="ptpQuickOrder()"><i class="fas fa-file-invoice"></i> Generate order summary</button>
                        <div id="qo-summary" class="script-box" style="display:none;margin-top:14px;"></div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top:18px;">
                <h3><i class="fas fa-history fa-icon"></i> Recent visit log</h3>
                <table>
                    <thead><tr><th>Date</th><th>Contact</th><th>Type</th><th>Outcome</th><th>Follow-up</th></tr></thead>
                    <tbody id="visit-log-body"></tbody>
                </table>
            </div>
        </div>

        <!-- TAB 6: PERFORMANCE -->
        <div class="tab-panel" id="tab-dashboard">
            <div class="grid grid-3" style="margin-bottom:18px;">
                <div class="card"><div class="kpi-label"><i class="fas fa-check-circle"></i> Visits completed</div><div class="kpi-value" id="kpi-visits">0</div><div class="kpi-trend up">This month</div></div>
                <div class="card"><div class="kpi-label"><i class="fas fa-calendar-plus"></i> Follow-ups scheduled</div><div class="kpi-value" id="kpi-followups">0</div><div class="kpi-trend">Upcoming</div></div>
                <div class="card"><div class="kpi-label"><i class="fas fa-thumbs-up"></i> Positive outcome rate</div><div class="kpi-value" id="kpi-conversion">0%</div><div class="kpi-trend up">Of logged visits</div></div>
            </div>
            <div class="grid grid-2">
                <div class="card"><h3><i class="fas fa-chart-pie fa-icon"></i> Visits by outcome</h3><canvas id="chart-outcome" height="220"></canvas></div>
                <div class="card"><h3><i class="fas fa-chart-bar fa-icon"></i> Visits by contact type</h3><canvas id="chart-visittype" height="220"></canvas></div>
            </div>
        </div>

        <!-- TAB 7: TERRITORY MAP -->
        <div class="tab-panel" id="tab-map">
            <div class="card">
                <h3><i class="fas fa-map-marked-alt fa-icon"></i> Territory &amp; activity map</h3>
                <p class="card-sub">All contacts plotted by facility location. Color = visit type.</p>
                <div id="map"></div>
                <div class="legend">
                    <span><span class="sw" style="background:#0F5C57"></span>Doctor</span>
                    <span><span class="sw" style="background:#E4692F"></span>Pharmacist</span>
                    <span><span class="sw" style="background:#C98A2C"></span>Clinic Manager</span>
                </div>
            </div>
        </div>

        <!-- TAB 8: REPORTS -->
        <div class="tab-panel" id="tab-reports">
            <div class="card">
                <h3><i class="fas fa-file-export fa-icon"></i> Export visit log</h3>
                <p class="card-sub">Download all logged visits as CSV for CRM import or manager reporting.</p>
                <button class="btn btn-primary" style="width:auto;" onclick="ptpExportCSV()"><i class="fas fa-download"></i> Download CSV</button>
            </div>
            <div class="card" style="margin-top:18px;">
                <h3><i class="fas fa-sync-alt fa-icon"></i> Reset demo data</h3>
                <p class="card-sub">Clears all saved visits and custom contacts from this browser.</p>
                <button class="btn btn-ghost" onclick="ptpResetData()"><i class="fas fa-undo"></i> Reset all data</button>
            </div>
            <div class="card" style="margin-top:18px;background:var(--teal-tint);">
                <h3><i class="fas fa-database fa-icon"></i> SAHPRA Data Source</h3>
                <p class="card-sub">Product information sourced from the SAHPRA (South African Health Products Regulatory Authority) repository of registered medicines.</p>
                <p class="small muted"><i class="fas fa-external-link-alt"></i> Reference: SAHPRA Registered Health Products Database</p>
            </div>
        </div>
    `;
}

// ---------- TAB NAVIGATION ----------
const TAB_TITLES = {
  "tab-setup": "Visit Setup",
  "tab-strategy": "Engagement Strategy",
  "tab-pricing": "Product & Pricing",
  "tab-insights": "Market Insights",
  "tab-visit": "Visit Execution",
  "tab-dashboard": "Performance Dashboard",
  "tab-map": "Territory Map",
  "tab-reports": "Reports",
};

window.ptpShowTab = function (id) {
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add("active");
  const nav = document.querySelector(`.nav-item[data-tab="${id}"]`);
  if (nav) nav.classList.add("active");
  document.getElementById("topbar-title").textContent = TAB_TITLES[id] || id;

  if (id === "tab-insights") setTimeout(renderInsightCharts, 50);
  if (id === "tab-dashboard") setTimeout(renderDashboard, 50);
  if (id === "tab-map") setTimeout(renderMap, 100);
  if (id === "tab-pricing") renderPricing();
  if (id === "tab-visit") {
    prepVisitForm();
    renderVisitLog();
  }
};

// ---------- LOGIN / LOGOUT ----------
window.ptpLogin = async function () {
  const username = document.getElementById("login-name").value.trim();
  const password = document.getElementById("login-pass").value.trim();

  if (password !== "Admin001") {
    document.getElementById("login-error").style.display = "block";
    return;
  }

  document.getElementById("login-error").style.display = "none";
  rep = { name: username || "Rep", territory: "Gauteng" };
  await loadState();
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-shell").classList.add("active");
  document.getElementById("sb-rep-name").textContent = rep.name;
  isLoggedIn = true;

  // Initialize app
  renderAllTabs();
  ptpRenderContacts();
  ptpRenderObjections();
  renderPricing();
  renderVisitLog();
  prepVisitForm();
  ptpShowScript("doctor");
  updateActiveChip();

  toast("Welcome, " + rep.name);
};

window.ptpLogout = function () {
  document.getElementById("app-shell").classList.remove("active");
  document.getElementById("login-screen").style.display = "flex";
  isLoggedIn = false;
  document.getElementById("login-pass").value = "";
  document.getElementById("login-error").style.display = "none";
};

// ---------- VISIT SETUP ----------
window.ptpSelectRole = function (role) {
  activeRole = role;
  document
    .querySelectorAll(".role-card")
    .forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector(`.role-card[data-role="${role}"]`);
  if (card) card.classList.add("selected");
  ptpRenderContacts();
  updateActiveChip();
  ptpShowScript(role);
};

window.ptpToggleAddContact = function () {
  const f = document.getElementById("add-contact-form");
  if (f) f.style.display = f.style.display === "none" ? "block" : "none";
};

window.ptpAddContact = async function () {
  const name = document.getElementById("nc-name").value.trim();
  const facility = document.getElementById("nc-facility").value.trim();
  const region = document.getElementById("nc-region").value;
  if (!name || !facility) {
    toast("Add a name and facility first");
    return;
  }
  contacts.push({
    id: Date.now(),
    name,
    role: activeRole || "doctor",
    facility,
    region,
    tier: "Medium",
    lastVisit: "—",
    lat: -26.2041 + (Math.random() - 0.5) * 0.5,
    lng: 28.0473 + (Math.random() - 0.5) * 0.5,
  });
  saveContacts();
  document.getElementById("nc-name").value = "";
  document.getElementById("nc-facility").value = "";
  ptpRenderContacts();
  toast("Contact added");
};

window.ptpRenderContacts = function () {
  const body = document.getElementById("contact-table-body");
  if (!body) return;
  const search = (
    document.getElementById("contact-search")?.value || ""
  ).toLowerCase();
  let rows = contacts
    .filter((c) => !activeRole || c.role === activeRole)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.facility.toLowerCase().includes(search),
    );

  if (rows.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="muted small">No contacts match. ${activeRole ? "Try a different visit type or add a new contact." : "Select a visit type above."}</td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map(
      (c) => `
        <tr>
            <td>${c.name}</td>
            <td>${c.facility}</td>
            <td>${c.region}</td>
            <td><span class="pill pill-${c.tier.toLowerCase()}">${c.tier}</span></td>
            <td class="small muted">${c.lastVisit}</td>
            <td><button class="btn btn-ghost" style="padding:6px 10px;font-size:12px;" onclick="ptpSelectContact(${c.id})"><i class="fas fa-arrow-right"></i> Select</button></td>
        </tr>
    `,
    )
    .join("");
};

window.ptpSelectContact = function (id) {
  activeContact = contacts.find((c) => c.id === id);
  if (!activeContact) return;
  activeRole = activeContact.role;
  document
    .querySelectorAll(".role-card")
    .forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector(`.role-card[data-role="${activeRole}"]`);
  if (card) card.classList.add("selected");
  updateActiveChip();
  ptpShowScript(activeRole);
  prepVisitForm();
  toast(activeContact.name + " selected");
  ptpShowTab("tab-strategy");
};

function updateActiveChip() {
  const chip = document.getElementById("active-visit-chip");
  if (!chip) return;
  if (!activeRole) {
    chip.style.display = "none";
    return;
  }
  chip.style.display = "flex";
  const label = activeContact
    ? `${activeContact.name} · ${SCRIPTS[activeRole]?.label || activeRole}`
    : SCRIPTS[activeRole]?.label || activeRole;
  document.getElementById("active-visit-label").textContent = label;
}

// ---------- SCRIPT DISPLAY ----------
window.ptpShowScript = function (role) {
  document
    .querySelectorAll(".role-tab")
    .forEach((t) => t.classList.remove("active-role-tab"));
  document.querySelectorAll(".role-tab").forEach((t) => {
    if (
      t.textContent.includes(
        role === "doctor"
          ? "Doctor"
          : role === "pharmacist"
            ? "Pharmacist"
            : "Manager",
      )
    ) {
      t.classList.add("active-role-tab");
    }
  });

  const script = SCRIPTS[role];
  if (!script) return;

  const iconMap = {
    doctor: "user-md",
    pharmacist: "prescription-bottle-alt",
    clinicmanager: "hospital",
  };

  const labelEl = document.getElementById("script-role-label");
  if (labelEl)
    labelEl.innerHTML = `<i class="fas fa-${iconMap[role]}"></i> ${script.label} Script`;

  const contentEl = document.getElementById("script-content");
  if (contentEl) {
    contentEl.innerHTML = `
            <span class="script-role"><i class="fas fa-flask"></i> ${script.tone.toUpperCase()} APPROACH</span>
            ${script.script}
        `;
  }

  const checklistEl = document.getElementById("script-checklist");
  if (checklistEl) {
    checklistEl.innerHTML = `
            <div class="checklist">
                ${script.checklist.map((item) => `<label><input type="checkbox"/> ${item}</label>`).join("")}
            </div>
        `;
  }

  const pointsEl = document.getElementById("selling-points");
  if (pointsEl) {
    pointsEl.innerHTML = `
            <ul style="padding-left:20px;line-height:1.8;">
                ${script.sellingPoints.map((p) => `<li><strong>•</strong> ${p}</li>`).join("")}
            </ul>
        `;
  }
};

// ---------- OBJECTIONS ----------
window.ptpRenderObjections = function () {
  const listEl = document.getElementById("obj-list");
  if (!listEl) return;
  const q = (document.getElementById("obj-search")?.value || "").toLowerCase();
  const list = OBJECTIONS.filter(
    (o) => o.tags.includes(q) || o.q.toLowerCase().includes(q),
  );
  listEl.innerHTML = (list.length ? list : OBJECTIONS)
    .map(
      (o) => `
        <div class="obj-item"><div class="obj-q"><i class="fas fa-quote-left"></i> ${o.q}</div><div class="obj-a">${o.a}</div></div>
    `,
    )
    .join("");
};

// ---------- PRICING ----------
function renderPricing() {
  const body = document.getElementById("pricing-table-body");
  if (!body) return;
  body.innerHTML = PRODUCTS.map((p) => {
    const savings = Math.round((1 - p.price / p.rivalPrice) * 100);
    return `<tr>
            <td><b>${p.name}</b><br/><span class="small muted"><i class="fas fa-tag"></i> ${p.sahpraRef}</span></td>
            <td>${p.company}</td>
            <td>${p.strength} <span class="small muted">(${p.pack})</span></td>
            <td>${p.category}</td>
            <td class="mono">R${p.price.toFixed(2)}</td>
            <td class="mono muted">R${p.rivalPrice.toFixed(2)}</td>
            <td><span class="pill pill-savings"><i class="fas fa-arrow-down"></i> ${savings}%</span></td>
            <td class="mono">${p.units.toLocaleString()}</td>
        </tr>`;
  }).join("");

  const refs = document.getElementById("sahpra-refs");
  if (refs) {
    refs.innerHTML = PRODUCTS.map(
      (p) => `
            <div><strong>${p.name}</strong><br/><span class="muted small">PI: ${p.sahpraRef}<br/>PIL: Available</span></div>
        `,
    ).join("");
  }
}

// ---------- INSIGHTS ----------
function renderInsightCharts() {
  const regions = ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"];
  const regionUnits = regions.map((r) =>
    PRODUCTS.reduce(
      (s, p) => s + Math.round(p.units * (0.15 + Math.random() * 0.35)),
      0,
    ),
  );

  const ctx1 = document.getElementById("chart-region");
  if (ctx1) {
    if (chartRegion) chartRegion.destroy();
    chartRegion = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: regions,
        datasets: [
          {
            label: "Units sold (Q2)",
            data: regionUnits,
            backgroundColor: "#0F5C57",
            borderRadius: 6,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const roleCounts = { doctor: 0, pharmacist: 0, clinicmanager: 0 };
  contacts.forEach((c) => roleCounts[c.role]++);

  const ctx2 = document.getElementById("chart-persona");
  if (ctx2) {
    if (chartPersona) chartPersona.destroy();
    chartPersona = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: ["Doctor", "Pharmacist", "Clinic Manager"],
        datasets: [
          {
            data: [
              roleCounts.doctor,
              roleCounts.pharmacist,
              roleCounts.clinicmanager,
            ],
            backgroundColor: ["#0F5C57", "#E4692F", "#C98A2C"],
          },
        ],
      },
      options: { plugins: { legend: { position: "bottom" } } },
    });
  }

  const notes = document.getElementById("persona-notes");
  if (notes) {
    notes.innerHTML = `
            <div class="card" style="background:var(--teal-tint);"><h3><i class="fas fa-user-md"></i> Doctor</h3><p class="small">Clinical-outcome driven. Responds to trial data, patient compliance, and safety profile. <span class="sahpra-badge"><i class="fas fa-check-circle"></i> SAHPRA data</span></p></div>
            <div class="card" style="background:var(--coral-tint);"><h3><i class="fas fa-prescription-bottle-alt"></i> Pharmacist</h3><p class="small">Margin &amp; convenience driven. Responds to pricing, stock reliability, shelf logistics. <span class="sahpra-badge"><i class="fas fa-tag"></i> Cost data</span></p></div>
            <div class="card" style="background:var(--amber-tint);"><h3><i class="fas fa-hospital"></i> Clinic Manager</h3><p class="small">Operations driven. Responds to supply consistency, bulk terms, patient turnaround. <span class="sahpra-badge"><i class="fas fa-truck"></i> Supply data</span></p></div>
        `;
  }
}

// ---------- VISIT EXECUTION ----------
function prepVisitForm() {
  const noContact = document.getElementById("visit-no-contact");
  const formWrap = document.getElementById("visit-form-wrap");
  const context = document.getElementById("visit-form-context");

  if (!activeContact) {
    if (noContact) noContact.style.display = "block";
    if (formWrap) formWrap.style.display = "none";
    return;
  }

  if (noContact) noContact.style.display = "none";
  if (formWrap) formWrap.style.display = "block";
  if (context)
    context.textContent = `${activeContact.name} — ${activeContact.facility} (${activeContact.region})`;

  const sel = document.getElementById("qo-product");
  if (sel) {
    sel.innerHTML = PRODUCTS.map(
      (p) => `<option value="${p.id}">${p.name} (${p.strength})</option>`,
    ).join("");
  }
  const summary = document.getElementById("qo-summary");
  if (summary) summary.style.display = "none";
}

window.ptpLogVisit = async function () {
  if (!activeContact) {
    toast("Select a contact first");
    return;
  }
  const notes = document.getElementById("visit-notes").value;
  const outcome = document.getElementById("visit-outcome").value;
  const feedback = document.getElementById("visit-feedback").value;
  const followup = document.getElementById("visit-followup").value;

  visits.unshift({
    date: new Date().toISOString().slice(0, 10),
    contact: activeContact.name,
    role: activeContact.role,
    facility: activeContact.facility,
    region: activeContact.region,
    notes,
    outcome,
    feedback,
    followup: followup || "—",
  });

  activeContact.lastVisit = new Date().toISOString().slice(0, 10);
  saveVisits();
  saveContacts();

  document.getElementById("visit-notes").value = "";
  document.getElementById("visit-feedback").value = "";
  document.getElementById("visit-followup").value = "";
  renderVisitLog();
  ptpRenderContacts();
  toast("Visit logged");
};

window.ptpQuickOrder = function () {
  const p = PRODUCTS.find(
    (p) => p.id === document.getElementById("qo-product").value,
  );
  const qty = parseInt(document.getElementById("qo-qty").value || "0", 10);
  const total = (p.price * qty).toFixed(2);
  const box = document.getElementById("qo-summary");
  box.style.display = "block";
  box.innerHTML = `<b><i class="fas fa-file-invoice"></i> Order summary</b><br/>${p.name} (${p.strength}) × ${qty}<br/>Unit price: R${p.price.toFixed(2)} · Total: <b>R${total}</b><br/><span class="small muted"><i class="fas fa-tag"></i> SAHPRA ref: ${p.sahpraRef}</span>`;
};

function renderVisitLog() {
  const body = document.getElementById("visit-log-body");
  if (!body) return;
  if (visits.length === 0) {
    body.innerHTML =
      '<tr><td colspan="5" class="muted small"><i class="fas fa-info-circle"></i> No visits logged yet.</td></tr>';
    return;
  }
  body.innerHTML = visits
    .slice(0, 25)
    .map(
      (v) => `
        <tr><td class="mono small">${v.date}</td><td>${v.contact}</td>
        <td><span class="pill pill-${v.role}">${SCRIPTS[v.role] ? SCRIPTS[v.role].label : v.role}</span></td>
        <td>${v.outcome}</td><td class="small muted">${v.followup}</td></tr>
    `,
    )
    .join("");
}

// ---------- DASHBOARD ----------
function renderDashboard() {
  document.getElementById("kpi-visits").textContent = visits.length;
  document.getElementById("kpi-followups").textContent = visits.filter(
    (v) => v.followup && v.followup !== "—",
  ).length;
  const positive = visits.filter((v) => v.outcome === "Positive").length;
  document.getElementById("kpi-conversion").textContent = visits.length
    ? Math.round((positive / visits.length) * 100) + "%"
    : "0%";

  const outcomeCounts = { Positive: 0, Neutral: 0, "Objection raised": 0 };
  visits.forEach((v) => {
    if (outcomeCounts[v.outcome] !== undefined) outcomeCounts[v.outcome]++;
  });

  const ctx1 = document.getElementById("chart-outcome");
  if (ctx1) {
    if (chartOutcome) chartOutcome.destroy();
    chartOutcome = new Chart(ctx1, {
      type: "pie",
      data: {
        labels: Object.keys(outcomeCounts),
        datasets: [
          {
            data: Object.values(outcomeCounts),
            backgroundColor: ["#2F8F5B", "#C98A2C", "#C1443A"],
          },
        ],
      },
      options: { plugins: { legend: { position: "bottom" } } },
    });
  }

  const typeCounts = { doctor: 0, pharmacist: 0, clinicmanager: 0 };
  visits.forEach((v) => {
    if (typeCounts[v.role] !== undefined) typeCounts[v.role]++;
  });

  const ctx2 = document.getElementById("chart-visittype");
  if (ctx2) {
    if (chartVisittype) chartVisittype.destroy();
    chartVisittype = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: ["Doctor", "Pharmacist", "Clinic Manager"],
        datasets: [
          {
            data: [
              typeCounts.doctor,
              typeCounts.pharmacist,
              typeCounts.clinicmanager,
            ],
            backgroundColor: ["#0F5C57", "#E4692F", "#C98A2C"],
            borderRadius: 6,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }
}

// ---------- MAP ----------
function renderMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  if (!leafletMap) {
    leafletMap = L.map("map").setView([-28.5, 25], 5.3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(leafletMap);
  }

  leafletMap.eachLayer((l) => {
    if (l instanceof L.CircleMarker) leafletMap.removeLayer(l);
  });

  const colors = {
    doctor: "#0F5C57",
    pharmacist: "#E4692F",
    clinicmanager: "#C98A2C",
  };
  contacts.forEach((c) => {
    L.circleMarker([c.lat, c.lng], {
      radius: 8,
      color: colors[c.role],
      fillColor: colors[c.role],
      fillOpacity: 0.8,
      weight: 2,
    })
      .addTo(leafletMap)
      .bindPopup(
        `<b>${c.name}</b><br/>${c.facility}<br/>${c.region}<br/>Last visit: ${c.lastVisit}`,
      );
  });

  setTimeout(() => leafletMap.invalidateSize(), 100);
}

// ---------- REPORTS ----------
window.ptpExportCSV = function () {
  if (visits.length === 0) {
    toast("No visits to export yet");
    return;
  }
  const header = [
    "Date",
    "Contact",
    "Role",
    "Facility",
    "Region",
    "Outcome",
    "Feedback",
    "Follow-up",
    "Notes",
  ];
  const rows = visits.map((v) =>
    [
      v.date,
      v.contact,
      v.role,
      v.facility,
      v.region,
      v.outcome,
      v.feedback,
      v.followup,
      v.notes,
    ]
      .map((x) => `"${String(x || "").replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pharmatrack_visit_log.csv";
  a.click();
  toast("CSV downloaded");
};

window.ptpResetData = async function () {
  contacts = JSON.parse(JSON.stringify(DEFAULT_CONTACTS));
  visits = [];
  saveContacts();
  saveVisits();
  ptpRenderContacts();
  renderVisitLog();
  toast("Demo data reset");
};

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", function () {
  loadData();

  // Handle Enter key on login
  document
    .getElementById("login-pass")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") ptpLogin();
    });
  document
    .getElementById("login-name")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") ptpLogin();
    });
});

// Expose functions globally
window.ptpRenderContacts = ptpRenderContacts;
window.ptpRenderObjections = ptpRenderObjections;
window.ptpShowScript = ptpShowScript;
window.ptpSelectContact = ptpSelectContact;
window.ptpSelectRole = ptpSelectRole;
window.ptpAddContact = ptpAddContact;
window.ptpToggleAddContact = ptpToggleAddContact;
window.ptpLogVisit = ptpLogVisit;
window.ptpQuickOrder = ptpQuickOrder;
window.ptpExportCSV = ptpExportCSV;
window.ptpResetData = ptpResetData;
window.ptpShowTab = ptpShowTab;
window.ptpLogin = ptpLogin;
window.ptpLogout = ptpLogout;
