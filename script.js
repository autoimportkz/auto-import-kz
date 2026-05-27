(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var burger = document.querySelector(".site-header__burger");
  var mobileNav = document.getElementById("site-nav-mobile");
  var leadForm = document.getElementById("lead-form");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Webhook request failed");
          }
          return response.text();
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
