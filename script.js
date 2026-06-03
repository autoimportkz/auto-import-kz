(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var burger = document.querySelector(".site-header__burger");
  var mobileNav = document.getElementById("site-nav-mobile");
  var leadForm = document.getElementById("lead-form");
  var calculator = document.getElementById("cost-calculator");
  var finderForm = document.getElementById("finder-form");
  var customsValues = Array.isArray(window.CUSTOMS_VALUES) ? window.CUSTOMS_VALUES : [];
  var customsMakes = document.getElementById("customs-makes");
  var customsModels = document.getElementById("customs-models");

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

  function normalizeVehicleText(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/Ё/g, "Е")
      .replace(/[^0-9A-ZА-Я]+/g, "");
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, "ru");
    });
  }

  function fillDatalist(target, values) {
    if (!target) return;
    target.innerHTML = uniqueSorted(values)
      .map(function (value) {
        return '<option value="' + String(value).replace(/"/g, "&quot;") + '"></option>';
      })
      .join("");
  }

  function getCustomsCandidates(make, model) {
    var makeKey = normalizeVehicleText(make);
    var modelKey = normalizeVehicleText(model);

    if (!makeKey || !modelKey) return [];

    return customsValues.filter(function (item) {
      return normalizeVehicleText(item.make) === makeKey && normalizeVehicleText(item.model) === modelKey;
    });
  }

  function chooseCustomsBaseYear(rows, year) {
    var exact = rows.filter(function (item) {
      return item.year === year;
    });

    if (exact.length) {
      return {
        rows: exact,
        baseYear: year,
        yearDelta: 0,
        source: "exact"
      };
    }

    var newerYears = Array.from(new Set(rows.map(function (item) {
      return item.year;
    }))).sort(function (a, b) {
      return a - b;
    }).filter(function (itemYear) {
      return itemYear > year;
    });
    var baseYear = newerYears.length ? Number(newerYears[0]) : Math.max.apply(null, rows.map(function (item) {
      return item.year;
    }));

    return {
      rows: rows.filter(function (item) {
        return item.year === baseYear;
      }),
      baseYear: baseYear,
      yearDelta: Math.max(0, baseYear - year),
      source: "depreciated"
    };
  }

  function chooseCustomsRow(rows, engine, isElectric) {
    if (!rows.length) return null;

    if (isElectric) {
      return rows.find(function (item) {
        return item.electric;
      }) || rows[0];
    }

    return rows
      .filter(function (item) {
        return !item.electric && Number(item.engine) > 0;
      })
      .sort(function (a, b) {
        return Math.abs(a.engine - engine) - Math.abs(b.engine - engine);
      })[0] || rows[0];
  }

  function getCustomsTableValue(make, model, year, engine, isElectric) {
    var candidates = getCustomsCandidates(make, model);

    if (!candidates.length || !year) return null;

    var yearPick = chooseCustomsBaseYear(candidates, year);
    var row = chooseCustomsRow(yearPick.rows, engine, isElectric);
    if (!row) return null;

    var value = row.value * Math.pow(0.85, yearPick.yearDelta);

    return {
      value: Math.round(value),
      row: row,
      baseYear: yearPick.baseYear,
      yearDelta: yearPick.yearDelta,
      source: yearPick.source
    };
  }

  function updateCustomsModelOptions() {
    if (!calculator || !customsModels) return;
    var make = getCalculatorText("make");
    var makeKey = normalizeVehicleText(make);
    var models = customsValues
      .filter(function (item) {
        return !makeKey || normalizeVehicleText(item.make) === makeKey;
      })
      .map(function (item) {
        return item.model;
      });

    fillDatalist(customsModels, models);
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
    var currentYear = new Date().getFullYear();
    var age = currentYear - year;

    if (age > 7) return "overSeven";
    if (age < 2) return "under2";
    if (age <= 3) return "twoToThree";
    if (age <= 5) return "threeToFive";
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

  function calculateCustomsDuty(customsValueKzt, customsValueEur, engine, ageGroup, eurRate, isElectric) {
    if (isElectric) return 0;
    if (ageGroup === "overSeven") return engine * 0.6 * eurRate;

    if (ageGroup === "under2" || ageGroup === "twoToThree") {
      var percent = customsValueEur <= 8500 ? 0.54 : 0.48;
      var minRate = 2.5;

      if (customsValueEur > 169000) {
        minRate = 20;
      } else if (customsValueEur > 84500) {
        minRate = 15;
      } else if (customsValueEur > 42300) {
        minRate = 7.5;
      } else if (customsValueEur > 16700) {
        minRate = 5.5;
      } else if (customsValueEur > 8500) {
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
    var target = document.querySelector('[data-calc="' + name + '"]');
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
    var make = getCalculatorText("make");
    var model = getCalculatorText("model");
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
    var dutyManualKzt = getCalculatorValue("dutyManualKzt");
    var year = Math.round(getCalculatorValue("year"));
    var engine = getCalculatorValue("engine");
    var fuel = getCalculatorText("fuel");
    var isElectric = fuel === "electric";
    var ageGroup = getVehicleAgeGroup(year);
    var customsTableValue = getCustomsTableValue(make, model, year, engine, isElectric);
    var tableAssessment = customsTableValue ? customsTableValue.value : 0;
    var customsBaseUsd = Math.max(lot, customsAssessment, tableAssessment);
    var customsValueKzt = (customsBaseUsd + auction + inland + ocean) * usdRate;
    var customsValueEur = eurRate ? customsValueKzt / eurRate : 0;
    var lotKzt = lot * usdRate;
    var baseKzt = (lot + inland + ocean + service) * usdRate;
    var auctionKzt = auction * usdRate;
    var repairKzt = repair * usdRate;
    var georgiaDocsKzt = georgiaDocs * usdRate;
    var kazakhstanTransportKzt = kazakhstanTransport * usdRate;
    var kzDocsKzt = kzDocs * usdRate;
    var customsFee = 20000;
    var calculatedDuty = calculateCustomsDuty(customsValueKzt, customsValueEur, engine, ageGroup, eurRate, isElectric);
    var duty = dutyManualKzt || calculatedDuty;
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
    var customsValueTarget = document.getElementById("customs-value-usd");
    var customsNoteTarget = document.getElementById("customs-value-note");

    updateManualAuctionField(auctionType);
    setCalculatorRow("lot", lotKzt);
    setCalculatorRow("delivery", baseKzt - lotKzt + auctionKzt + repairKzt + georgiaDocsKzt + kazakhstanTransportKzt);
    setCalculatorRow("customs", customsFee + duty);
    setCalculatorRow("recycling", recycling);
    setCalculatorRow("kzRegistration", kzRegistration);

    if (auctionTarget) {
      auctionTarget.textContent = formatUsd(auction);
    }

    if (customsValueTarget) {
      customsValueTarget.textContent = tableAssessment ? formatUsd(tableAssessment) : "$0";
    }

    if (customsNoteTarget) {
      if (!make || !model) {
        customsNoteTarget.textContent = "Выберите марку и модель — оценка таможни подтянется из таблицы.";
      } else if (!customsTableValue) {
        customsNoteTarget.textContent = "В таблице нет такой марки/модели. Калькулятор использует цену лота или ручную оценку.";
      } else if (customsTableValue.yearDelta > 0) {
        customsNoteTarget.textContent =
          "Оценка по таблице: " +
          customsTableValue.row.make +
          " " +
          customsTableValue.row.model +
          ", база " +
          customsTableValue.baseYear +
          ", минус 15% за " +
          customsTableValue.yearDelta +
          " г.";
      } else {
        customsNoteTarget.textContent =
          "Оценка по таблице: " +
          customsTableValue.row.make +
          " " +
          customsTableValue.row.model +
          ", " +
          customsTableValue.row.year +
          ".";
      }
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
    calculator.addEventListener("input", function (event) {
      if (event.target && event.target.name === "make") updateCustomsModelOptions();
    });
    calculator.classList.add("is-quick");
    fillDatalist(customsMakes, customsValues.map(function (item) {
      return item.make;
    }));
    updateCustomsModelOptions();
    document.querySelectorAll("[data-calc-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        var mode = button.getAttribute("data-calc-mode") || "quick";
        calculator.classList.toggle("is-quick", mode === "quick");
        document.querySelectorAll("[data-calc-mode]").forEach(function (tab) {
          tab.classList.toggle("is-active", tab === button);
        });
      });
    });
    updateCalculator();
  }

  var WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbws0Y9SAD9tpcSVSii3vkAbXD0N9IaqgS1naTYBMQsyu0QJsnwxl-P1jbb6YqeT7VValQ/exec";

  function sendLeadPayload(form, payload, successMessage) {
    var submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    return fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    })
      .then(function () {
        alert(successMessage);
        form.reset();
        if (form === calculator) updateCalculator();
      })
      .catch(function () {
        alert("Ошибка отправки. Напишите нам в Telegram.");
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      });
  }

  if (leadForm) {
    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!leadForm.checkValidity()) {
        leadForm.reportValidity();
        return;
      }

      var data = new FormData(leadForm);

      sendLeadPayload(leadForm, {
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        budget: String(data.get("budget") || "").trim(),
        car: String(data.get("car") || "").trim(),
        comment: String(data.get("comment") || "").trim(),
        pageUrl: window.location.href,
        submittedAt: new Date().toISOString()
      }, "Заявка отправлена! Мы скоро свяжемся с вами.");
    });
  }

  if (finderForm) {
    finderForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!finderForm.checkValidity()) {
        finderForm.reportValidity();
        return;
      }

      var data = new FormData(finderForm);
      var budget = String(data.get("budgetKzt") || "").trim();
      var bodyType = String(data.get("bodyType") || "").trim();
      var preferredMake = String(data.get("preferredMake") || "").trim();

      sendLeadPayload(finderForm, {
        name: "Заявка на подбор авто",
        phone: String(data.get("phone") || "").trim(),
        budget: budget ? budget + " ₸" : "Не указан",
        car: [preferredMake || "Любая марка", bodyType].filter(Boolean).join(", "),
        comment: "Клиент нажал «Найти авто под мой бюджет». Нужно подобрать варианты и закрыть на консультацию.",
        pageUrl: window.location.href + "#finder",
        submittedAt: new Date().toISOString()
      }, "Заявка на подбор отправлена! Мы скоро свяжемся с вами.");
    });
  }
})();
