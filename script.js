// =========================================================================
// TARIFF CONFIGURATION (Heta mi hi awlsam takin Rate a thlak zung zung theih)
// =========================================================================
const TARIFF_CONFIG = {
  "LT1": {
    "name": "Kutir Jyoti Service",
    "fixedCharge": 25.00,
    "slabs": [
      { "upto": 20, "rate": 2.55, "fullRate": 7.89 },
      { "upto": null, "rate": 3.55, "fullRate": 10.98 }
    ]
  },
  "LT2": {
    "name": "Domestic Service",
    "fixedCharge": 50.00,
    "slabs": [
      { "upto": 100, "rate": 4.90, "fullRate": 9.11 },
      { "upto": 200, "rate": 7.10, "fullRate": 9.84 },
      { "upto": null, "rate": 8.20, "fullRate": 10.29 }
    ]
  },
  "LT3": {
    "name": "Non-Profit Public Service",
    "fixedCharge": 60.00,
    "slabs": [
      { "upto": 150, "rate": 7.60, "fullRate": 10.74 },
      { "upto": null, "rate": 8.30, "fullRate": 11.73 }
    ]
  },
  "LT4": {
    "name": "Commercial Service",
    "fixedCharge": 80.00,
    "slabs": [
      { "upto": 150, "rate": 8.20, "fullRate": 12.04 },
      { "upto": null, "rate": 8.45, "fullRate": 12.40 }
    ]
  },
  "LT5": {
    "name": "Public Lighting Service",
    "fixedCharge": 80.00,
    "slabs": [
      { "upto": null, "rate": 11.35, "fullRate": 13.00 }
    ]
  },
  "LT6": {
    "name": "Public Water Works",
    "fixedCharge": 90.00,
    "slabs": [
      { "upto": null, "rate": 11.10, "fullRate": 12.16 }
    ]
  },
  "LT7": {
    "name": "Irrigation & Agriculture Service",
    "fixedCharge": 50.00,
    "slabs": [
      { "upto": null, "rate": 3.80, "fullRate": 13.00 }
    ]
  },
  "LT8": {
    "name": "Industrial Service",
    "fixedCharge": 80.00,
    "slabs": [
      { "upto": 400, "rate": 7.10, "fullRate": 11.81 },
      { "upto": null, "rate": 8.05, "fullRate": 12.27 }
    ]
  }
};

// ==========================================
// HTML Controls (I UI-a Id awm sa thlap kha)
// ==========================================
const category = document.getElementById("category");
const load = document.getElementById("load");
const previous = document.getElementById("previous");
const current = document.getElementById("current");
const days = document.getElementById("days");
const arrear = document.getElementById("arrear");
const adjustment = document.getElementById("adjustment");

const unitsText = document.getElementById("units");
const energyText = document.getElementById("energy");
const fixedText = document.getElementById("fixed");
const subsidyText = document.getElementById("subsidy");
const totalText = document.getElementById("total");

const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");

// Event Listeners Binding
calculateBtn.addEventListener("click", calculateBill);

resetBtn.addEventListener("click", () => {
    category.value = "";
    previous.value = "";
    current.value = "";
    load.value = "";
    days.value = "";
    arrear.value = 0;
    adjustment.value = 0;

    unitsText.innerHTML = "0.00";
    energyText.innerHTML = "₹0.00";
    fixedText.innerHTML = "₹0.00";
    subsidyText.innerHTML = "₹0.00";
    totalText.innerHTML = "₹0.00";
});

// ==========================================
// Prorata Main Calculation Function
// ==========================================
function calculateBill() {
    if (category.value == "") {
        alert("Select Consumer Category");
        return;
    }

    let currentVal = parseFloat(current.value || 0);
    let previousVal = parseFloat(previous.value || 0);
    let unit = currentVal - previousVal;

    if (unit < 0) {
        alert("Current Reading must be greater than or equal to Previous Reading.");
        return;
    }

    let contractedLoad = parseFloat(load.value || 0);
    if (contractedLoad <= 0) {
        alert("Contracted Load must be greater than zero.");
        return;
    }

    let billDays = parseFloat(days.value || 30);
    if (billDays <= 0) {
        alert("Billing Days must be greater than zero.");
        return;
    }

    let arrears = parseFloat(arrear.value || 0);
    let adjust = parseFloat(adjustment.value || 0);

    let tariff = TARIFF_CONFIG[category.value];
    if (!tariff) {
        alert("Tariff Not Found");
        return;
    }

    // Prorata Factor (Ni hman zat / 30)
    let prorata = billDays / 30;

    let fullEnergy = 0;
    let subsidizedEnergy = 0;
    let remaining = unit;
    let previousLimit = 0;

    // Prorata Slab System chhut dan
    if (tariff.slabs) {
        for (let slab of tariff.slabs) {
            let slabLimit;

            if (slab.upto == null) {
                slabLimit = remaining;
            } else {
                slabLimit = (slab.upto - previousLimit) * prorata;
            }

            let consume = Math.min(remaining, slabLimit);

            if (consume > 0) {
                let fRate = slab.fullRate !== undefined ? slab.fullRate : slab.rate;
                
                // P&E Department math precision formula chiah chiah:
                // Unit tling bik hmasa kan la anga, a decimal baki chu a rate dik takin kan belh leh ang
                let integerUnits = Math.floor(consume);
                let decimalUnits = consume - integerUnits;

                fullEnergy += (integerUnits * fRate) + (decimalUnits * fRate);
                subsidizedEnergy += (integerUnits * slab.rate) + (decimalUnits * slab.rate);
                
                remaining -= consume;
            }

            if (slab.upto != null) {
                previousLimit = slab.upto;
            }

            if (remaining <= 0) {
                break;
            }
        }
    }

    // Fixed Charge Prorata
    let fixedCharge = tariff.fixedCharge * contractedLoad * prorata;

    // Subsidy (Full Cost - Subsidized Cost)
    let subsidy = fullEnergy - subsidizedEnergy;
    if (subsidy < 0) subsidy = 0;

    // Net Energy Charge
    let finalEnergyCharge = fullEnergy - subsidy;

    // Grand Total: (Full Cost Energy + Fixed Charge + Arrears + Adjust) - Subsidy
    let total = (fullEnergy + fixedCharge + arrears + adjust) - subsidy;

    // ====================================================================
    // DISPLAY OUTPUTS (P&E Department Tih Dan Chiah Chiah)
    // ====================================================================
    unitsText.innerHTML = unit.toFixed(2);
    
    // P&E precision rounding mil hian (.76) chiah chiah a rawn chhuak tawh ang e
    energyText.textContent = "₹" + (Math.round(fullEnergy * 100) / 100).toFixed(2);
    fixedText.textContent = "₹" + fixedCharge.toFixed(2);
    subsidyText.textContent = "-₹" + (Math.round(subsidy * 100) / 100).toFixed(2);
    totalText.textContent = "₹" + Math.round(total).toFixed(2);
}