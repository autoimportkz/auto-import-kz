(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var burger = document.querySelector(".site-header__burger");
  var mobileNav = document.getElementById("site-nav-mobile");
  var leadForm = document.getElementById("lead-form");
  var calculator = document.getElementById("cost-calculator");

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  function closeMobileNav() {
    if (!burger || !mobileNav) return;
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openMobileNav() {
    burger.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      if (mobileNav.classList.contains("is-open")) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileNav);
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      var target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      closeMobileNav();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  function getCalculatorValue(name) {
    if (!calculator) return 0;
    var field = calculator.elements[name];
    var value = field ? Number(field.value) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function getCalculatorText(name) {
    if (!calculator) return "";
    var field = calculator.elements[name];
    return field ? String(field.value || "") : "";
  }

  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatKzt(value) {
    return new Intl.NumberFormat("ru-KZ", {
      style: "currency",
      currency: "KZT",
      maximumFractionDigits: 0
    }).format(value);
  }

  function findTierFee(value, tiers) {
    for (var i = 0; i < tiers.length; i += 1) {
      if (value <= tiers[i].max) {
        return tiers[i].rate ? value * tiers[i].rate : tiers[i].fee;
      }
    }

    return 0;
  }

  function calculateCopartAuctionFee(lot) {
    var buyerFee = findTierFee(lot, [
      { max: 49.99, fee: 25 },
      { max: 99.99, fee: 45 },
      { max: 199.99, fee: 80 },
      { max: 299.99, fee: 130 },
      { max: 349.99, fee: 132.5 },
      { max: 399.99, fee: 135 },
      { max: 449.99, fee: 170 },
      { max: 499.99, fee: 180 },
      { max: 549.99, fee: 200 },
      { max: 599.99, fee: 205 },
      { max: 699.99, fee: 235 },
      { max: 799.99, fee: 260 },
      { max: 899.99, fee: 280 },
      { max: 999.99, fee: 305 },
      { max: 1199.99, fee: 355 },
      { max: 1299.99, fee: 380 },
      { max: 1399.99, fee: 400 },
      { max: 1499.99, fee: 410 },
      { max: 1599.99, fee: 430 },
      { max: 1699.99, fee: 450 },
      { max: 1799.99, fee: 465 },
      { max: 1999.99, fee: 490 },
      { max: 2399.99, fee: 525 },
      { max: 2499.99, fee: 550 },
      { max: 2999.99, fee: 575 },
      { max: 3499.99, fee: 650 },
      { max: 3999.99, fee: 700 },
      { max: 4499.99, fee: 725 },
      { max: 4999.99, fee: 750 },
      { max: 5999.99, fee: 775 },
      { max: 7499.99, fee: 800 },
      { max: 7999.99, fee: 825 },
      { max: 8499.99, fee: 850 },
      { max: 8999.99, fee: 850 },
      { max: 9999.99, fee: 850 },
      { max: 10499.99, fee: 900 },
      { max: 10999.99, fee: 900 },
      { max: 11499.99, fee: 900 },
      { max: 11999.99, fee: 900 },
      { max: 12499.99, fee: 900 },
      { max: 14999.99, fee: 900 },
      { max: Infinity, rate: 0.075 }
    ]);
    var virtualBidFee = findTierFee(lot, [
      { max: 99.99, fee: 0 },
      { max: 499.99, fee: 49 },
      { max: 999.99, fee: 59 },
      { max: 1499.99, fee: 79 },
      { max: 1999.99, fee: 89 },
      { max: 3999.99, fee: 99 },
      { max: 5999.99, fee: 109 },
      { max: 7999.99, fee: 139 },
      { max: Infinity, fee: 149 }
    ]);

    return buyerFee + virtualBidFee + 79 + 10;
  }

  function calculateIaaiAuctionFee(lot) {
    var buyerFee = findTierFee(lot, [
      { max: 99.99, fee: 1 },
      { max: 199.99, fee: 40 },
      { max: 299.99, fee: 60 },
      { max: 349.99, fee: 75 },
      { max: 399.99, fee: 90 },
      { max: 499.99, fee: 100 },
      { max: 599.99, fee: 130 },
      { max: 699.99, fee: 145 },
      { max: 799.99, fee: 160 },
      { max: 899.99, fee: 175 },
      { max: 999.99, fee: 190 },
      { max: 1199.99, fee: 220 },
      { max: 1299.99, fee: 230 },
      { max: 1399.99, fee: 255 },
      { max: 1499.99, fee: 270 },
      { max: 1599.99, fee: 290 },
      { max: 1699.99, fee: 305 },
      { max: 1799.99, fee: 320 },
      { max: 1999.99, fee: 340 },
      { max: 2399.99, fee: 390 },
      { max: 2499.99, fee: 410 },
      { max: 2999.99, fee: 470 },
      { max: 3499.99, fee: 510 },
      { max: 3999.99, fee: 550 },
      { max: 4499.99, fee: 600 },
      { max: 4999.99, fee: 625 },
      { max: 5999.99, fee: 650 },
      { max: 7499.99, fee: 700 },
      { max: 7999.99, fee: 725 },
      { max: 8499.99, fee: 750 },
      { max: 8999.99, fee: 775 },
      { max: 9999.99, fee: 800 },
      { max: 14999.99, fee: 850 },
      { max: Infinity, rate: 0.075 }
    ]);
    var onlineFee = findTierFee(lot, [
      { max: 99.99, fee: 0 },
      { max: 499.99, fee: 50 },
      { max: 999.99, fee: 65 },
      { max: 1499.99, fee: 85 },
      { max: 1999.99, fee: 95 },
      { max: 3999.99, fee: 110 },
      { max: 5999.99, fee: 125 },
      { max: 7999.99, fee: 145 },
      { max: Infinity, fee: 160 }
    ]);

    return buyerFee + onlineFee + 95 + 15;
  }

  function calculateAuctionFee(lot, type, manualFee) {
    if (type === "manual") return manualFee;
    if (type === "iaai") return calculateIaaiAuctionFee(lot);
    return calculateCopartAuctionFee(lot);
  }

  function getVehicleAgeGroup(year) {
    if (year >= 2025) return "under2";
    if (year === 2024) return "twoToThree";
    if (year >= 2021) return "threeToFive";
    return "overFive";
  }

  function getDutyPerCc(ageGroup, engine) {
    if (ageGroup === "threeToFive") {
      if (engine <= 1000) return 1.5;
      if (engine <= 1500) return 1.7;
      if (engine <= 1800) return 2.5;
      if (engine <= 2300) return 2.7;
      if (engine <= 3000) return 3;
      return 3.6;
    }

    if (engine <= 1000) return 3;
    if (engine <= 1500) return 3.2;
    if (engine <= 1800) return 3.5;
    if (engine <= 2300) return 4.8;
    if (engine <= 3000) return 5;
    return 5.7;
  }

  function calculateCustomsDuty(customsValueKzt, lotUsd, engine, ageGroup, eurRate, isElectric) {
    if (isElectric) return 0;

    if (ageGroup === "under2" || ageGroup === "twoToThree") {
      var percent = lotUsd <= 8500 ? 0.54 : 0.48;
      var minRate = 2.5;

      if (lotUsd > 169000) {
        minRate = 20;
      } else if (lotUsd > 84500) {
        minRate = 15;
      } else if (lotUsd > 42300) {
        minRate = 7.5;
      } else if (lotUsd > 16700) {
        minRate = 5.5;
      } else if (lotUsd > 8500) {
        minRate = 3.5;
      }

      return Math.max(customsValueKzt * percent, engine * minRate * eurRate);
    }

    return engine * getDutyPerCc(ageGroup, engine) * eurRate;
  }

  function calculateRecyclingFee(engine, isElectric) {
    var mrp = 4325;
    var base = 50 * mrp;

    if (isElectric) return 0;
    if (engine <= 1000) return base * 1.5;
    if (engine <= 2000) return base * 3.5;
    if (engine <= 3000) return base * 5;
    return base * 11.5;
  }

  function calculatePrimaryRegistration(ageGroup, isElectric) {
    var mrp = 4325;

    if (ageGroup === "under2") return 0.25 * mrp;
    if (ageGroup === "twoToThree") return (isElectric ? 25 : 50) * mrp;
    return (isElectric ? 250 : 500) * mrp;
  }

  function setCalculatorRow(name, value) {
    var target = calculator ? calculator.querySelector('[data-calc="' + name + '"]') : null;
    if (target) {
      target.textContent = formatKzt(value);
    }
  }

  function updateManualAuctionField(type) {
    if (!calculator) return;
    var manualField = calculator.elements.auctionManual;
    if (!manualField) return;

    manualField.disabled = type !== "manual";
    manualField.closest(".lead-form__field").classList.toggle("is-disabled", type !== "manual");
  }

  function updateCalculator() {
    if (!calculator) return;

    var lot = getCalculatorValue("lot");
    var customsAssessment = getCalculatorValue("customsAssessment");
    var auctionType = getCalculatorText("auctionType");
    var auction = calculateAuctionFee(lot, auctionType, getCalculatorValue("auctionManual"));
    var inland = getCalculatorValue("inland");
    var ocean = getCalculatorValue("ocean");
    var service = getCalculatorValue("service");
    var repair = getCalculatorValue("repair");
    var georgiaDocs = getCalculatorValue("georgiaDocs");
    var kazakhstanTransport = getCalculatorValue("kazakhstanTransport");
    var kzDocs = getCalculatorValue("kzDocs");
    var usdRate = getCalculatorValue("usdRate");
    var eurRate = getCalculatorValue("eurRate");
    var year = Math.round(getCalculatorValue("year"));
    var engine = getCalculatorValue("engine");
    var fuel = getCalculatorText("fuel");
    var isElectric = fuel === "electric";
    var ageGroup = getVehicleAgeGroup(year);
    var customsBaseUsd = Math.max(lot, customsAssessment);
    var customsValueKzt = (customsBaseUsd + auction + inland + ocean) * usdRate;
    var baseKzt = (lot + inland + ocean + service) * usdRate;
    var auctionKzt = auction * usdRate;
    var repairKzt = repair * usdRate;
    var georgiaDocsKzt = georgiaDocs * usdRate;
    var kazakhstanTransportKzt = kazakhstanTransport * usdRate;
    var kzDocsKzt = kzDocs * usdRate;
    var customsFee = 20000;
    var duty = calculateCustomsDuty(customsValueKzt, customsBaseUsd, engine, ageGroup, eurRate, isElectric);
    var recycling = calculateRecyclingFee(engine, isElectric);
    var primary = calculatePrimaryRegistration(ageGroup, isElectric);
    var plates = 4.05 * 4325;
    var kzRegistration = kzDocsKzt + primary + plates;
    var totalKzt =
      baseKzt +
      auctionKzt +
      repairKzt +
      georgiaDocsKzt +
      kazakhstanTransportKzt +
      customsFee +
      duty +
      recycling +
      kzRegistration;
    var usdTarget = document.getElementById("calculator-total-usd");
    var kztTarget = document.getElementById("calculator-total-kzt");
    var auctionTarget = document.getElementById("auction-fee-usd");

    updateManualAuctionField(auctionType);
    setCalculatorRow("base", baseKzt);
    setCalculatorRow("auction", auctionKzt);
    setCalculatorRow("repair", repairKzt);
    setCalculatorRow("georgiaDocs", georgiaDocsKzt);
    setCalculatorRow("kazakhstanTransport", kazakhstanTransportKzt);
    setCalculatorRow("customsFee", customsFee);
    setCalculatorRow("duty", duty);
    setCalculatorRow("recycling", recycling);
    setCalculatorRow("kzRegistration", kzRegistration);

    if (auctionTarget) {
      auctionTarget.textContent = formatUsd(auction);
    }

    if (usdTarget) {
      usdTarget.textContent = usdRate ? formatUsd(totalKzt / usdRate) : "Укажите курс $";
    }

    if (kztTarget) {
      kztTarget.textContent = formatKzt(totalKzt);
    }
  }

  if (calculator) {
    calculator.addEventListener("input", updateCalculator);
    updateCalculator();
  }

  var WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbwkDxNCLCagHmeVBINmFkhO6sWy-2W83dd1bPbyK8872k0qkkN0CNBF8aSh42X4q8rUEg/exec";

  if (leadForm) {
    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!leadForm.checkValidity()) {
        leadForm.reportValidity();
        return;
      }

      var data = new FormData(leadForm);
      var payload = {
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        budget: String(data.get("budget") || "").trim(),
        car: String(data.get("car") || "").trim(),
        comment: String(data.get("comment") || "").trim()
      };

      var submitBtn = leadForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      })
        .then(function () {
          alert("Заявка отправлена! Мы скоро свяжемся с вами.");
          leadForm.reset();
        })
        .catch(function () {
          alert("Ошибка отправки. Напишите нам в Telegram.");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
          }
        });
    });
  }
})();
