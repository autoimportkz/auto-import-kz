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

  function updateCalculator() {
    if (!calculator) return;

    var lot = getCalculatorValue("lot");
    var auction = getCalculatorValue("auction");
    var inland = getCalculatorValue("inland");
    var ocean = getCalculatorValue("ocean");
    var service = getCalculatorValue("service");
    var usdRate = getCalculatorValue("usdRate");
    var eurRate = getCalculatorValue("eurRate");
    var year = Math.round(getCalculatorValue("year"));
    var engine = getCalculatorValue("engine");
    var fuel = getCalculatorText("fuel");
    var isElectric = fuel === "electric";
    var ageGroup = getVehicleAgeGroup(year);
    var customsValueKzt = (lot + auction + inland + ocean) * usdRate;
    var baseKzt = (lot + auction + inland + ocean + service) * usdRate;
    var customsFee = 20000;
    var duty = calculateCustomsDuty(customsValueKzt, lot, engine, ageGroup, eurRate, isElectric);
    var recycling = calculateRecyclingFee(engine, isElectric);
    var primary = calculatePrimaryRegistration(ageGroup, isElectric);
    var plates = 4.05 * 4325;
    var totalKzt = baseKzt + customsFee + duty + recycling + primary + plates;
    var usdTarget = document.getElementById("calculator-total-usd");
    var kztTarget = document.getElementById("calculator-total-kzt");

    setCalculatorRow("base", baseKzt);
    setCalculatorRow("customsFee", customsFee);
    setCalculatorRow("duty", duty);
    setCalculatorRow("recycling", recycling);
    setCalculatorRow("primary", primary);
    setCalculatorRow("plates", plates);

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
